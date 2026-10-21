// Run from the repository root: node scripts/cap-morph-animation-check.mjs
// Uses the project's existing TypeScript compiler; no DOM or extra test dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const featureRoot = new URL('../src/features/cap-morph/', import.meta.url);
const compile = (path, extra = '') => ts.transpileModule(
  fs.readFileSync(new URL(path, featureRoot), 'utf8') + extra,
  { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

let time = 0;
let nextFrameId = 0;
const frames = new Map();
const document = { visibilityState: 'visible' };
const animationModule = {
  exports: {},
  require,
  performance: { now: () => time },
  document,
  requestAnimationFrame(callback) {
    const id = ++nextFrameId;
    frames.set(id, callback);
    return id;
  },
  cancelAnimationFrame: (id) => frames.delete(id),
};
// Expose the actual internal controller only inside this isolated test module.
vm.runInNewContext(compile('hooks/useCapMorphAnimation.ts', '\nexport { createAnimationController };'), animationModule);
const createAnimation = animationModule.exports.createAnimationController;
const advance = (milliseconds) => {
  time += milliseconds;
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach(callback => callback(time));
};

const animation = createAnimation({});
assert.equal(frames.size, 0, 'Idle must not schedule RAF');
animation.playTo(1);
advance(270);
const midpoint = animation.getSnapshot().progress;
assert.ok(midpoint > 0 && midpoint < 1);
animation.playTo(0);
assert.equal(animation.getSnapshot().progress, midpoint, 'Reversal must preserve the current mesh position');
assert.equal(frames.size, 1, 'Reversal must leave exactly one RAF');
advance(780);
assert.equal(animation.getSnapshot().progress, 0);
assert.equal(frames.size, 0, 'A completed return must release RAF');

animation.playTo(1);
advance(200);
animation.pause();
const paused = animation.getSnapshot().progress;
advance(1000);
assert.equal(animation.getSnapshot().progress, paused, 'Pause must retain progress');
assert.equal(frames.size, 0, 'Pause must cancel RAF');
animation.resume();
advance(1000);
assert.equal(animation.getSnapshot().progress, 1);
assert.equal(frames.size, 0, 'The running cap must remain still');

animation.playTo(0);
advance(100);
document.visibilityState = 'hidden';
animation.handleVisibility();
assert.equal(frames.size, 0, 'A hidden tab must cancel RAF');
const hiddenProgress = animation.getSnapshot().progress;
advance(3000);
assert.equal(animation.getSnapshot().progress, hiddenProgress);
document.visibilityState = 'visible';
animation.handleVisibility();
assert.equal(frames.size, 1, 'Visibility must resume the pending transition');

animation.seek(0.42);
assert.equal(animation.getSnapshot().progress, 0.42);
assert.equal(animation.getSnapshot().target, 0, 'Intermediate scrubbing must retain the return direction');
assert.equal(frames.size, 0, 'Scrubbing must pause playback');
animation.seek(1);
assert.equal(animation.getSnapshot().target, 1, 'Manual RUNNING must expose the stop state');
assert.equal(animation.getSnapshot().phase, 'running');
animation.seek(0);
assert.equal(animation.getSnapshot().target, 0, 'Manual IDLE must expose the send state');
assert.equal(animation.getSnapshot().phase, 'idle');
animation.seek(1);
animation.playTo(0);
assert.equal(animation.getSnapshot().phase, 'returning', 'The lab seek(1) + playTo(0) sequence must start returning');
animation.seek(0);
animation.playTo(1);
assert.equal(animation.getSnapshot().phase, 'transforming', 'The lab seek(0) + playTo(1) sequence must start transforming');
advance(90);
animation.setSpeed(2);
assert.equal(frames.size, 1, 'Changing speed must replace the existing RAF');
animation.configure({ durationMs: 780, reducedMotion: true, enabled: true });
assert.equal(animation.getSnapshot().progress, 1);
assert.equal(frames.size, 0, 'Reduced motion must settle without RAF');
animation.playTo(0);
assert.equal(animation.getSnapshot().progress, 0);
assert.equal(frames.size, 0);
animation.configure({ durationMs: 780, reducedMotion: false, enabled: true });
animation.playTo(1);
animation.dispose();
assert.equal(frames.size, 0, 'Unmount must release RAF');

// Run the actual component's handlers with controlled hook storage. This tests
// callback/optimistic-state races; browser checks separately cover DOM and WebGL.
function createButtonHarness() {
  const storage = [];
  let cursor = 0;
  let dirty = false;
  const effects = [];
  let animationOptions;
  const hooks = {
    ...require('react'),
    useState(initial) {
      const index = cursor++;
      if (!(index in storage)) storage[index] = typeof initial === 'function' ? initial() : initial;
      return [storage[index], (next) => {
        storage[index] = typeof next === 'function' ? next(storage[index]) : next;
        dirty = true;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in storage)) storage[index] = { current: initial };
      return storage[index];
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      const previous = storage[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) effects.push(callback);
      storage[index] = dependencies;
    },
    useCallback: callback => callback,
  };
  const buttonModule = {
    exports: {},
    require(name) {
      if (name === 'react') return hooks;
      if (name.endsWith('.css')) return {};
      if (name.includes('useCapMorphAnimation')) return {
        useCapMorphAnimation: options => {
          animationOptions = options;
          return { progress: options.enabled ? options.target : 0, phase: options.target ? 'running' : 'idle', reducedMotion: false };
        },
      };
      return require(name);
    },
  };
  vm.runInNewContext(compile('components/MorphingSendButton.tsx'), buttonModule);
  let props = { state: 'idle', onSend() {}, onStop() {} };
  let element;
  const render = (patch = {}) => {
    props = { ...props, ...patch };
    do {
      dirty = false;
      cursor = 0;
      element = buttonModule.exports.MorphingSendButton(props);
    } while (dirty);
    effects.splice(0).forEach(effect => effect());
    return element;
  };
  return { render, click: () => element.props.onClick(), getAnimationOptions: () => animationOptions };
}

function sceneProps(element) {
  if (!element?.props) return null;
  if (element.props.onAvailabilityChange) return element.props;
  const children = element.props.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = sceneProps(child);
    if (found) return found;
  }
  return null;
}

const warmed = createButtonHarness();
const untouched = warmed.render();
assert.equal(sceneProps(untouched), null, 'An untouched idle button must not mount a GPU scene');
untouched.props.onFocus();
const preparing = warmed.render();
assert.ok(sceneProps(preparing), 'Focus must mount a scene for shader/model prewarming');
assert.equal(preparing.props['data-scene'], 'fallback', 'Idle prewarming must preserve the red circle');
sceneProps(preparing).onAvailabilityChange(true);
const readyIdle = warmed.render();
assert.equal(readyIdle.props['data-scene'], 'fallback', 'A ready idle scene must remain hidden');
assert.ok(sceneProps(readyIdle), 'The prewarmed scene must remain mounted without an idle loop');

const cold = createButtonHarness();
let coldSends = 0;
cold.render({ onSend: () => { coldSends++; } });
cold.click();
const coldActive = cold.render();
assert.equal(coldSends, 1, 'Cold scene preparation must not delay business dispatch');
assert.equal(coldActive.props['data-action'], 'stop', 'Cold startup must still allow immediate cancellation');
assert.equal(cold.getAnimationOptions().enabled, false, 'Cold startup must preserve the full transition until a frame is ready');
sceneProps(coldActive).onAvailabilityChange(true);
assert.equal(cold.render().props['data-scene'], 'ready');
assert.equal(cold.getAnimationOptions().enabled, true, 'A successful first frame must release the visual transition');
cold.render({ state: 'queued' });
const settledIdle = cold.render({ state: 'idle' });
assert.ok(sceneProps(settledIdle), 'Returning to idle must reuse the same ready scene');
assert.equal(settledIdle.props['data-scene'], 'fallback', 'The idle surface must never depend on stale scene readiness');

const button = createButtonHarness();
let sends = 0;
let stops = 0;
button.render({ onSend: () => { sends++; }, onStop: () => { stops++; } });
button.click();
assert.equal(sends, 1, 'Send must dispatch immediately');
assert.equal(button.render().props['data-action'], 'stop', 'Stop must be available before the parent acknowledges send');
button.click();
assert.equal(stops, 1, 'An optimistic send must be cancellable');
assert.equal(button.render().props['data-action'], 'send', 'An unchanged idle parent must clear optimistic stop');
button.click();
assert.equal(sends, 2, 'An unchanged idle parent must permit sending again after stop');
button.render({ state: 'queued' });
button.click();
button.click();
assert.equal(stops, 2, 'Duplicate stop must be guarded while authoritative state stays busy');
button.render({ state: 'idle' });
button.click();
assert.equal(sends, 3, 'Parent acknowledgement must release the next send');
button.render({ state: 'running' });
button.render({ state: 'completed' });
assert.equal(button.render({ state: 'idle' }).props['data-action'], 'send', 'Returning to idle must not revive a previous optimistic send');
button.render({ disabled: true });
button.click();
assert.equal(sends, 3, 'Disabled buttons must not send');

console.log('PASS: cap morph timing, endpoints, cleanup, scene warmup, and optimistic send/stop races');
