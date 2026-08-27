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
    <ToastHost />
  </AuthProvider>
);

export default App;
