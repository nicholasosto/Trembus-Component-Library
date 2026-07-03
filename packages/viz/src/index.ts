// Styles must load first so the @layer order (from @trembus/tokens) is
// established before any component CSS. Consumers using the prebuilt bundle
// import '@trembus/viz/styles.css'.
import './styles/index.css';

// ── visualizations (Tier-2 node-link; consume the Visual Grammar contracts) ──
export { Tree } from './components/Tree/Tree';
export type { TreeProps, TreeContract, TreeNode, TreeTone } from './components/Tree/Tree';

export { Lineage } from './components/Lineage/Lineage';
export type {
  LineageProps,
  GraphContract,
  GraphNode,
  GraphEdge,
  LineageTone,
} from './components/Lineage/Lineage';

export { SystemMap } from './components/SystemMap/SystemMap';
export type {
  SystemMapProps,
  SystemMapContract,
  SystemNode,
  SystemPort,
  SystemEdge,
  SystemTone,
} from './components/SystemMap/SystemMap';

export { ClassDiagram } from './components/ClassDiagram/ClassDiagram';
export type {
  ClassDiagramProps,
  ClassDiagramContract,
  ClassNode,
  ClassMember,
  ClassRelation,
  RelationKind,
  Visibility,
  ClassTone,
} from './components/ClassDiagram/ClassDiagram';
export { Strata } from './components/Strata/Strata';
export type {
  StrataProps,
  StrataContract,
  StrataPrinciple,
  StrataTone,
} from './components/Strata/Strata';
