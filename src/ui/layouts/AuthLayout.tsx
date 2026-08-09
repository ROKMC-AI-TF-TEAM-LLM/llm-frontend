import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { takePostLoginRedirect } from '../../utils/postLoginRedirect'

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