import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import ChatInput from "../ui/components/chat/ChatInput"
import Toast from "../ui/components/Toast"
import MarsPlanet from "../ui/components/MarsPlanet"
import { useGetMe } from "../hooks/useUser"
import { useDocumentTitle } from "../hooks/useDocumentTitle"

export default function NewChatPage() {
  const { data: meData } = useGetMe()
  const name = meData?.data?.data?.name
  const location = useLocation()
  const [toastError, setToastError] = useState('')
  useDocumentTitle('New chat')

  useEffect(() => {
    const msg = location.state?.toastError
    if (msg) {
      setToastError(msg)
      window.history.replaceState({}, '')
    }
  }, [])

  return (
    <main
      style={{ background: 'linear-gradient(180deg,#fdf3f5 0%,#ffffff 46%,#fdf8fa 100%)' }}
      className="flex-1 flex flex-col items-center justify-center px-6 h-full"
    >
      <div className="w-full max-w-2xl flex flex-col items-center animate-page-in">
        {/* 행성 */}
        <MarsPlanet
          glow
          className="w-[78px] h-[78px] mb-6"
          style={{
            background: 'radial-gradient(circle at 36% 30%, #ffb0a4 0%, #ff5a6e 38%, #e4002b 70%, #c40024 100%)',
            boxShadow: '0 0 64px 15px rgba(228,0,43,0.18), inset -11px -9px 32px rgba(150,0,30,0.34), inset 14px 12px 38px rgba(255,195,195,0.5)',
          }}
        />

        {/* 헤딩 */}
        <h1 className="text-center font-extrabold text-text-primary leading-tight tracking-tight text-[clamp(26px,3.2vw,36px)]">
          {name ? `${name}님, ` : ''}무엇을{' '}
          <span className="text-brand">도와드릴까요?</span>
        </h1>

        {/* 부제 */}
        <p className="mt-3 mb-9 text-[15px] text-text-muted text-center">
          법령·규정·규칙을 학습한 MARS가 근거와 함께 답합니다.
        </p>

        <ChatInput
          notice="MARS는 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오."
        />
      </div>
      {toastError && <Toast message={toastError} onClose={() => setToastError('')} />}
    </main>
  )
}
