import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Polyfill scrollIntoView (jsdom doesn't implement it, ChatPanel uses it).
if (typeof window !== 'undefined') {
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
}
