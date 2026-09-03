import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import ChatInput from "../ui/components/chat/ChatInput"
import { showToast } from "../api/store/toastStore"
import { useGetMe } from "../hooks/useUser"
import { useDocumentTitle } from "../hooks/useDocumentTitle"

export default function NewChatPage() {
  const { data: meData } = useGetMe()
  const name = meData?.data?.data?.name
  const location = useLocation()
  useDocumentTitle('New chat')

  useEffect(() => {
    const msg = location.state?.toastError
    if (msg) {
      showToast(msg)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  return (
    <main
      style={{ background: '#fff' }}
      className="flex-1 flex flex-col items-center justify-center px-6 h-full"
    >
      <div className="w-full max-w-2xl flex flex-col items-center animate-page-in">
        <h1
          style={{ textRendering: 'optimizeLegibility' }}
          className="mars-display text-center font-semibold text-text-primary leading-[1.28] tracking-[-0.01em] text-[clamp(25px,3vw,34px)]"
        >
          {name ? `${name}님, ` : ''}
          <span className="font-bold text-brand">무엇</span>을 도와드릴까요?
        </h1>

        <p className="mt-3.5 mb-8 text-[15px] font-semibold text-text-secondary text-center">
          법령·규정·규칙을 참조해 MARS가 근거와 함께 답합니다.
        </p>

        <ChatInput
          notice="MARS v1.0.0은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오."
        />
      </div>
    </main>
  )
}
