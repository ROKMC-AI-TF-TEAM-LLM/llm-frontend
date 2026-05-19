import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="login-page">
      <Outlet />
    </div>
  )
}

export default AuthLayout