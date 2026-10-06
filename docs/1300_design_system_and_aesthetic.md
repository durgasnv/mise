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

The hero contains a procedural Three.js plate with pasta, tomatoes and herbs. Its renderer loads after the hero approaches the viewport and motion/data-saving preferences allow it. Rendering stops after movement settles, pauses offscreen or in a hidden tab, and disposes GPU resources when the component unmounts. A local SVG occupies the same layout and remains visible while loading, with reduced motion or if WebGL fails. Coarse pointers do not trigger hover movement.

The landing page and 3D renderer are separate JavaScript chunks. The optional renderer still adds download/GPU work when enabled; physical device and field performance measurements remain release work. Browser checks cover rendering, reduced motion, unavailable WebGL, context loss, offscreen pause, form use and horizontal overflow.
