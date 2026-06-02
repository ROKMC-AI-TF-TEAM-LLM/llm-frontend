import { useNavigate } from 'react-router-dom'

const ErrorPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10">
      <h1 className="text-3xl font-semibold text-text-primary">페이지를 찾을 수 없습니다.</h1>
      <div className="flex gap-8">
        <button
          onClick={() => navigate(-1)}
          className="w-32 py-3 rounded-xl border border-brand text-brand font-medium hover:bg-brand/5 transition-colors"
        >
          이전
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-32 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-hover transition-colors"
        >
          홈
        </button>
      </div>
    </div>
  )
}

export default ErrorPage
