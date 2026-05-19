import { useNavigate } from 'react-router-dom'

const LoginCard = () => {
  const navigate = useNavigate()
  return (
    <div className="card flex w-160 max-w-[92vw] min-h-75 overflow-hidden">

      <div className="flex w-1/2 flex-col items-center justify-center gap-4 border-r border-(--color-surface-border) px-12 py-12">

        <div className="w-14 h-14 rounded-full border-2 border-(--color-surface-border)" />

        <div className="text-center leading-none">
          <p className="text-4xl font-black tracking-tight text-(--color-brand) text-glow-brand">
            ROKMC <br /> LLM
          </p>
        </div>

        <p className="text-sm text-(--color-text-secondary) text-center leading-relaxed">
          대한민국 해병대<br />AI 개인비서 플랫폼
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 px-12 py-12 w-1/2">
        <h2 className="text-lg font-bold text-(--color-text-primary)">플랫폼 접속</h2>

        <p className="text-xs text-(--color-text-muted) text-center -mt-2">
          군 인트라넷 계정으로 자동 인증됩니다.
        </p>
    
    <button className="btn-primary w-full" onClick={() => navigate('/chat')}>
      시작하기
    </button>

        <p className="text-xs text-(--color-text-muted) tracking-wide">
          v0.0.1 · ROKMC AI TF
        </p>
      </div>
    </div>
  )
}

export default LoginCard