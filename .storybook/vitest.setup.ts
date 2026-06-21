import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview';

// Applies the same decorators/parameters (theme, a11y) to stories run as tests.
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
