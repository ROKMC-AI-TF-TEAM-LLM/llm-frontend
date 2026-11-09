import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { takePostLoginRedirect } from '@/features/auth/utils'

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