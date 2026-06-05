import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import ChatInput from "../ui/components/chat/ChatInput"
import Toast from "../ui/components/Toast"
import { useGetMe } from "../hooks/useUser"

export default function NewChatPage() {
  const { data: meData } = useGetMe()
  const name = meData?.data?.data?.name
  const location = useLocation()
  const [toastError, setToastError] = useState('')

  useEffect(() => {
    const msg = location.state?.toastError
    if (msg) {
      setToastError(msg)
      window.history.replaceState({}, '')
    }
  }, [])

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 bg-surface h-full">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-text-primary mb-8">
          {name ? `${name}님, 무엇을 도와드릴까요?` : "무엇을 도와드릴까요?"}
        </h2>
        <ChatInput
          notice="ROKMCLLM은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오."
        />
      </div>
      {toastError && <Toast message={toastError} onClose={() => setToastError('')} />}
    </main>
  )
}
