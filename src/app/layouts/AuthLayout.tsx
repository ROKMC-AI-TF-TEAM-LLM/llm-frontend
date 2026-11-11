import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { takePostLoginRedirect } from '@/shared/utils/postLoginRedirect'

const AuthLayout = () => {
  const { accessToken } = useAuth()

  if (accessToken) {
    return <Navigate to={takePostLoginRedirect() ?? '/chat'} replace />
  }

  return (
    <div className="login-page">
      <Outlet />
    </div>
  )
}

export default AuthLayout
