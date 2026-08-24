/** Route metadata shared by the app shell (nav links). */
export interface NavRoute {
  path: string;
  label: string;
}

export const NAV_ROUTES: NavRoute[] = [
  { path: '/', label: 'Rooms' },
  { path: '/laws', label: 'Laws' },
];
