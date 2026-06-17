# StackBuild UI Kit — conventions

A **shadcn/ui + Tailwind** component kit (Radix primitives under the hood) for a
construction workforce-management app. Build with the real components below; style your
own layout glue with the Tailwind idiom and tokens named here.

## Setup & wrapping
- **No global provider is required** for most components — they style themselves from the
  shipped stylesheet (`styles.css`, which `@import`s the compiled Tailwind CSS + the
  `:root` design tokens). Always include it.
- **Two exceptions:**
  - `Tooltip` must be wrapped in `TooltipProvider` (once, near the root).
  - `Toaster` (toasts) is mounted **once** at the app root; trigger toasts imperatively via
    the exported `toast(...)`.
- Overlays (`Dialog`, `AlertDialog`, `ConfirmDialog`, `DropdownMenu`, `Popover`, `Select`)
  are Radix-based: compose `*Trigger` + `*Content` and they portal/position themselves.

## Styling idiom — Tailwind utilities + CSS-variable tokens
This is a **utility-class** system. Do NOT invent a parallel theme — use these semantic
classes (each backed by an `hsl(var(--token))`), so your glue matches the components:

| Surface / role | Class family |
|---|---|
| Primary action | `bg-primary` / `text-primary-foreground` |
| Secondary / muted surface | `bg-secondary`, `bg-muted` / `text-muted-foreground` |
| Card / popover surface | `bg-card` / `text-card-foreground`, `bg-popover` |
| Page surface / text | `bg-background` / `text-foreground` |
| Danger | `bg-destructive` / `text-destructive-foreground` |
| Accent (hover/active) | `bg-accent` / `text-accent-foreground` |
| Borders / focus ring | `border-border`, `ring-ring` |
| Radius | `rounded-lg` / `-md` / `-sm` (driven by `--radius`) |

Variants are **props, not classes**: `Button` takes `variant="default|secondary|destructive|outline|ghost|link"` and `size="sm|default|lg|icon"`; `Badge` and `Alert` take `variant`. Prefer the prop over re-styling.

Note: the brand's orange accent is applied ad-hoc with Tailwind `orange-*` classes in the
host app — it is **not** a token. `--primary` is a dark slate. Use `orange-500/600` directly
when you want the brand accent.

## Where the truth lives
- `styles.css` (+ its `@import`s) — tokens and component styles.
- Each component's `<Name>.d.ts` (the prop contract) and `<Name>.prompt.md` (usage).

## One idiomatic build snippet
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from 'vite_react_shadcn_ts';

<Card className="max-w-sm">
  <CardHeader>
    <CardTitle>Riverside Tower — Phase 2</CardTitle>
    <CardDescription>14 workers on site</CardDescription>
  </CardHeader>
  <CardContent className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">Hours today</span>
    <Badge variant="secondary">112.5 h</Badge>
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button size="sm">Open</Button>
    <Button size="sm" variant="outline">Reports</Button>
  </CardFooter>
</Card>
```
