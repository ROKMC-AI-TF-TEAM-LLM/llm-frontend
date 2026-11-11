import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  type RouteObject
} from 'react-router-dom';
import { isMetricPath } from '@/features/system/telemetry';
import LoginPage from '@/features/auth/pages/LoginPage';
import AuthLayout from './layouts/AuthLayout';
import NewChatPage from '@/features/chat/pages/NewChatPage';
import ErrorPage from './ErrorPage';
import { AuthProvider } from '@/features/auth/AuthProvider';
import ToastHost from '@/shared/components/ToastHost';
import ConfirmHost from '@/shared/components/ConfirmHost';
import ProtectedLayout from './layouts/ProtectedLayout';
import AdminLayout from './layouts/AdminLayout';
import { SearchPageSkeleton, RagPageSkeleton, AdminPageSkeleton, MessagesSkeleton } from '@/shared/components/Skeleton';

// 채팅 화면은 마크다운 렌더러(streamdown)를 끌고 와 첫 화면(로그인) 번들을 1MB 넘게 키우므로 따로 불러온다
const ChatPage = lazy(() => import('@/features/chat/pages/ChatPage'));
const SearchPage = lazy(() => import('@/features/sessions/pages/SearchPage'));
const RAGPage = lazy(() => import('@/features/documents/pages/RagPage'));
const AdminPage = lazy(() => import('@/features/admin/pages/AdminPage'));
const GuidePage = lazy(() => import('@/features/landing/pages/GuidePage'));
// TODO: 번역 기능 미완성 — 완성 후 주석 해제
// const TranslatePage = lazy(() => import('@/features/translate/pages/TranslatePage'));
const TutorialsPage = lazy(() => import('@/features/tutorials/pages/TutorialsPage'));
const TutorialPage = lazy(() => import('@/features/tutorials/pages/TutorialPage'));
const TeamPage = lazy(() => import('@/features/team/pages/TeamPage'));
const SystemDiagnostics = lazy(() => import('@/features/system/pages/SystemDiagnostics'));

const ProjectPage = lazy(() => import('@/features/projects/pages/ProjectPage'));
const DocGenPage = lazy(() => import('@/features/docgen/pages/DocGenPage'));

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
  {
    path: '/tutorials',
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={null}>
        <TutorialsPage />
      </Suspense>
    ),
  },
  {
    path: '/tutorials/:slug',
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={null}>
        <TutorialPage />
      </Suspense>
    ),
  },
  {
    path: '/team',
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={null}>
        <TeamPage />
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
      {
        path: '/chat/:id',
        element: (
          <Suspense fallback={<div className="h-full px-4 pt-6"><MessagesSkeleton /></div>}>
            <ChatPage />
          </Suspense>
        )
      },
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
      // TODO: 번역 기능 미완성 — 완성 후 주석 해제
      // {
      //   path: '/translate',
      //   element: (
      //     <Suspense fallback={null}>
      //       <TranslatePage />
      //     </Suspense>
      //   )
      // },
      {
        path: '/projects/:id',
        element: (
          <Suspense fallback={null}>
            <ProjectPage />
          </Suspense>
        )
      },
      {
        path: '/projects/:id/:chatId',
        element: (
          <Suspense fallback={null}>
            <ProjectPage />
          </Suspense>
        )
      },
      {
        path: '/docgen',
        element: (
          <Suspense fallback={null}>
            <DocGenPage />
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

const NotFoundBoundary = () => {
  const { pathname } = useLocation();
  if (isMetricPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <SystemDiagnostics />
      </Suspense>
    );
  }
  return <ErrorPage />;
};

const router = createBrowserRouter([...publicRoutes, ...protectedRoutes, { path: '*', element: <NotFoundBoundary /> }]);

const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
    <ToastHost />
    <ConfirmHost />
  </AuthProvider>
);

export default App;
