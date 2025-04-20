import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
    const getMatches = (): boolean => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    };

    const [matches, setMatches] = useState<boolean>(getMatches());

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        
        setMatches(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
};