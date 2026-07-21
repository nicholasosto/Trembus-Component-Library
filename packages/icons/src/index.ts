// Tree-shakeable per-glyph components.
export * from './icons/monochrome';
export * from './icons/brand';
export type { GlyphProps } from './icons/Svg';

// Render-by-name registry (dynamic names pull the whole set).
export { Glyph, GLYPHS } from './registry';
export type { GlyphName } from './registry';

// Default domain → glyph-name maps (string-only).
export {
  SYSTEM_KIND_GLYPH,
  OUTPUT_CATEGORY_GLYPH,
  OUTPUT_KIND_GLYPH,
  PROVENANCE_GLYPH,
  EXT_GLYPH,
  extToGlyph,
  WELL_KNOWN_FILE_GLYPH,
  fileToGlyph,
} from './maps';
