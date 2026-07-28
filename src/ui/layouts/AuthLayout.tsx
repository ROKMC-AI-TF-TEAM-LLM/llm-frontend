import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { takePostLoginRedirect } from '../../utils/postLoginRedirect'

const AuthLayout = () => {
  const { accessToken } = useAuth()

  if (accessToken) {
    // 랜딩에서 보호된 메뉴(문서 검색 등)를 눌러 로그인했다면 그 페이지로,
    // 아니면 평소대로 채팅 화면으로 보낸다.
    return <Navigate to={takePostLoginRedirect() ?? '/chat'} replace />
  }

  return (
    <div className="login-page">
      <Outlet />
    </div>
  )
}

export default AuthLayout