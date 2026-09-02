import { useCallback, useEffect, useState } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTranslate } from '../hooks/useTranslate'
import { showToast } from '../api/store/toastStore'
import { copyText } from '../utils/clipboard'

const LANGS = ['한국어', '영어'] as const
type Lang = (typeof LANGS)[number]

const MAX = 200

function LangSelect({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center mars-brand-serif gap-2 rounded-[12px] border border-[#f0e6e8] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-text-primary transition-colors hover:border-brand-soft"
      >
        {value}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1.5 w-[140px] overflow-hidden rounded-[12px] border border-[#f0e6e8] bg-white py-1 shadow-[0_12px_30px_rgba(60,20,30,0.12)]">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => { onChange(l); setOpen(false) }}
                className={`block w-full px-4 py-2 text-left text-[13.5px] transition-colors hover:bg-brand-subtle ${l === value ? 'font-semibold text-brand' : 'text-text-secondary'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const LANG_CODE: Record<Lang, 'ko' | 'en'> = { 한국어: 'ko', 영어: 'en' }

const STYLES = [
  { label: '평시문체', value: 'plain_report' },
  { label: '높임말체', value: 'honorific' },
] as const

export default function TranslatePage() {
  useDocumentTitle('번역')
  const [source, setSource] = useState<Lang>('한국어')
  const [target, setTarget] = useState<Lang>('영어')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [style, setStyle] = useState<string>('plain_report')
  const [fontSize, setFontSize] = useState(15)
  const { mutate: translateApi, isPending } = useTranslate()

  const swap = () => {
    setSource(target)
    setTarget(source)
  }

  const runTranslate = useCallback(() => {
    if (!input.trim()) return
    translateApi(
      { text: input, source: LANG_CODE[source], target: LANG_CODE[target], style },
      {
        onSuccess: (res) => setResult(res.data.data.translation),
        onError: () => {
          showToast('서버 오류입니다. 잠시 후 다시 시도해 주세요.')
        },
      },
    )
  }, [input, source, target, style, translateApi])

  useEffect(() => {
    if (!input.trim()) {
      setResult('')
      }
  }, [input, source, target, runTranslate])

  const copyResult = () => {
    if (result) copyText(result).catch(() => {})
  }

  return (
    <>
      <div className="h-full overflow-y-auto custom-scroll px-8 pt-8 pb-6">
      <div className="mx-auto flex max-w-[1120px] flex-col">
        <h1 className="mars-display text-[20px] mars-brand-serif font-bold text-text-primary">번역</h1>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LangSelect value={source} onChange={setSource} />
            <button
              type="button"
              onClick={swap}
              aria-label="언어 바꾸기"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f0e6e8] bg-white text-brand transition-colors hover:bg-brand-subtle"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8" />
              </svg>
            </button>
            <LangSelect value={target} onChange={setTarget} />

            <div className="ml-1 flex items-center rounded-full border border-[#f0e6e8] bg-white p-1">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                    style === s.value ? 'bg-brand text-white' : 'text-text-secondary hover:bg-brand-subtle hover:text-brand'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-[#f0e6e8] bg-white px-1.5 py-1">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              disabled={fontSize <= 12}
              aria-label="글자 작게"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold text-text-secondary transition-colors hover:bg-brand-subtle hover:text-brand disabled:opacity-40 disabled:hover:bg-transparent"
            >
              A−
            </button>
            <span className="w-9 text-center text-[12.5px] tabular-nums text-text-muted">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              disabled={fontSize >= 24}
              aria-label="글자 크게"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-bold text-text-secondary transition-colors hover:bg-brand-subtle hover:text-brand disabled:opacity-40 disabled:hover:bg-transparent"
            >
              A+
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex min-h-[460px] flex-col rounded-[18px] border border-[#f0e6e8] bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX))}
              placeholder="번역할 내용을 입력하세요"
              spellCheck={false}
              style={{ fontSize }}
              className="flex-1 resize-none rounded-t-[18px] bg-transparent px-6 pt-6 leading-[1.7] text-text-primary outline-none placeholder:text-text-muted"
            />
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[12.5px] tabular-nums text-text-muted">{input.length} / {MAX}</span>
              <button
                type="button"
                onClick={runTranslate}
                disabled={!input.trim() || isPending}
                style={input.trim() && !isPending ? { background: 'var(--color-brand)' } : undefined}
                className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-[13.5px] font-semibold transition-colors ${
                  input.trim() && !isPending ? 'text-white hover:bg-[var(--color-brand-hover)]' : 'bg-[#f4eced] text-[#cbbcc0] cursor-not-allowed'
                }`}
              >
                번역
              </button>
            </div>
          </div>

          <div className="flex min-h-[460px] flex-col rounded-[18px] border border-[#f0e6e8] bg-[#fdfbfb]">
            <div className="flex-1 px-6 pt-6 leading-[1.7]" style={{ fontSize }}>
              {isPending ? (
                <span className="inline-flex items-center gap-1.5 py-1">
                  <span className="dot-chase" style={{ animationDelay: '0ms' }} />
                  <span className="dot-chase" style={{ animationDelay: '160ms' }} />
                  <span className="dot-chase" style={{ animationDelay: '320ms' }} />
                </span>
              ) : result ? (
                <p className="whitespace-pre-wrap text-text-primary">{result}</p>
              ) : (
                <p className="text-text-muted">번역</p>
              )}
            </div>
            <div className="flex items-center gap-2 px-5 py-3.5">
              <button type="button" aria-label="음성 재생" disabled={!result} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand-subtle hover:text-brand disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted">
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                </svg>
              </button>
              <button type="button" aria-label="복사" onClick={copyResult} disabled={!result} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-brand-subtle hover:text-brand disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
