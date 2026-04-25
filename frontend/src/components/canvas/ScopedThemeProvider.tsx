import { useId, useMemo } from 'react';

interface Props {
  themeCSS: string;
  children: React.ReactNode;
}

// Scopes a backend-generated theme CSS string to a wrapper class so it never
// touches document :root. Required because the Canvas preview must coexist
// with the host app's own theme; a stray :root rule would contaminate both.
export function ScopedThemeProvider({ themeCSS, children }: Props) {
  const uid = useId().replace(/:/g, '-');
  const scopeClass = `dui-canvas-preview-${uid}`;

  const scopedCSS = useMemo(() => rewriteRootToClass(themeCSS, scopeClass), [
    themeCSS,
    scopeClass,
  ]);

  return (
    <>
      <style>{scopedCSS}</style>
      <div className={scopeClass}>{children}</div>
    </>
  );
}

// Exported for direct unit testing — rewrites every :root selector (including
// the one nested inside @media (prefers-color-scheme: dark)) to the scope
// class. Returns the rewritten CSS string.
export function rewriteRootToClass(css: string, scopeClass: string): string {
  return css
    .replace(
      /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{/g,
      `@media (prefers-color-scheme: dark) { .${scopeClass} {`,
    )
    .replace(/:root\s*\{/g, `.${scopeClass} {`);
}
