import type { Preview } from '@storybook/react-vite';
import '../src/styles/index.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    a11y: { test: 'error' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
  },
  initialGlobals: { theme: 'light' },
  globalTypes: {
    theme: {
      description: 'Theme (light default + Trembus dark)',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      const theme = (ctx.globals.theme as string) ?? 'light';
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
