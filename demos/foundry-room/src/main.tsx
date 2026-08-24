import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

// Consume the PUBLISHED style entrypoint (it bundles the @trembus/tokens layer
// system, so one import is enough). Resolves to the built dist/styles.css — run
// `pnpm -r build` (or `pnpm demos:check` from the repo root) first.
import '@trembus/ui/styles.css';
import './styles/app.css';

import { Shell } from './app/Shell';
import { Room } from './routes/Room';
import { Laws } from './routes/Laws';
import { NotFound } from './routes/NotFound';

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { index: true, element: <Room /> },
      { path: 'laws', element: <Laws /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

const container = document.getElementById('root');
if (!container) throw new Error('Foundry Room demo: #root element not found');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
