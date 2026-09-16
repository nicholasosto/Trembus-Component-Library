import { libConfig } from '../../config/vite-lib';

// Consumer provides React; @trembus/tokens + @trembus/icons are declared deps and
// stay external (one copy in the consumer's tree, shared with viz / game-viz).
export default libConfig();
