# 1300 • Design System & Aesthetic Reference

## Design Philosophy

The visual identity of **Mise** is inspired by **Loro Asian Smokehouse & Bar**—a celebrated Austin/Dallas culinary concept created by James Beard Award winners Tyson Cole (Uchi) and Aaron Franklin (Franklin Barbecue).

The aesthetic bridges two worlds:
1. **Warm Artisanal Smokehouse Hospitality**: Unbleached butcher paper, warm canvas creams, charred terracotta corals, and subtle paper textures.
2. **Precision Chef Modernism**: Clean typography, crisp ticket badges, high-contrast layouts, and delightful micro-interactions.

---

## 1. Color Palette Tokens

| Token Name | Hex Code | Purpose & Application |
|---|---|---|
| **Canvas Cream** | `#FBF0DF` | Primary background, app canvas, subtle pill badges |
| **Warm Paper** | `#FFFDF9` | Card surfaces, modals, workbench container backgrounds |
| **Border Cream** | `#EDE3D3` | Card borders, divider rules, subtle separators |
| **Deep Slate** | `#334D66` | Primary headlines, hero banners, dark contrast accents |
| **Midnight Slate** | `#1F3144` | Button hover states, active navigation tabs |
| **Smokehouse Coral**| `#E56960` | Primary CTA buttons, active accents, focus borders |
| **Charred Crimson**| `#C94F46` | Button hover states, active badge fills |
| **Salmon Blush** | `#FFBDA6` | Accent pill highlights, badge text, warm details |
| **Sage Olive** | `#636951` | Secondary body text, tag labels, subheadings |
| **Warm Amber** | `#D89F43` | Rating stars, highlight badges, golden crust accents |

---

## 2. Typography Suite

```
DM Serif Display      → Headings, Brand Title, Signature Dish Titles
Courier Prime         → Typewriter Badges, Cooking Timers, Kitchen Tickets
Plus Jakarta Sans     → Navigation, Buttons, Form Inputs, UI Controls
Lora                  → Chef Tasting Notes, Longform Descriptions, Editorial
```

* **Headlines (`font-display`)**: Set in `DM Serif Display` with tight letter tracking (`tracking-tight`) for an artisanal magazine aesthetic.
* **Badges & Labels (`font-typewriter`)**: Set in `Courier Prime` uppercase with wide letter tracking (`tracking-widest`) mimicking vintage printed restaurant tickets.
* **UI Controls (`font-sans`)**: Set in `Plus Jakarta Sans` for crisp legibility across mobile and desktop devices.
* **Editorial & Notes (`font-serif`)**: Set in `Lora` italic for warm, evocative chef tips.

---

## 3. Tactile UI Details & Micro-Interactions

* **Simmer Dot Loading**: Three pulsating amber/coral simmer dots (`.simmer-dot`) that animate smoothly while the AI pitmaster formulates the recipe.
* **Ticker Ribbon (`.animate-marquee`)**: Continuous marquee banner displaying smokehouse staples (*Sweet Corn, Cast-Iron Smoke, Garlic Confit, Chili Crisp, Charred Lime*).
* **Button Shimmer (`.btn-shimmer`)**: Subtle gradient highlight on primary CTA buttons.
* **Paper Card Shadows (`.paper-card`)**: 3D layered drop shadows mimicking heavy cardstock on a wooden countertop.
* **Print Styling (`.print-card`, `@media print`)**: Hides navigation, action buttons, and sidebars for clean, ink-friendly black & white physical recipe printouts.
