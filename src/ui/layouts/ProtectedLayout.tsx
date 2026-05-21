import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../components/sidebar/Sidebar";
import { useState } from "react";

const ProtectedLayout = () => {
  const { accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  if (!accessToken) {
    return <Navigate to='/signin' replace />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        chats={[]}
        user={{ id: '1', name: '사용자' }}
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export default ProtectedLayout;