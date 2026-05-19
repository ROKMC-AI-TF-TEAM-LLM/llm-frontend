import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div>
//   사이드바 
      <Outlet />
    </div>
  )
}

export default MainLayout