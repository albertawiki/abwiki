import { useEffect } from 'react';

/**
 * Keep the page's `Dataset` markup pointing at the figure on screen.
 *
 * `scripts/prerender-routes.mjs` writes this into the served HTML, which is
 * what a crawler that does not run JavaScript reads. Google does run it, and a
 * reader who arrives at one figure and clicks through to another never
 * re-fetches the document — so without this, the second figure would be
 * described by the first figure's markup. Wrong structured data is worse than
 * none: it is a machine-readable claim that this chart's numbers came from
 * documents they did not come from.
 *
 * Both sides build the node from `datasetJsonLd`, so there is one definition
 * of what the markup says and a test asserts the two agree.
 */
const useStructuredData = (json) => {
  useEffect(() => {
    // The prerendered tag is replaced rather than added to. Two Dataset nodes
    // on one page is an ambiguity, and the crawler picks whichever it likes.
    const existing = document.head.querySelector('script[type="application/ld+json"][data-figure]');
    if (existing) existing.remove();

    if (!json) return undefined;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.figure = json['@id'] || '';
    script.textContent = JSON.stringify(json);
    document.head.appendChild(script);

    return () => script.remove();
  }, [json]);
};

export default useStructuredData;
