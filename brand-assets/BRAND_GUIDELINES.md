# Artifix Brand Identity & Design System

Official brand guidelines, asset documentation, and visual specifications for **Artifix**.

---

## 1. Brand Concept & Story

The **Artifix** logo mark is an architectural modular monogram synthesizing the letters **"A"** (*Artisan / Art*) and **"F"** (*Fix*):

- **The "A" Anchor (Artisan)**: The left dynamic chevron and 45-degree chamfered structure represents skilled craftsmanship, creativity, and bespoke artistry.
- **The "F" Pillar (Fix)**: The right vertical pillar with dual cantilevered crossbars symbolizes structural precision, engineering, and reliable repair solutions.
- **Interlocking Bond**: The two shapes interlock with architectural precision, demonstrating the seamless connection between artisans and the clients who need reliable fixes.

---

## 2. Color Specifications

| Color Role | Name | HEX | RGB | HSL | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Brand** | Royal Cobalt Blue | `#0047AB` / `#0284C7` | `rgb(2, 132, 199)` | `hsl(200, 98%, 39%)` | Left "A" letterform, primary CTA buttons, active states |
| **Deep Brand** | Midnight Navy | `#0F172A` | `rgb(15, 23, 42)` | `hsl(222, 47%, 11%)` | Right "F" letterform, primary wordmark "Arti", dark surfaces |
| **Electric Accent** | Sky Blue | `#38BDF8` | `rgb(56, 189, 248)` | `hsl(199, 95%, 74%)` | Highlights, dark-mode gradients, active badges |
| **Deep Void** | Obsidian Slate | `#090D16` | `rgb(9, 13, 22)` | `hsl(222, 42%, 6%)` | Dark mode background surfaces, app icon base |
| **Pristine Light** | Pure White | `#FFFFFF` | `rgb(255, 255, 255)` | `hsl(0, 0%, 100%)` | Light mode surfaces, dark-mode letter strokes |

---

## 3. Typography & Wordmark Construction

- **Primary Typeface**: `Plus Jakarta Sans`, `Inter`, or modern geometric grotesque sans-serif.
- **Weight**: Extra Bold (`800`) for the wordmark lockup.
- **Tracking / Letter Spacing**: `-0.04em` (compact, punchy modern tech feel).
- **Lockup Anatomy**:
  - `Arti` in Midnight Navy (`#0F172A` on light, `#FFFFFF` on dark).
  - `fix` in Royal Cobalt Blue (`#0284C7` on light, `#38BDF8` on dark).

---

## 4. Clear Space & Minimum Sizing

- **Exclusion Zone**: Always maintain a clear margin around the mark equal to at least half the width of the vertical pillar (`0.5X`).
- **Minimum Digital Sizes**:
  - Favicon: `16 x 16 px`
  - Mobile Navbar Icon: `24 x 24 px`
  - Standard App Header Lockup: `32 x 32 px` icon with `20px` typography
  - App Store / PWA Icon: `512 x 512 px` or `1024 x 1024 px`

---

## 5. Asset Directory & Files

All production assets are saved in [brand-assets](file:///Users/mac/Artisan/brand-assets):

### High-Resolution PNG Assets (`brand-assets/png/`)

| File Name | Resolution | Description | File Link |
| :--- | :--- | :--- | :--- |
| **`logo1.png`** | `902 x 621` | Primary brand lockup (Emerald Chevron + Pine Pillar & Wordmark for Light Mode) | [View PNG](file:///Users/mac/Artisan/brand-assets/png/logo1.png) |
| **`logo1-dark.png`** | `902 x 621` | High-contrast dark-mode lockup (Vivid Emerald Chevron + Crisp White Pillar & Wordmark) | [View PNG](file:///Users/mac/Artisan/brand-assets/png/logo1-dark.png) |
| **`artifix-icon-transparent.png`** | `385 x 375` | Standalone AF monogram icon (Light mode emerald & pine) | [View PNG](file:///Users/mac/Artisan/brand-assets/png/artifix-icon-transparent.png) |
| **`artifix-icon-dark.png`** | `385 x 375` | Standalone AF monogram icon (Dark mode vivid emerald & crisp white) | [View PNG](file:///Users/mac/Artisan/brand-assets/png/artifix-icon-dark.png) |
| **`logo.png`** | `902 x 621` | Mirror of master brand lockup for backwards compatibility | [View PNG](file:///Users/mac/Artisan/brand-assets/png/logo.png) |

---

## 6. Frontend Code Integration

The brand logo is directly available as a React component in:
[frontend/src/components/ui/FixmateLogo.tsx](file:///Users/mac/Artisan/frontend/src/components/ui/FixmateLogo.tsx)

```tsx
import { ArtifixLogo, ArtifixLogoMark } from '@/components/ui/FixmateLogo';

// Full lockup (Icon + "Artifix" Wordmark)
<ArtifixLogo size="md" />

// Standalone AF icon mark
<ArtifixLogoMark size={36} />
```

Web-accessible public copies are served directly under `/brand/*` and `/` for HTML and React embedding:
- `/brand/logo1.png` (or `/logo1.png`)
- `/brand/logo1-dark.png` (or `/logo1-dark.png`)
- `/brand/artifix-icon-transparent.png`
- `/brand/artifix-icon-dark.png`
- `/brand/logo.png` (legacy compatibility)
- `/favicon.png` / `/favicon.ico`
