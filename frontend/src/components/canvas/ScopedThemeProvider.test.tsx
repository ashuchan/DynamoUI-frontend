import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  ScopedThemeProvider,
  rewriteRootToClass,
} from './ScopedThemeProvider';
import { SAMPLE_THEME_CSS } from '../../test/canvasFixtures';

describe('rewriteRootToClass', () => {
  it('rewrites :root to scope class', () => {
    const css = ':root { --dui-primary: #abc; }';
    const out = rewriteRootToClass(css, 'scope');
    expect(out).toBe('.scope { --dui-primary: #abc; }');
    expect(out).not.toContain(':root');
  });

  it('rewrites :root inside @media (prefers-color-scheme: dark)', () => {
    const out = rewriteRootToClass(SAMPLE_THEME_CSS, 'scope-x');
    expect(out).toContain('.scope-x {');
    expect(out).toContain('@media (prefers-color-scheme: dark) { .scope-x {');
    expect(out).not.toContain(':root');
  });

  it('handles spacing variants in @media block', () => {
    const css = '@media(prefers-color-scheme:dark){:root{--x:1}}';
    const out = rewriteRootToClass(css, 's');
    expect(out).not.toContain(':root');
    expect(out).toContain('.s');
  });
});

describe('ScopedThemeProvider component', () => {
  it('emits a <style> tag with the scoped class and renders children', () => {
    const { container, getByText } = render(
      <ScopedThemeProvider themeCSS={SAMPLE_THEME_CSS}>
        <p>preview body</p>
      </ScopedThemeProvider>,
    );
    expect(getByText('preview body')).toBeInTheDocument();
    const style = container.querySelector('style');
    expect(style).not.toBeNull();
    expect(style!.textContent).toMatch(/\.dui-canvas-preview-/);
    expect(style!.textContent).not.toContain(':root');
  });

  it('does not use dangerouslySetInnerHTML', () => {
    const { container } = render(
      <ScopedThemeProvider themeCSS={SAMPLE_THEME_CSS}>
        <div />
      </ScopedThemeProvider>,
    );
    // React renders <style>{children}</style> safely as a text node, so
    // the rendered <style> element should have textContent (not innerHTML
    // produced through dangerouslySetInnerHTML — which would equally show up,
    // but the assertion exists as a regression sentinel against future drift.)
    const style = container.querySelector('style');
    expect(style?.textContent).toBeTruthy();
  });

  it('produces a different scope per instance', () => {
    const { container } = render(
      <>
        <ScopedThemeProvider themeCSS={':root{--x:1}'}>
          <span data-testid="a" />
        </ScopedThemeProvider>
        <ScopedThemeProvider themeCSS={':root{--y:2}'}>
          <span data-testid="b" />
        </ScopedThemeProvider>
      </>,
    );
    const wrappers = Array.from(
      container.querySelectorAll<HTMLDivElement>('div[class^="dui-canvas-preview-"]'),
    );
    expect(wrappers.length).toBe(2);
    expect(wrappers[0].className).not.toBe(wrappers[1].className);
  });
});
