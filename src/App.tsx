import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  type RouteObject
} from 'react-router-dom';
import { isMetricPath } from './utils/telemetry';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AuthLayout from './ui/layouts/AuthLayout';
import NewChatPage from './pages/NewChatPage';
import ErrorPage from './pages/ErrorPage';
import { AuthProvider } from './context/AuthContext';
import ToastHost from './ui/components/ToastHost';
import ProtectedLayout from './ui/layouts/ProtectedLayout';
import AdminLayout from './ui/layouts/AdminLayout';
import { SearchPageSkeleton, RagPageSkeleton, AdminPageSkeleton } from './ui/components/Skeleton';

const SearchPage = lazy(() => import('./pages/SearchPage'));
const RAGPage = lazy(() => import('./pages/RagPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const TranslatePage = lazy(() => import('./pages/TranslatePage'));
const TutorialsPage = lazy(() => import('./pages/TutorialsPage'));
const TutorialPage = lazy(() => import('./pages/TutorialPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const SystemDiagnostics = lazy(() => import('./pages/SystemDiagnostics'));

const ProjectPage = lazy(() => import('./pages/projects/ProjectPage'));
const CapMorphLab = lazy(() => import('./pages/docgen/experiments/CapMorphLab'));

// TEMP(문서 생성 시안 비교용): 시안 확정 후 6단계에서 라우트와 drafts 폴더 삭제
const DOCGEN_DRAFTS = {
  v1: lazy(() => import('./pages/docgen/drafts/DraftV1')),
  v2: lazy(() => import('./pages/docgen/drafts/DraftV2')),
  v3: lazy(() => import('./pages/docgen/drafts/DraftV3')),
  v4: lazy(() => import('./pages/docgen/drafts/DraftV4')),
  v5: lazy(() => import('./pages/docgen/drafts/DraftV5')),
  v6: lazy(() => import('./pages/docgen/drafts/DraftV6')),
};

const publicRoutes: RouteObject[] = [
  {
    path: '/docgen/cap-morph-lab',
    errorElement: <ErrorPage />,
    element: <Suspense fallback={null}><CapMorphLab /></Suspense>,
  },
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
      // TEMP(문서 생성 시안 비교용)
      ...Object.entries(DOCGEN_DRAFTS).map(([v, Draft]) => ({
        path: `/docgen/${v}`,
        element: (
          <Suspense fallback={null}>
            <Draft />
          </Suspense>
        ),
      })),
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
