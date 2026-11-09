import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  type RouteObject
} from 'react-router-dom';
import { isMetricPath } from '@/features/system/telemetry';
import LoginPage from '@/features/auth/pages/LoginPage';
import ChatPage from '@/features/chat/pages/ChatPage';
import AuthLayout from './layouts/AuthLayout';
import NewChatPage from '@/features/chat/pages/NewChatPage';
import ErrorPage from './ErrorPage';
import { AuthProvider } from '@/features/auth/AuthContext';
import ToastHost from '@/shared/components/ToastHost';
import ProtectedLayout from './layouts/ProtectedLayout';
import AdminLayout from './layouts/AdminLayout';
import { SearchPageSkeleton, RagPageSkeleton, AdminPageSkeleton } from '@/shared/components/Skeleton';

const SearchPage = lazy(() => import('@/features/sessions/pages/SearchPage'));
const RAGPage = lazy(() => import('@/features/documents/pages/RagPage'));
const AdminPage = lazy(() => import('@/features/admin/pages/AdminPage'));
const GuidePage = lazy(() => import('@/features/landing/pages/GuidePage'));
const TranslatePage = lazy(() => import('@/features/translate/pages/TranslatePage'));
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
        path: '/translate',
        element: (
          <Suspense fallback={null}>
            <TranslatePage />
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
  </AuthProvider>
);

export default App;
