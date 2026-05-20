import { useNavigate } from 'react-router-dom'
const LoginCard = () => {
  const navigate = useNavigate()
  return (
    <div className="card flex w-240 min-h-143.25 overflow-hidden">

      <div className="flex w-1/2 flex-col items-center justify-center gap-4 border-r border-surface-border px-12 py-12">

        <div className="w-[7.1vw] max-w-25 h-[7.1vw] max-h-25 rounded-full border --color-brand-dark: #8b0000;" />

        <div className="text-center leading-none">
          <p className="text-7xl font-black tracking-tight text-brand text-glow-brand">
            ROKMC <br /> LLM
          </p>
        </div>

        <p className="text-sm text-text-primary text-center leading-relaxed">
          대한민국 해병대<br />AI 개인비서 플랫폼
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 px-12 py-12 w-1/2">

        <h2 className="text-xl font-bold text-text-primary text-[27px]!">플랫폼 접속</h2>

        <p className="text-xs text-text-muted text-center -mt-2">
          군 인트라넷 계정으로 자동 인증됩니다.
        </p>

        <button 
          className="btn-primary w-full h-[9vh] max-h-17.25 rounded-[20px]! text-[22px]!" 
          onClick={() => navigate('/signin')}
        >
          시작하기
        </button>

        <p className="text-xs text-text-muted tracking-wide">
          v1.0.0 · 해병대사령부 지휘통신참모처 AI TF
        </p>
      </div>
    </div>
  )
}

export default LoginCard