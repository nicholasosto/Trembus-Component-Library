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
  const results = await axe(element, { rules: PAGE_LEVEL_RULES });
  return results.violations;
}
