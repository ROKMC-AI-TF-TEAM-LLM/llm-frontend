import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject
} from 'react-router-dom';
import LoginPage from './pages/loginpage';
import ChatPage from './pages/chatpage';
import AuthLayout from './ui/layouts/AuthLayout';
import NewChatPage from './pages/newchatpage';
import SearchPage from './pages/searchpage';
import RAGPage from './pages/ragpage';
import ErrorPage from './pages/errorpage';
import AdminPage from './pages/AdminPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './ui/layouts/ProtectedLayout';
import AdminLayout from './ui/layouts/AdminLayout';

const publicRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <LoginPage /> },
    ]
  },
];

const protectedRoutes: RouteObject[] = [
  {
    element: <ProtectedLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/chat', element: <NewChatPage /> },
      { path: '/chat/:id', element: <ChatPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/rag', element: <RAGPage /> },
      {
        element: <AdminLayout />,
        errorElement: <ErrorPage />,
        children: [
          { path: '/admin', element: <AdminPage /> },
        ]
      },
    ]
  }
];

const router = createBrowserRouter([...publicRoutes, ...protectedRoutes]);

const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

export default App;

