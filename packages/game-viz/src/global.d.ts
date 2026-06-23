// Side-effect CSS imports (component CSS) under noUncheckedSideEffectImports.
// Keep this file a *script* (no top-level import/export) — adding one turns it
// into a module and silently drops this global ambient, breaking every `.css`
// import in the package. The <model-viewer> JSX augmentation (which must be a
// module) therefore lives in its own file: ./model-viewer.d.ts.
declare module '*.css';
