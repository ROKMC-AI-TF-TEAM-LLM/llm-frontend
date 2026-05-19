import Sidebar from '../components/sidebar/Sidebar'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        chats={[]}
        user={{ name: '사용자' }}
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout