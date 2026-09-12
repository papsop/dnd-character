import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BuildLayout } from './routes/BuildLayout';
import { HomePage } from './routes/HomePage';
import { IconsPage } from './routes/IconsPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { AbilitiesStep } from './routes/steps/AbilitiesStep';
import { ClassDetailsStep } from './routes/steps/ClassDetailsStep';
import { ClassStep } from './routes/steps/ClassStep';
import { DetailsStep } from './routes/steps/DetailsStep';
import { EquipmentStep } from './routes/steps/EquipmentStep';
import { OriginStep } from './routes/steps/OriginStep';
import { ReviewStep } from './routes/steps/ReviewStep';
import { SpellsStep } from './routes/steps/SpellsStep';

// Hash routing on purpose: GitHub Pages has no server-side rewrite, and a hash
// router needs no 404.html fallback trick.
const router = createHashRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: '/', element: <HomePage /> },
        {
          path: '/build',
          element: <BuildLayout />,
          children: [
            { index: true, element: <Navigate to="/build/class" replace /> },
            { path: 'class', element: <ClassStep /> },
            { path: 'origin', element: <OriginStep /> },
            { path: 'abilities', element: <AbilitiesStep /> },
            { path: 'class-details', element: <ClassDetailsStep /> },
            { path: 'equipment', element: <EquipmentStep /> },
            { path: 'spells', element: <SpellsStep /> },
            { path: 'details', element: <DetailsStep /> },
            { path: 'review', element: <ReviewStep /> },
          ],
        },
        { path: '/dev/icons', element: <IconsPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
);

export function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
