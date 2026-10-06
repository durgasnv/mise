import { useEffect, useRef } from 'react';
export function useDialog(onClose, disabled = false, active = true) {
  const ref = useRef(null), close = useRef(onClose), locked = useRef(disabled);
  close.current = onClose; locked.current = disabled;
  useEffect(() => {
    const root = ref.current; if (!active || !root) return;
    const previous = document.activeElement, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...root.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
    (focusable()[0] || root).focus();
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!locked.current) close.current?.(); }
      if (e.key === 'Tab') {
        const all = focusable(); if (!all.length) { e.preventDefault(); return; }
        const first = all[0], last = all[all.length-1];
        if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    }
    root.addEventListener('keydown', key);
    return () => { root.removeEventListener('keydown', key); document.body.style.overflow = previousOverflow; if (previous?.isConnected) previous.focus(); };
  }, [active]);
  return ref;
}
