# design-sync NOTES — StackBuild UI Kit

Repo: `vite_react_shadcn_ts` (private Vite + React + shadcn/ui app — NOT a published library).
Synced as a **curated** UI Kit (subset of `src/components/ui/`), synth-entry shape.

## How this sync is wired (re-sync must reproduce)
- **No library `dist`/exports.** The bundle is built from a hand-written barrel
  `.design-sync/entry.tsx` (committed; passed as `--entry`) that re-exports only the
  curated components. esbuild resolves `@/` via `cfg.tsconfig` (tsconfig.json).
- **CSS is generated, not shipped.** `cfg.cssEntry` → `.design-sync/.cache/compiled.css`,
  produced by Tailwind over the app sources + the `:root` tokens in `src/index.css`:
  ```
  npx tailwindcss -c tailwind.config.ts -i src/index.css -o .design-sync/.cache/compiled.css --minify
  ```
  **Re-sync must regenerate this first** (it's gitignored under `.cache/`).
- Build command:
  ```
  node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules \
    --entry .design-sync/entry.tsx --out ./ds-bundle
  ```
- Render check uses the **system Chrome** (no chromium download):
  `DS_CHROMIUM_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe"` +
  `playwright` installed in `.ds-sync` with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

## Known render warns (triaged — not new issues on re-sync)
- `[TOKENS_MISSING]` — `--radix-*`, `--sidebar-width`, `--skeleton-width`,
  `--scrollbar-*`, `--color-border`, `--color-bg`: runtime vars set by components
  (Radix/skeleton/tailwind-scrollbar) at render time. Expected absent from static CSS.
- `[FONT_MISSING] Cambria` — part of Tailwind's **default `font-serif`** system stack
  (`ui-serif, Georgia, Cambria, …`). System fallback; no font to ship. Accept substitute.
- `[RENDER_THIN] Avatar` — empty floor card (Avatar with no image). Resolved once
  `Avatar` preview is authored.

## Scope decisions
- The orange "brand" is applied ad-hoc via `orange-*` classes in app components, NOT the
  design tokens. `--primary` is the default shadcn dark slate. Cards reflect the real tokens.
- Preview depth (user choice): rich previews for the core ~14; floor cards for the rest
  (authorable on any later re-sync).

## Re-sync risks
- `.cache/compiled.css` is gitignored — a fresh clone must regenerate it (command above)
  before building. The barrel `.design-sync/entry.tsx` IS committed.
- Tailwind content scan covers ALL `src/**`, so the compiled CSS is a superset; preview
  glue classes outside that set won't be styled — keep preview classes to ones the app uses.
