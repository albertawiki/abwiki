import { useEffect } from 'react';

const SITE = 'alberta.wiki';
const DEFAULT_TITLE = `${SITE} — how Alberta is actually doing`;

/**
 * Set the document title for a route.
 *
 * Client-side routing does not change the title on its own, so every page
 * would otherwise share the one in index.html. That matters beyond tidiness:
 * the title is what a search result, a shared link and a browser tab all show,
 * and this site wants to be findable by indicator name.
 */
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : DEFAULT_TITLE;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
};

export default usePageTitle;
