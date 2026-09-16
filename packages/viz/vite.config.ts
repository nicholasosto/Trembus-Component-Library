import { libConfig } from '../../config/vite-lib';

// Consumer provides React; the layout engines are declared dependencies.
export default libConfig({ external: ['d3-hierarchy', /^@dagrejs\//] });
