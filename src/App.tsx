import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from './pages/loginpage';
import MainLayout from './ui/layouts/MainLayout';
import ChatPage from './pages/chatpage';
import AuthLayout from './ui/layouts/AuthLayout';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/', element: <LoginPage /> }
    ]
  },
  {
    element: <MainLayout />,
    children: [
      { path: '/chat', element: <ChatPage /> },
    ]
  },
]);

const App = () => (
  //<AuthProvider>
    <RouterProvider router={router} />
  //</AuthProvider>
);

export default App;