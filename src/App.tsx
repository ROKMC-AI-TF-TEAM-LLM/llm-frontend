import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject
} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AuthLayout from './ui/layouts/AuthLayout';
import NewChatPage from './pages/NewChatPage';
import ErrorPage from './pages/ErrorPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './ui/layouts/ProtectedLayout';
import AdminLayout from './ui/layouts/AdminLayout';

const SearchPage = lazy(() => import('./pages/SearchPage'));
const RAGPage = lazy(() => import('./pages/RagPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
  </div>
);

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
      {
        path: '/search',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SearchPage />
          </Suspense>
        )
      },
      {
        path: '/rag',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RAGPage />
          </Suspense>
        )
      },
      {
        element: <AdminLayout />,
        errorElement: <ErrorPage />,
        children: [
          {
            path: '/admin',
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminPage />
              </Suspense>
            )
          },
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
