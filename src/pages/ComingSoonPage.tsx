import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function ComingSoonPage({ title = '준비 중입니다' }: { title?: string }) {
  const navigate = useNavigate()
  useDocumentTitle(title)

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(180deg,#fdf6f8 0%,#ffffff 22%,#ffffff 100%)' }}
    >
      <div className="relative mb-9">
        <span className="mars-glow-bg" style={{ width: 260, height: 260, top: -90, left: -80 }} />
        <span
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ background: 'var(--color-brand)', boxShadow: '0 12px 30px rgba(220,20,60,0.28)' }}
        >
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
      </div>

      <p className="mars-eyebrow justify-center">COMING SOON</p>
      <h1 className="mars-display mt-4 text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.02em] text-text-primary break-keep">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-[420px] text-[14px] leading-[1.75] text-text-secondary break-keep">
        이 페이지는 아직 개발 중입니다. 조금만 기다려 주세요.
      </p>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mars-pill mars-pill-brand mt-10"
      >
        홈으로 <span aria-hidden>→</span>
      </button>
    </div>
  )
}
