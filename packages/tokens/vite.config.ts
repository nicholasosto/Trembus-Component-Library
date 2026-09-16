import { libConfig } from '../../config/vite-lib';

// React-free pure TS → no react plugin. Only the runtime `.` entry is bundled to
// dist (its extensionless re-exports of ./tokens · ./tone · ./tokens.types don't
// resolve under Node16 ESM when shipped as raw source). The type-only
// `./contract`, the test helper `./testing`, and the hand-authored CSS layer
// system stay as source exports (attw-clean as-is; keeping CSS as source
// preserves the live theme-editing loop in Storybook). jest-axe rides the
// (source) ./testing entry only; never bundle it here.
export default libConfig({ react: false, external: ['jest-axe'] });
