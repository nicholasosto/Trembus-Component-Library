// Shared unit-test setup for every package (wired by config/vitest-unit.ts).
// The matcher TYPES come in through tsconfig.base.json `types`.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
