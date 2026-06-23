// Styles must load first so the @layer order (from @trembus/tokens) is
// established before any component CSS. Consumers using the prebuilt bundle
// import '@trembus/viz/styles.css'.
import './styles/index.css';

// ── visualizations (Tier-2 node-link; consume the Visual Grammar contracts) ──
export { Tree } from './components/Tree/Tree';
export type { TreeProps, TreeContract, TreeNode, TreeTone } from './components/Tree/Tree';
