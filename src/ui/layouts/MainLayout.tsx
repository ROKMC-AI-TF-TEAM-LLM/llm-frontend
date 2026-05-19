import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className="min-h-screen">
      {/* 사이드바 */}
      <Outlet />
    </div>
  )
}

export default MainLayout