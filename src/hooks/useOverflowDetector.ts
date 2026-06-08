import { useEffect } from 'react';

/**
 * Dev-only horizontal overflow detector.
 *
 * Scans the DOM for elements whose right edge exceeds the documentElement
 * width and logs them to the console. Re-runs on resize, route change, and
 * DOM mutation. Outlines offenders with a magenta dashed border and tags
 * them with `data-overflow="<px>"` for inspection in DevTools.
 *
 * Completely tree-shaken from production builds via the `import.meta.env.DEV`
 * guard — no listeners attached, no DOM scans, zero runtime cost in prod.
 */
export function useOverflowDetector(enabled: boolean = true) {
  useEffect(() => {
    if (!import.meta.env.DEV || !enabled) return;

    let rafId = 0;
    const scan = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const docWidth = document.documentElement.clientWidth;
        const offenders: Array<{ el: HTMLElement; right: number; overflow: number }> = [];

        document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
          // Skip elements that intentionally scroll internally
          const style = window.getComputedStyle(el);
          if (style.overflowX === 'auto' || style.overflowX === 'scroll') return;
          // Skip Radix portals and other intentionally hidden/offscreen UI
          if (el.closest('[data-state="closed"]')) return;
          if (el.closest('[aria-hidden="true"]')) return;
          if (el.closest('[hidden]')) return;
          // Skip elements not in the layout flow (display:none ancestors)
          if (el.offsetParent === null && style.position !== 'fixed') return;

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          // Only flag elements that actually straddle the viewport's right edge.
          // Elements entirely to the right (rect.left >= docWidth) are off-screen
          // portals/popovers and do not produce horizontal scroll.
          if (rect.left >= docWidth) return;
          if (rect.right > docWidth + 1) {
            offenders.push({ el, right: rect.right, overflow: rect.right - docWidth });
            el.style.outline = '2px dashed magenta';
            el.setAttribute('data-overflow', String(Math.round(rect.right - docWidth)));
          }
        });

        if (offenders.length) {
          // eslint-disable-next-line no-console
          console.group(
            `%c[overflow-detector] ${offenders.length} element(s) exceed viewport (${docWidth}px)`,
            'color:#fff;background:#c026d3;padding:2px 6px;border-radius:3px;font-weight:bold'
          );
          offenders
            .sort((a, b) => b.overflow - a.overflow)
            .slice(0, 25)
            .forEach(({ el, right, overflow }) => {
              // eslint-disable-next-line no-console
              console.log(`+${Math.round(overflow)}px  right=${Math.round(right)}px`, el);
            });
          // eslint-disable-next-line no-console
          console.groupEnd();
        }
      });
    };

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener('resize', scan);
    window.addEventListener('load', scan);
    scan();

    return () => {
      mo.disconnect();
      window.removeEventListener('resize', scan);
      window.removeEventListener('load', scan);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);
}
