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
import { SearchPageSkeleton, RagPageSkeleton, AdminPageSkeleton } from './ui/components/Skeleton';

const SearchPage = lazy(() => import('./pages/SearchPage'));
const RAGPage = lazy(() => import('./pages/RagPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

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
          <Suspense fallback={<SearchPageSkeleton />}>
            <SearchPage />
          </Suspense>
        )
      },
      {
        path: '/rag',
        element: (
          <Suspense fallback={<RagPageSkeleton />}>
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
              <Suspense fallback={<AdminPageSkeleton />}>
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
