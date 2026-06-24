import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

// Consume the PUBLISHED style entrypoints (each bundles the @trembus/tokens
// layer system, so one import per package is enough). These resolve to the
// built dist/styles.css — run `pnpm demos:check` (or `pnpm -r build`) first.
import '@trembus/ui/styles.css';
import '@trembus/viz/styles.css';
import '@trembus/game-viz/styles.css';
import './styles/app.css';

import { Shell } from './app/Shell';
import { Home } from './routes/Home';
import { Roster } from './routes/Roster';
import { Episodes } from './routes/Episodes';
import { Chronicle } from './routes/Chronicle';
import { NotFound } from './routes/NotFound';

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'roster', element: <Roster /> },
      { path: 'episodes', element: <Episodes /> },
      { path: 'chronicle', element: <Chronicle /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

const container = document.getElementById('root');
if (!container) throw new Error('Soul Steel demo: #root element not found');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
