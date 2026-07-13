import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '../styles/tokens';

export function useViewport() {
  const query = `(min-width: ${BREAKPOINTS.tablet}px)`;
  const [isTablet, setIsTablet] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handleChange = () => setIsTablet(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isTablet };
}
