import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import DomainIcon from '../ui/components/chat/DomainIcon';

// 실제 도메인 목록(GET /capabilities로 오는 값과 동일한 코드·라벨).
const DOMAINS = [
  { code: 'HR', label: '인사·복지' },
  { code: 'TECH', label: '정보화·보안' },
  { code: 'FINANCE_LEGAL', label: '재무·법무' },
  { code: 'GENERAL', label: '일반' },
  { code: 'MANUAL', label: '교범' },
  { code: 'DIRECTIVE', label: '훈령' },
];

// ─────────────────────────────────────────────────────────────
// 데이터
// ─────────────────────────────────────────────────────────────
const SMARTS = [
  { title: '근거 기반의 정직한 답변', desc: '충분한 근거를 찾지 못한 경우 추측 대신 담당 부서 문의를 안내합니다.' },
  { title: '참고자료 구분 안내', desc: '규정과 직접 관련이 없는 자료는 참고용으로 별도 구분해 안내합니다.' },
  { title: '도메인별 정확도 향상', desc: '인사·복지, 정보화·보안 등으로 범위를 좁히면 답변 정확도가 높아집니다.' },
  { title: '문서함 직접 탐색', desc: '대화 없이도 카테고리·검색어로 전체 문서를 바로 열람할 수 있습니다.' },
];

const TIPS = [
  { n: 1, text: '"휴가"보다 "정기휴가 신청 절차"처럼 구체적으로 물을수록 정확한 근거를 찾습니다.' },
  { n: 2, text: '답변이 범위를 벗어난 것 같다면 도메인을 좁혀 같은 질문을 다시 보내보세요.' },
  { n: 3, text: '중요한 결정 전에는 "출처 보기"로 펼친 원문 조항을 반드시 함께 확인하세요.' },
  { n: 4, text: '"해병대 창설 배경을 정리한 한글 문서를 만들어줘" 처럼 요청해 보세요. 직접 HWP파일로 만들어줄 수 있습니다!' }
];

const FAQ = [
  { q: 'MARS의 답변을 그대로 신뢰해도 되나요?', a: '모든 답변에는 근거가 된 규정 원문과 조항이 함께 제시됩니다. 다만 최종 결정 전에는 반드시 공식 규정 원문을 함께 확인하시기 바랍니다.' },
  { q: '도메인은 어떻게 선택하나요?', a: '메시지를 보내기 전 도메인 선택 영역에서 원하는 분야를 고르면, 해당 도메인 문서 안에서만 검색해 답합니다. 선택하지 않으면 전체 도메인에서 검색합니다.' },
  { q: '근거를 찾지 못하면 어떻게 되나요?', a: '충분한 근거를 찾지 못하면 MARS는 추측해서 답하지 않고, 질문을 구체화하거나 담당 부서에 문의하도록 솔직하게 안내합니다.' },
  { q: '대화 없이 문서만 찾아볼 수도 있나요?', a: '네, 사이드바의 "문서 검색"에서 카테고리 탭이나 검색창을 이용해 전체 문서를 직접 열람할 수 있습니다.' },
  { q: '개인정보나 민감한 내용을 입력해도 되나요?', a: '개인 식별정보나 부대 기밀에 해당하는 내용은 입력하지 않는 것을 권장합니다. 일반적인 규정·절차 문의 위주로 이용해 주세요.' },
];

const Q_TEXT = '해병대 창설과 그 배경에 대해 알려줄래?';
const ANSWER_LINES = [
  <h3 className="text-[20.5px] font-bold text-text-primary">대한민국 해병대 창설 배경</h3>,
  '대한민국 해병대는 1949년 4월 15일, 경상남도 창원시 진해구 덕산동에 위치한 진해 해군기지의 진해비행장(덕산비행장)에서 대한민국 해군에서 선발한 380명(장교 26명, 부사관 54명, 병 300명)의 병력으로 창설되었다.',
  '1948년 여수·순천 10·19 사건 진압에 참가한 해군 임시정대사령 신현준 중령이, 사건을 처음부터 끝까지 파악하고 있던 통영정 정장 공정식 대위가 작성한 초안을 바탕으로, "상륙군 없이 반란군을 완전히 진압하지 못한다"는 작전경과서를 보고하자 해군총사령관 손원일 제독이 해병대 창설을 지시했다.',
  '창설 직후의 해병대는...',
];

// ─────────────────────────────────────────────────────────────
// 스크롤 진입 시 fade/blur로 나타나는 래퍼 (원본의 [data-reveal])
// ─────────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = '',
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(28px)',
        filter: shown ? 'none' : 'blur(4px)',
        transition: 'opacity .85s cubic-bezier(.2,.7,.2,1), transform .85s cubic-bezier(.2,.7,.2,1), filter .85s cubic-bezier(.2,.7,.2,1)',
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 01 목업 — 질문이 타이핑됐다가 지워지는 루프
// ─────────────────────────────────────────────────────────────
function useTick(intervalMs = 80) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + intervalMs), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return t;
}

function Step01Mock() {
  const t = useTick();
  const q = Q_TEXT;
  const cycle = 5200;
  const p = t % cycle;
  let qLen: number;
  if (p < 2400) qLen = Math.floor((p / 2400) * q.length);
  else if (p < 3800) qLen = q.length;
  else if (p < 4400) qLen = Math.max(0, q.length - Math.floor(((p - 3800) / 600) * q.length));
  else qLen = 0;

  const showSend = qLen > 3;

  return (
    <div className="h-full flex flex-col items-center justify-center gap-7 p-10">
      <div className="text-center">
        <div className="text-[27px] font-extrabold leading-[1.4] text-text-primary">
          해병대님, <span className="text-brand">무엇을</span> 도와드릴까요?
        </div>
        <div className="mt-2.5 text-sm text-[#a89aa0]">법령·규정·규칙을 학습한 MARS가 근거와 함께 답합니다.</div>
      </div>
      <div className="w-full max-w-[440px]">
        <div className="rounded-[22px] bg-white border border-[#eee0e2] shadow-[0_8px_24px_rgba(150,0,40,0.05)]">
          <div className="min-h-[22px] px-[22px] pt-[18px] pb-1.5 text-[15px] text-text-primary">
            <span>{q.slice(0, qLen)}</span>
            <span className="inline-block w-0.5 h-4 bg-brand ml-px align-[-3px] animate-[blink_1.3s_ease-in-out_infinite]" />
          </div>
          <div className="flex items-center justify-between px-4 pt-1.5 pb-3.5">
            <div className="flex items-center gap-3">
              <PaperclipIcon />
              <DomainChip />
            </div>
            <span
              className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-brand to-[#ff2d55] flex items-center justify-center transition-all duration-500"
              style={{ opacity: showSend ? 1 : 0, transform: showSend ? 'scale(1)' : 'scale(.6)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
            </span>
          </div>
        </div>
        <div className="mt-3.5 text-center text-[11.5px] text-[#c2b5ba]">MARS v1.0.0은 AI이므로 실수를 할 수 있습니다.</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 도메인 선택 목업 — 실제 DomainPicker 드롭다운 디자인 그대로.
// 선택 항목이 순환하며 하이라이트돼 '고르는 느낌'을 준다.
// ─────────────────────────────────────────────────────────────
function DomainStepMock() {
  const t = useTick();
  // 2초마다 한 항목씩 순회 (전체=인덱스 -1 포함). 목록 + 전체.
  const total = DOMAINS.length + 1;
  const activeIdx = Math.floor((t / 2000) % total) - 1; // -1이면 '전체'

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-10">
      <div className="text-center">
        <div className="text-[20px] font-extrabold leading-[1.4] text-text-primary">검색할 범위를 골라보세요</div>
        <div className="mt-2 text-[13.5px] text-[#a89aa0]">선택한 도메인 안에서만 근거를 찾습니다.</div>
      </div>

      {/* 실제 DomainPicker 드롭다운과 동일한 스타일 */}
      <div className="w-[220px] rounded-2xl border border-surface-border shadow-[0_10px_30px_rgba(40,30,35,0.10)] p-1.5 bg-white">
        {DOMAINS.map((d, i) => (
          <GuideMenuRow key={d.code} active={activeIdx === i} icon={<DomainIcon code={d.code} size={14} />} label={d.label} />
        ))}
        <div className="my-1 h-px bg-surface-border mx-1.5" />
        <GuideMenuRow
          active={activeIdx === -1}
          icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h18" /></svg>}
          label="전체"
        />
      </div>
    </div>
  );
}

// DomainPicker의 MenuRow와 동일한 디자인의 정적 표시용 행.
function GuideMenuRow({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div
      className={`w-full flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl text-[13.5px] text-left transition-colors ${
        active ? 'bg-brand-subtle text-brand font-semibold' : 'text-text-secondary'
      }`}
    >
      <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${active ? 'bg-brand-soft text-brand' : 'bg-surface-subtle text-text-muted'}`}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {active && (
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 02 목업 — "생각하는 중" → 답변 줄이 한 줄씩 나타나는 루프
// ─────────────────────────────────────────────────────────────
function Step02Mock() {
  const t = useTick();
  const perLine = 850;
  const thinkFor = 1000;
  const cycle = thinkFor + ANSWER_LINES.length * perLine + 2800;
  const p = t % cycle;
  const thinking = p < thinkFor;
  const revealCount = thinking ? 0 : Math.min(ANSWER_LINES.length, Math.floor((p - thinkFor) / perLine) + 1);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 px-9 pt-8 pb-3 overflow-hidden">
        <div className="flex justify-end mb-5">
          <div className="max-w-[82%] px-5 py-3 rounded-[18px_18px_4px_18px] bg-gradient-to-br from-brand to-[#ff2d55] text-white text-[14.5px] leading-[1.5]">
            해병대 창설과 그 배경에 대해 알려줄래?
          </div>
        </div>
        <div
          className="text-sm text-[#a89aa0] overflow-hidden transition-all duration-500"
          style={{ opacity: thinking ? 1 : 0, maxHeight: thinking ? 24 : 0 }}
        >
          생각하는 중...
        </div>
        <div className="flex flex-col gap-2.5">
          {ANSWER_LINES.map((line, i) =>
            i < revealCount ? (
              <div key={i} className="text-[14.5px] leading-[1.75] text-[#33333a] animate-[lineIn_.5s_ease_both]">
                {line}
              </div>
            ) : null,
          )}
        </div>
      </div>
      <div className="relative px-6 pb-[22px]">
        <div className="rounded-[22px] bg-white border border-[#eee0e2]">
          <div className="px-5 pt-3.5 pb-1 text-sm text-[#b09aa0]">메시지를 입력하세요...</div>
          <div className="flex items-center gap-3 px-4 pt-0.5 pb-3">
            <PaperclipIcon small />
            <DomainChip code="FINANCE_LEGAL" label="재무·법무" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 03 목업 — 출처가 열렸다 닫히는 루프
// ─────────────────────────────────────────────────────────────
function Step03Mock() {
  const t = useTick();
  const cycle = 6200;
  const p = t % cycle;
  const open = p >= 2400 && p < 5200;

  // 실제 SourceBadge 디자인 그대로: 알약 토글 버튼 + 카드형 출처 항목.
  return (
    <div className="p-9 text-[14.5px] leading-[1.8] text-[#33333a]">
      <div className="mb-5">국가계약법은 국가가 당사자가 되는 계약의 기본 사항을 규정한 법률입니다. 적용 범위와 계약 원칙 등 주요 내용을 정리했습니다.</div>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-subtle text-brand text-xs font-medium rounded-full border border-brand-soft"
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
        출처 1개 {open ? '닫기' : '보기'}
      </button>

      <div className="overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(.2,.7,.2,1)]" style={{ maxHeight: open ? 80 : 0, opacity: open ? 1 : 0 }}>
        <div className="mt-2 w-full flex items-start gap-3 p-3 rounded-xl border border-surface-border bg-surface-subtle">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">국가를 당사자로 하는 계약에 관한 법률(법률)(제21418호)</p>
            <p className="text-xs text-text-muted mt-0.5">페이지 12</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 첨부 클립 아이콘(실제 입력창에도 있음 — 배치만 보여주는 정적 표시).
function PaperclipIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 17;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={small ? '#c2b5ba' : '#b3a3a9'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11l-8.5 8.5a4 4 0 0 1-5.7-5.7l8.5-8.5a2.5 2.5 0 0 1 3.5 3.5L10 17" />
    </svg>
  );
}

// 실제 DomainPicker 트리거 버튼과 동일한 알약 칩. code가 있으면 선택 상태(브랜드 톤).
function DomainChip({ code, label }: { code?: string; label?: string }) {
  const selected = !!code;
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 h-9 rounded-full text-[13.5px] font-medium ${
        selected ? 'bg-brand-subtle text-brand' : 'text-text-muted'
      }`}
    >
      {selected ? (
        <DomainIcon code={code!} size={18} />
      ) : (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
      )}
      <span>{label ?? '전체'}</span>
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 페이지
// ─────────────────────────────────────────────────────────────
export default function GuidePage() {
  useDocumentTitle('MARS 사용법');
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // '아래로 스크롤': 현재 위치보다 아래에 있는 가장 가까운 섹션의 '절대 위치'로 이동한다.
  // (scrollBy 상대 이동은 조금 스크롤한 뒤 누르면 어긋나므로, 섹션 top으로 정확히 스냅)
  const scrollToNextSection = () => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-guide-section]'));
    const cur = window.scrollY;
    // 버튼이 속한 섹션(헤드라인) 자신의 offsetTop은 헤더 높이만큼 0보다 커서 "다음 섹션"으로
    // 잘못 인식될 수 있다 — 뷰포트 높이 이상 떨어진 섹션만 진짜 다음 섹션으로 본다.
    const next = sections.find((s) => s.offsetTop > cur + window.innerHeight * 0.5);
    const target = next ? next.offsetTop : document.body.scrollHeight;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen select-none"
      style={{
        fontFamily: 'Inter, sans-serif',
        color: '#1f1f22',
        background: 'linear-gradient(180deg,#ffeef1 0%,#fdf3f5 9%,#ffffff 26%,#ffffff 100%)',
      }}
    >
      {/* 로컬 keyframes (Tailwind arbitrary animate-[...]가 참조) */}
      <style>{`
        @keyframes marsFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes marsSpin { to { transform: rotate(360deg); } }
        @keyframes faqIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        @keyframes blink { 0%,44% { opacity:1; } 50%,94% { opacity:0; } 100% { opacity:1; } }
        @keyframes lineIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        @keyframes hintIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* 헤더 */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-[6vw] py-5 bg-white/[0.82] backdrop-blur-md border-b border-[#f2e2e6]">
        <button onClick={() => navigate('/')} className="flex items-center">
          <span className="text-[18px] font-black text-brand tracking-tight">MARS</span>
        </button>
      </div>

      {/* 헤드라인 */}
      <section data-guide-section className="relative px-[6vw] min-h-[calc(100vh-73px)] flex items-center overflow-hidden">
        <div className="absolute right-[4%] top-[14%] w-[340px] h-[340px] opacity-90 pointer-events-none animate-[marsFloat_8s_ease-in-out_infinite]">
          <div className="absolute -inset-[14%] rounded-full border-[1.5px] border-[rgba(228,0,43,0.16)] animate-[marsSpin_40s_linear_infinite]" style={{ transform: 'rotate(-16deg)' }}>
            <div className="absolute -left-1 top-[48%] w-[9px] h-[9px] rounded-full bg-brand shadow-[0_0_12px_3px_rgba(228,0,43,0.5)]" />
          </div>
          <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 34% 30%, #ff6a5a 0%, #ef2740 34%, #d5001f 62%, #9c0016 100%)', boxShadow: '0 0 90px 24px rgba(228,0,43,0.2), inset -24px -20px 60px rgba(90,0,15,0.7)' }} />
        </div>
        <div className="relative w-full max-w-[760px] mx-auto text-center">
          <Reveal className="text-[13px] font-bold tracking-[0.24em] text-[#c0002a] mb-[14px]">GUIDE</Reveal>
          <Reveal delay={70}>
            <h1 className="m-0 font-black leading-[1.18] tracking-tight" style={{ fontSize: 'clamp(38px,5.2vw,60px)' }}>
              <span className="text-brand">MARS</span> 이용법
            </h1>
          </Reveal>
          <Reveal delay={160}><p className="mt-6 mx-auto max-w-[540px] text-[18px] leading-[1.75] text-[#6a6a72]">질문 입력부터 도메인 선택, 근거 확인, 문서 검색까지 — MARS가 실제로 어떻게 동작하는지 보여드립니다.</p></Reveal>

          {/* 핵심 특징 칩 */}
          <Reveal delay={240} className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            {['근거 기반 답변', '실시간 스트리밍', '출처 함께 제시', '도메인별 검색'].map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#f2dfe3] text-[14px] font-semibold text-text-secondary shadow-[0_4px_14px_rgba(150,0,40,0.04)]">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#e4002b" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                {f}
              </span>
            ))}
          </Reveal>
        </div>

        {/* 스크롤 유도 힌트 — 첫 화면 요소라 Reveal(스크롤 진입) 대신 바로 페이드인 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-9 animate-[hintIn_.8s_ease_.5s_both]">
          <button
            type="button"
            onClick={scrollToNextSection}
            className="group flex flex-col items-center gap-2 text-[#b89aa0] hover:text-brand transition-colors"
          >
            <span className="text-[12px] font-semibold tracking-wider">아래로 스크롤</span>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="animate-[marsFloat_1.8s_ease-in-out_infinite]"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </button>
        </div>
      </section>

      {/* STEP 01 */}
      <StepRow
        step="STEP 01"
        title={<>궁금한 것을<br />그대로 입력하세요</>}
        desc={'"해병대님, 무엇을 도와드릴까요?"로 시작해 궁금한 규정·절차를 평소 말하듯 입력하면 됩니다.'}
        bullets={[
          '전문 용어를 몰라도 됩니다 — 일상 언어로 질문하세요.',
          '규정 번호나 정확한 명칭을 모두 외울 필요가 없습니다.',
          '질문이 구체적일수록 더 정확한 근거를 찾아냅니다.',
        ]}
        mock={<Step01Mock />}
        mockHeight={500}
      />

      {/* STEP 02 — 도메인 선택 (좌우 반전) */}
      <StepRow
        reverse
        step="STEP 02"
        title={<>필요한 도메인만<br />골라서 검색하세요</>}
        desc="전체, 인사·복지, 정보화·보안, 재무·법무, 일반, 교범, 훈령 중 하나를 선택하면 해당 범위의 문서에서만 근거를 찾아 답합니다."
        bullets={[
          '분야를 좁히면 엉뚱한 문서가 섞이지 않아 정확도가 올라갑니다.',
          '무엇을 고를지 모르겠다면 "전체"로 두면 됩니다.',
          '선택한 도메인은 보낸 질문 위에 태그로 표시됩니다.',
        ]}
        mock={<DomainStepMock />}
        mockHeight={500}
      />

      {/* STEP 03 — 답변 스트리밍 */}
      <StepRow
        step="STEP 03"
        title={<>근거를 찾아<br />실시간으로 답합니다</>}
        desc="질문을 보내면 MARS가 관련 문서를 찾아 실시간으로 답을 작성합니다."
        bullets={[
          'RAG 검색으로 실제 규정 원문에서 근거를 찾습니다.',
          '답변은 완성될 때까지 기다리지 않고 실시간으로 표시됩니다.',
          '답변이 마음에 들지 않으면 언제든 다시 생성할 수 있습니다.',
        ]}
        mock={<Step02Mock />}
        mockHeight={500}
      />

      {/* STEP 04 — 출처 (좌우 반전) */}
      <StepRow
        reverse
        step="STEP 04"
        title={<>근거는 다 보여주고,<br />더 깊이 볼 수도 있어요</>}
        desc={'답변 아래 "출처 보기"를 누르면 실제로 참고한 문서 원문 목록이 펼쳐집니다.'}
        bullets={[
          '어떤 문서의 몇 페이지를 참고했는지 함께 표시됩니다.',
          '출처 문서를 클릭하면 원문 상세를 바로 열어볼 수 있습니다.',
          '근거가 불충분하면 추측하지 않고 솔직하게 안내합니다.',
        ]}
        mock={<Step03Mock />}
        mockHeight={500}
      />

      {/* SMART BEHAVIOR */}
      <section data-guide-section className="px-[6vw] min-h-screen flex items-center py-16">
        <div className="w-full max-w-[960px] mx-auto">
          <Reveal className="text-center mb-3 text-[14px] font-bold tracking-[0.22em] text-[#c0002a]">SMART BEHAVIOR</Reveal>
          <Reveal delay={60}><h2 className="text-center mx-auto mb-2 font-extrabold tracking-tight" style={{ fontSize: 'clamp(30px,3.6vw,44px)' }}>이런 점이 다릅니다</h2></Reveal>
          <Reveal delay={120}><p className="text-center mx-auto mb-12 max-w-[560px] text-[17px] leading-[1.7] text-[#6a6a72]">단순히 그럴듯한 답을 내놓는 대신, 규정에 근거해 정직하게 답하도록 설계했습니다.</p></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SMARTS.map((s, i) => (
              <Reveal key={s.title} delay={i * 70} className="p-7 rounded-2xl bg-white border border-[#f2dfe3] shadow-[0_10px_30px_rgba(150,0,40,0.04)]">
                <div className="text-[18px] font-extrabold mb-2">{s.title}</div>
                <div className="text-[15px] text-[#6a6a72] leading-[1.7]">{s.desc}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TIPS */}
      <section data-guide-section className="px-[6vw] min-h-screen flex items-center py-16">
        <div className="w-full max-w-[820px] mx-auto">
          <Reveal className="text-center mb-3 text-[14px] font-bold tracking-[0.22em] text-[#c0002a]">TIPS</Reveal>
          <Reveal delay={60}><h2 className="text-center mx-auto mb-2 font-extrabold tracking-tight" style={{ fontSize: 'clamp(30px,3.6vw,44px)' }}>더 정확하게 쓰는 법</h2></Reveal>
          <Reveal delay={120}><p className="text-center mx-auto mb-12 max-w-[560px] text-[17px] leading-[1.7] text-[#6a6a72]">같은 질문도 조금만 다듬으면 훨씬 정확한 근거를 찾을 수 있습니다.</p></Reveal>
          <div className="flex flex-col gap-4">
            {TIPS.map((tip, i) => (
              <Reveal key={tip.n} delay={i * 80} className="flex items-start gap-5 px-7 py-6 rounded-2xl bg-white border border-[#f2dfe3] shadow-[0_10px_30px_rgba(150,0,40,0.04)]">
                <span className="flex-none w-8 h-8 rounded-full bg-brand-subtle text-brand text-[15px] font-extrabold flex items-center justify-center">{tip.n}</span>
                <span className="text-[16.5px] leading-[1.7] text-[#33333a] pt-0.5">{tip.text}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-guide-section className="px-[6vw] min-h-screen flex items-center py-16">
        <div className="w-full max-w-[760px] mx-auto">
          <Reveal className="text-center mb-3 text-[14px] font-bold tracking-[0.22em] text-[#c0002a]">FAQ</Reveal>
          <Reveal delay={60}><h2 className="text-center mx-auto mb-2 font-extrabold tracking-tight" style={{ fontSize: 'clamp(30px,3.8vw,46px)' }}>자주 묻는 질문</h2></Reveal>
          <Reveal delay={120}><p className="text-center mx-auto mb-12 max-w-[560px] text-[17px] leading-[1.7] text-[#6a6a72]">MARS를 쓰기 전 궁금해할 만한 것들을 모았습니다.</p></Reveal>
          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={item.q} delay={i * 60} className="rounded-[18px] bg-white border border-[#f2dfe3] overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-7 py-6 text-left"
                  >
                    <span className="text-[17.5px] font-bold text-text-primary">{item.q}</span>
                    <span
                      className="flex-none w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{ background: isOpen ? '#fdeef1' : '#f6f2f3', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0002a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-7 pb-6 text-[16px] leading-[1.8] text-[#6a6a72] animate-[faqIn_.3s_cubic-bezier(.2,.7,.2,1)]">
                      {item.a}
                    </div>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — 소개(로그인) 페이지와 동일 */}
      <section data-guide-section className="relative px-[6vw] min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        <Reveal className="relative z-[2]">
          <h2 className="m-0 mb-5 font-black tracking-tight" style={{ fontSize: 'clamp(36px,5vw,60px)' }}>지금 <span className="text-brand">시작</span>해보세요</h2>
          <p className="mx-auto mb-9 max-w-[460px] text-[17px] text-text-secondary leading-relaxed">해병대의 모든 규정을, 대화 한 번으로.<br />MARS가 장병 여러분과 함께합니다.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-brand to-brand-light text-white text-[18px] font-extrabold shadow-[0_20px_44px_rgba(220,20,60,0.38)] hover:brightness-105 active:scale-[0.98] transition"
          >
            MARS 시작하기 <span>→</span>
          </button>
          <div className="mt-9 text-[13px] text-text-muted">대한민국 해병대 · MARS v1.0.0 · 본 답변은 참고용이며 공식 규정을 우선합니다.</div>
        </Reveal>
      </section>
    </div>
  );
}

// STEP 행: (목업 카드 | 텍스트) 좌우 배치. reverse면 순서 반전.
function StepRow({
  step,
  title,
  desc,
  bullets,
  mock,
  mockHeight,
  reverse,
}: {
  step: string;
  title: React.ReactNode;
  desc: string;
  bullets?: string[];
  mock: React.ReactNode;
  mockHeight: number;
  reverse?: boolean;
}) {
  const card = (
    <Reveal className="flex-[1.15] min-w-[340px] w-full" delay={reverse ? 100 : 0}>
      <div className="relative rounded-3xl overflow-hidden bg-white border border-[#f0e3e6] shadow-[0_30px_70px_rgba(150,0,40,0.08)]" style={{ height: mockHeight }}>
        {mock}
      </div>
    </Reveal>
  );
  const text = (
    <Reveal className="flex-1 min-w-[300px]" delay={reverse ? 0 : 100}>
      <div className="text-[14px] font-extrabold text-brand tracking-[0.12em] mb-4">{step}</div>
      <div className="text-[32px] md:text-[38px] font-extrabold mb-5 leading-[1.3] tracking-tight">{title}</div>
      <p className="m-0 text-[17px] md:text-[18px] leading-[1.85] text-[#6a6a72]">{desc}</p>
      {bullets && (
        <ul className="mt-7 flex flex-col gap-3.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[15.5px] leading-[1.6] text-[#4a4750]">
              <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-brand" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );
  return (
    <section data-guide-section className="px-[6vw] min-h-screen flex items-center py-16">
      <div className={`max-w-[1160px] w-full mx-auto flex items-center gap-16 flex-wrap ${reverse ? 'flex-row-reverse' : ''}`}>
        {card}
        {text}
      </div>
    </section>
  );
}
