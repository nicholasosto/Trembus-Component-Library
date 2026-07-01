import { axe } from 'jest-axe';

type Violations = Awaited<ReturnType<typeof axe>>['violations'];

/**
 * Page-level rules that don't apply when auditing an isolated component
 * fragment (especially one rendered through a portal): a component is not
 * responsible for the page having a landmark or an h1.
 */
const PAGE_LEVEL_RULES = {
  region: { enabled: false },
  'landmark-one-main': { enabled: false },
  'page-has-heading-one': { enabled: false },
};

/** Run axe over a component fragment and return only real (component-scope) violations. */
export async function a11yViolations(element: Element): Promise<Violations> {
  const results = await axe(element, {
    rules: PAGE_LEVEL_RULES,
    // Don't preload external assets. It only feeds page/media-level async rules
    // (no-autoplay-audio, css-orientation-lock) that don't apply to an isolated
    // fragment — and in jsdom the media/CSS never resolves, so preloading a
    // component that renders <audio>/<video> hangs axe until it times out.
    preload: false,
  });
  return results.violations;
}
