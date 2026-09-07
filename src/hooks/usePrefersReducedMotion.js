import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const matches = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(QUERY).matches;

/**
 * Whether the reader has asked for less motion.
 *
 * `chartTheme.animate` reads the same preference once at module load, which is
 * right for a chart that decides whether to draw itself in. Anything that keeps
 * moving after the page has settled has to react to the preference changing,
 * because someone who turns it on mid-session is asking for the movement to
 * stop now rather than on the next reload.
 */
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(matches);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const query = window.matchMedia(QUERY);
    const onChange = (event) => setReduced(event.matches);

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

export default usePrefersReducedMotion;
