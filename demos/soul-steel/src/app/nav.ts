/** Route metadata shared by the app shell (nav links) and the Home page (cards). */
export interface NavRoute {
  path: string;
  /** Short label for the header nav. */
  label: string;
  /** One-line description for the Home page cards. */
  blurb: string;
}

export const NAV_ROUTES: NavRoute[] = [
  { path: '/', label: 'Title', blurb: 'The cinematic hero plate.' },
  {
    path: '/roster',
    label: 'Roster',
    blurb: 'Character dossiers, a reliquary frame, and a 3D effigy.',
  },
  {
    path: '/episodes',
    label: 'Episodes',
    blurb: 'A selectable episode deck wired to live state, beside a lineage of the arc.',
  },
  {
    path: '/chronicle',
    label: 'Chronicle',
    blurb: 'A dated-event timeline of the Iron Age, in its gothic chronicle skin.',
  },
];
