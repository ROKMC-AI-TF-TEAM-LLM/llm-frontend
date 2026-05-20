import ChatInput from "../ui/components/chat/chatinput"

export default function NewChatPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 bg-surface h-full">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-text-primary mb-8">
          무엇을 도와드릴까요?
        </h2>
        <ChatInput 
          notice="ROKMCLLM은 AI이므로 실수를 할 수 있습니다. 중요한 정보는 재차 확인하십시오."
        />
      </div>
    </main>
  )
}