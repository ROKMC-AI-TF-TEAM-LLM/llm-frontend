import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from './pages/loginpage';
import MainLayout from './ui/layouts/MainLayout';
import ChatPage from './pages/chatpage';
import AuthLayout from './ui/layouts/AuthLayout';
import NewChatPage from './pages/newchatpage'
import SearchPage from './pages/searchpage'
import RAGPage from './pages/ragpage'
import ErrorPage from './pages/errorpage';
import SigninPage from './pages/SigninPage.tsx.tsx';
import SignupPage from './pages/SignupPage.tsx';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage/>,
    children: [
      { path: '/', element: <LoginPage /> },
      { path: '/signin', element: <SigninPage /> },
      { path: '/signup', element: <SignupPage /> }
    ]
  },
  {
    element: <MainLayout />,
    children: [
      { path: '/chat', element: <NewChatPage /> },
      { path: '/chat/:id', element: <ChatPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/rag', element: <RAGPage /> },
]
  },
]);

const App = () => (
  //<AuthProvider>
    <RouterProvider router={router} />
  //</AuthProvider>
);

export default App;