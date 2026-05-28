import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AuthLayout = () => {
  const { accessToken } = useAuth()

  if (accessToken) {
    return <Navigate to='/chat' replace />
  }

  return (
    <div className="login-page">
      <Outlet />
    </div>
  )
}

export default AuthLayout