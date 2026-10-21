# Design system

Mise uses an editorial kitchen style: warm paper, dark ink, red accents, generous headings and compact recipe labels. Current implementation is defined in `frontend/src/index.css`, Tailwind configuration and component classes.

| Color | Role |
| --- | --- |
| `#F5E6CC` | Canvas and light cooking text |
| `#FFF8EC` | Paper cards and dialogs |
| `#201B17` | Primary ink and dark surfaces |
| `#6D5545` | Secondary readable text |
| `#E3CFB1` | Card borders |
| `#F2382F` | Primary accent |

The loaded typefaces are Bodoni Moda, DM Sans and IBM Plex Mono. Landing headlines use adjusted weight to preserve thin strokes. Decorative vertical landing rules have been removed.

Dialogs expose accessible names, trap Tab focus, close with Escape where safe and restore focus to their trigger. Checklists and method completion support keyboard input. Controls wrap on narrow screens; cooking text remains large and scrollable. Framer Motion respects reduced-motion preferences. Print styles hide navigation/actions and retain recipe content.

Desktop/mobile browser checks verify selected flows and horizontal overflow; they do not establish a full WCAG audit. Avoid claims of measured accessibility conformance until that audit exists.

Landing motion uses GSAP timelines and ScrollTrigger for the hero entrance and section reveals. Animation scope and cleanup use `@gsap/react`; reduced-motion preferences bypass the animations. Framer Motion retains page transitions and application dialogs on separate elements.

The hero, featured dishes and tools section retain their original photographs. The animated 3D noodle scene has been removed.

The landing page loads as a separate JavaScript chunk. Browser checks cover the hero photograph, featured images, reduced motion, form use and horizontal overflow.

Kitchen UI primitives are defined in `frontend/src/index.css`: `ui-card`, `ui-field`, `ui-label`, and `ui-button` with primary/secondary variants. Use these for component appearance and utility classes for layout. Controls use a shared 44px minimum height and 3px radius; fields use 16px text, labels use 12–14px text, and recipe steps use 16–18px text. Keep bright red for emphasis and selected states; primary buttons use the darker red for readable light text.

The kitchen places ingredient entry before household settings. Dietary restrictions remain visible; quick-add suggestions, combinations, and optional preferences live in an expandable section. Healthy recipe service status stays compact, failures expose details, and synchronization follows the workbench. Desktop and mobile navigation share About, Kitchen, Pantry, Plan, and Cookbook destinations with `aria-current` active states.
