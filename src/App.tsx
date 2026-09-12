import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './routes/HomePage';
import { NotFoundPage } from './routes/NotFoundPage';

// Hash routing on purpose: GitHub Pages has no server-side rewrite, and a hash
// router needs no 404.html fallback trick.
const router = createHashRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
);

export function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
