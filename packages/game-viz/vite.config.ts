import { libConfig } from '../../config/vite-lib';

// Consumer provides React; @trembus/* are declared deps (external by default).
// @google/model-viewer is a declared dependency too — Effigy lazy-`import()`s it,
// and the consumer's bundler resolves that to its ONE copy of model-viewer/three.js.
export default libConfig({ external: [/^@google\/model-viewer/] });
