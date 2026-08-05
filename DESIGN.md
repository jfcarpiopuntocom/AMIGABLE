---
version: alpha
name: amigable-123
description: Un lienzo comercial de mostrador y feria, vibrante y honesto, donde cada estado de inventario corre en un color semántico del Sistema Simon. La tipografía es limpia y directa, priorizando la lectura rápida en pantallas móviles; las superficies de las tarjetas flotan sobre un fondo crema limpio separado por bordes finos, sin sombras pesadas.
---

colors:
  primary: "#00C87A"
  sim-verde: "#00C87A"
  sim-amarillo: "#FFC700"
  sim-azul: "#5294AC"
  sim-naranja: "#F97316"
  sim-rojo: "#E8365D"
  sim-negro: "#0A0A0F"
  ink: "#0F1923"
  body: "#2C3E50"
  muted: "#7A7568"
  canvas: "#F8F9FB"
  surface-card: "#FFFFFF"
  hairline: "#E8ECF2"
  on-primary: "#FFFFFF"

typography:
  display-lg:
    fontFamily: "'Space Grotesk', Inter, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1.2px
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"

---

## Overview

amigable-123 reads like a software built for the frontlines of retail and street fairs. It avoids generic cloud SaaS aesthetics in favor of high-contrast clarity, immediate visual feedback through the Simon Color System, and local-first reliability.

**Key Characteristics:**
- **Simon Color Semantics:** Every stock state is immediately identifiable via dedicated color tokens (green for optimal, red for critical, black for dead stock).
- **Zero Drop Shadows:** Depth is expressed cleanly via 1px hairline borders (`{colors.hairline}`) on pure white surface cards (`{colors.surface-card}`).
- **Mobile-First Touch Targets:** Designed for merchants working behind a busy counter or on a noisy fair stand.

## Colors

### Brand & Simon System
- **Verde** (`{colors.sim-verde}` — #00C87A): Optimal stock level. Everything is in order.
- **Amarillo / Dorado** (`{colors.sim-amarillo}` — #FFC700): Warning threshold or opportunity.
- **Naranja** (`{colors.sim-naranja}` — #F97316): Fast-moving stock requiring early attention.
- **Rojo** (`{colors.sim-rojo}` — #E8365D): Critical stockout. Immediate action required.
- **Negro** (`{colors.sim-negro}` — #0A0A0F): Dead stock. Capital trapped that must be liquidated.

### Note on Blue (Financial & Accounting Reflections)
- **Azul** (`{colors.sim-azul}` — #5294AC): Reserved exclusively for brief accounting or financial reflections and insights, isolated from the main operational boards.

### Surface
- **Canvas** (`{colors.canvas}` — #F8F9FB): The default page floor. A pale clean surface designed for low-glare reading under bright market lights.
- **Surface Card** (`{colors.surface-card}` — #FFFFFF): Pure white card plates that float above the base canvas.

## Typography
Headlines use Space Grotesk for confident readability at a glance, paired with Inter for dense tabular and list data.

## Layout & Elevation
The application renders cleanly on a clean canvas (`{colors.canvas}`). Cards float on pure white plates separated by `{colors.hairline}` borders, completely avoiding drop shadows to maintain execution speed and visual crispness.

## Components

**`button-primary`** — The signature checkout and confirmation action. Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, padding 12px × 20px, rounded `{rounded.md}` (10px).

**`card`** — The default container plate. Background `{colors.surface-card}`, text `{colors.ink}`, rounded `{rounded.lg}` (16px), padding 20px, separated from the canvas by a 1px `{colors.hairline}` border.

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 720px | Hamburger nav; hero h1 48→28px; cards stack 1-up. |
| Tablet | 720–1024px | Top nav narrows; cards 2-up; sidebar collapses. |
| Desktop | 1024–1440px | Full top nav; 3-up card grid; sticky sidebar. |
| Wide | > 1440px | Content caps at 1440px; gutters absorb the rest. |

### Touch Targets
- Primary CTAs ≥ 44 × 44px (WCAG AAA).
- Form inputs at 48px height.

## Known Gaps
- Animation and transition timings are out of scope.
- Form error/success states are not extracted on the captured surfaces.
- Dark mode is not a documented variant — the brand renders one light canvas mode.
