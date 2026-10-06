import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useLandingMotion(root) {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.85 } });
      intro.from('.hero-kicker', { opacity: 0, y: 12 })
        .from('.hero-heading > span', { opacity: 0, y: 30, stagger: 0.13 }, 0.12)
        .from('.hero-visual', { opacity: 0, y: 24, duration: 1 }, 0.3)
        .from('.hero-copy, .pantry-strip', { opacity: 0, y: 14, stagger: 0.12 }, 0.5);
      for (const section of root.current.querySelectorAll('.manifesto-grid, .section-heading-row, .feature-row, .dish-card, .tools-copy, .final-cta-grid')) {
        gsap.from(section, { opacity: 0, y: 24, duration: 0.75, ease: 'power2.out',
          scrollTrigger: { trigger: section, start: 'top 92%', once: true } });
      }
    }, root);
    return () => media.revert();
  }, { scope: root });
}
