import { useEffect } from 'react';

const SITE = 'alberta.wiki';
const DEFAULT_TITLE = `${SITE} — how Alberta is actually doing`;
const DEFAULT_DESCRIPTION =
  'How Alberta is doing on the issues Albertans say matter most, with every figure '
  + 'traced back to an original public document.';

/** Create the tag if the document has not got one, then set an attribute on it. */
const upsert = (selector, create, attribute, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
};

/**
 * Set the title, description and canonical URL for a route.
 *
 * Client-side routing changes none of these on its own, so every page would
 * otherwise inherit whatever is in index.html. That matters beyond tidiness:
 * these three are what a search result, a shared link and a browser tab show,
 * and this site wants to be findable by indicator name.
 *
 * The canonical URL matters more here than on most sites, because the same
 * figure appears on the dashboard, on its topic page and on its own permalink.
 * Without one, three URLs compete to represent the same chart.
 */
const usePageMeta = ({ title, description, canonical, noindex = false } = {}) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : DEFAULT_TITLE;

    upsert(
      'meta[name="description"]',
      () => Object.assign(document.createElement('meta'), { name: 'description' }),
      'content',
      description || DEFAULT_DESCRIPTION,
    );

    upsert(
      'meta[property="og:title"]',
      () => {
        const el = document.createElement('meta');
        el.setAttribute('property', 'og:title');
        return el;
      },
      'content',
      title ? `${title} · ${SITE}` : DEFAULT_TITLE,
    );

    upsert(
      'meta[property="og:description"]',
      () => {
        const el = document.createElement('meta');
        el.setAttribute('property', 'og:description');
        return el;
      },
      'content',
      description || DEFAULT_DESCRIPTION,
    );

    // A client-side 404 is served as HTTP 200, because CloudFront returns the
    // same index.html for every route and cannot know the route is unknown. Say
    // so in a robots tag instead, or a mistyped permalink gets indexed as a
    // real page.
    const robots = document.head.querySelector('meta[name="robots"]');
    if (noindex) {
      upsert(
        'meta[name="robots"]',
        () => Object.assign(document.createElement('meta'), { name: 'robots' }),
        'content',
        'noindex',
      );
    } else if (robots) {
      robots.remove();
    }

    if (canonical) {
      upsert(
        'link[rel="canonical"]',
        () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
        'href',
        canonical,
      );
      upsert(
        'meta[property="og:url"]',
        () => {
          const el = document.createElement('meta');
          el.setAttribute('property', 'og:url');
          return el;
        },
        'content',
        canonical,
      );
    }

    return () => { document.title = DEFAULT_TITLE; };
  }, [title, description, canonical, noindex]);
};

export default usePageMeta;
