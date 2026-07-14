import type { Preview } from '@storybook/react-vite';
import '../packages/ui/src/styles/index.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    a11y: {
      test: 'error',
      // Stories are component fragments, not full pages — skip page-level rules.
      config: {
        rules: [
          { id: 'region', enabled: false },
          { id: 'landmark-one-main', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
        ],
      },
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
  },
  initialGlobals: { theme: 'dark' },
  globalTypes: {
    theme: {
      description: 'Theme (light default + Trembus dark + blood-dark reliquary)',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'reliquary', title: 'Reliquary' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      const theme = (ctx.globals.theme as string) ?? 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      return (
        <div className="tcl-root" style={{ padding: '1.5rem' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
