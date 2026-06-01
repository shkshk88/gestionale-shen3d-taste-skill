# Taste-Skill Redesign — Variante A: design-taste-frontend (v2)

You are redesigning a Dental Lab CRM frontend. This is React 18 + Vite + Tailwind CSS.

## Project Context

- Two surfaces: Admin/operator app (`/admin/*`) and Client portal (`/portal/*`).
- Currency: ILS (₪). Localization: IT / EN / FR / HE (HE is RTL).
- 3D viewer uses Three.js (PLY/STL) with sand-beige model on violet `#5D5A87` background.
- Mobile bottom nav exists with center FAB.
- i18n: `src/i18n/locales/{it,en,fr,he}.json`. HE flips `<html dir="rtl">`.
- Auth: JWT, axios with refresh.
- State: Zustand + TanStack Query.

## Skill Instructions

### REDESIGN EXISTING PROJECTS SKILL

When redesigning an existing codebase:
1. Audit the UI first — identify layout, spacing, hierarchy, styling issues.
2. Fix layout before colors: grid, alignment, whitespace, visual flow.
3. Fix spacing before typography: padding, margins, gaps, rhythm.
4. Fix hierarchy before decoration: which elements are primary vs secondary.
5. Apply styling last: colors, shadows, borders, effects.
6. Maintain all functionality. Do not remove features. Do not break i18n.
7. Do not use placeholder comments. Every file must be complete.
8. If a file is too long, refactor into smaller components.

### DESIGN-TASTE-FRONTEND SKILL (v2)

- This is the default anti-slop skill.
- Read the brief, infer the design language.
- Tune three dials: DESIGN_VARIANCE=6, MOTION_INTENSITY=5, VISUAL_DENSITY=5.
- Layout: asymmetric/modern, stronger grid, intentional whitespace.
- Typography: use a premium font stack. Inter or DM Sans for body, Space Grotesk for headings.
- Motion: subtle hover transitions (0.2s ease-out), page transitions, smooth scroll.
- Anti-slop rules: no default gray backgrounds, no generic Bootstrap vibes, no card shadows everywhere.
- Hard em-dash ban: do not use `—` in UI text.
- Canonical GSAP code skeletons: use Framer Motion for React instead of GSAP.
- Strict pre-flight check: verify all colors pass WCAG contrast, verify spacing is consistent (4pt grid), verify no dead components.
- Redesign-audit protocol: before writing code, list 5 things that are wrong with the current design.

## Files to Redesign

1. `tailwind.config.js` — new palette, fonts, spacing, animations
2. `src/index.css` — global styles, CSS variables, custom scrollbar, smooth scroll
3. `src/components/layout/AdminLayout.tsx` — floating sidebar redesign, mobile responsive
4. `src/components/layout/ClientLayout.tsx` — client portal layout
5. `src/components/layout/MobileBottomNav.tsx` — bottom nav redesign, FAB restyle
6. `src/components/layout/Sidebar.tsx` — if dead, remove; otherwise redesign
7. `src/components/ui/*.tsx` — all UI primitives: buttons, cards, inputs, tables, modals, badges, selects, tabs
8. `src/pages/admin/Dashboard.tsx` — admin dashboard
9. `src/pages/admin/Calendar.tsx` — calendar view
10. `src/pages/admin/Settings.tsx` — settings page
11. `src/pages/admin/Cases/*.tsx` — cases list, detail, create
12. `src/pages/admin/Clients/*.tsx` — clients list, detail
13. `src/pages/admin/PriceLists/*.tsx` — price lists
14. `src/pages/admin/Invoices/*.tsx` — invoices
15. `src/pages/admin/Billing/*.tsx` — billing
16. `src/pages/admin/Reports/*.tsx` — reports
17. `src/pages/admin/Notifications/*.tsx` — notifications
18. `src/pages/admin/WhatsApp/*.tsx` — WhatsApp module
19. `src/pages/admin/ImportVision/*.tsx` — vision import
20. `src/pages/admin/Viewer3D/*.tsx` — 3D viewer wrapper
21. `src/pages/client/Dashboard.tsx` — client dashboard
22. `src/pages/client/MyCases.tsx` — client cases
23. `src/pages/client/NewCase.tsx` — new case form
24. `src/pages/client/CaseDetail.tsx` — case detail
25. `src/pages/client/CaseConfirmation.tsx` — case confirmation
26. `src/pages/client/Chat.tsx` — chat page
27. `src/pages/client/Profile.tsx` — client profile
28. `src/pages/auth/*.tsx` — login and auth pages

## Specific Rules

- Keep all existing functionality, routes, i18n keys, API calls, Zustand stores.
- Do not change the backend API or data structures.
- Do not change the 3D viewer core logic (Three.js). Only its container/card styling.
- Maintain RTL support for Hebrew.
- Ensure mobile-first: touch targets >= 44px, readable fonts on 375px width, bottom nav accessible.
- Use Tailwind classes only. No inline CSS unless necessary.
- All new colors must be in tailwind.config.js theme.extend.
- The 3D viewer background is currently violet `#5D5A87`. You may keep it or update to a better color that fits the new palette.

## Build Verification

After all changes, run:
```
npm run build
```
Fix any TypeScript or ESLint errors. Do not leave the build broken.

Start now. Audit first, then redesign.
