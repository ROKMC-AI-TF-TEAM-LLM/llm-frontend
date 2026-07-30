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
const GuidePage = lazy(() => import('./pages/GuidePage'));

// 프로젝트 — 목록(홈) 화면은 없다. 사이드바 '프로젝트' 섹션이 목록 역할을 하고,
// 프로젝트를 누르면 곧바로 이 화면으로 들어온다.
const ProjectPage = lazy(() => import('./pages/projects/ProjectPage'));

const publicRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <LoginPage /> },
    ]
  },
  {
    path: '/guide',
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={null}>
        <GuidePage />
      </Suspense>
    ),
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
        path: '/projects/:id',
        element: (
          <Suspense fallback={null}>
            <ProjectPage />
          </Suspense>
        )
      },
      // 프로젝트 안의 특정 대화를 바로 열 때 (사이드바 '최근 대화'에서 진입).
      {
        path: '/projects/:id/:chatId',
        element: (
          <Suspense fallback={null}>
            <ProjectPage />
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

const router = createBrowserRouter([...publicRoutes, ...protectedRoutes, { path: '*', element: <ErrorPage /> }]);

const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

export default App;
