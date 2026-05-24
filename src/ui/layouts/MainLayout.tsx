import Sidebar from '../components/sidebar/Sidebar'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useGetMe } from '../../hooks/useUser'
import { useGetSessions } from '../../hooks/useSession'

const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(true)
  const { data: meData } = useGetMe()
  const { data: sessionsData } = useGetSessions()

  const userData = meData?.data?.data
  const user = userData
    ? { id: '', name: userData.name, email: userData.email }
    : { id: '', name: '사용자' }

  const chats = (sessionsData?.data?.data ?? []).map((s) => ({
    id: s.session_id,
    title: s.title,
  }))

  return (
    <div className="flex h-screen">
      <Sidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        chats={chats}
        user={user}
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
