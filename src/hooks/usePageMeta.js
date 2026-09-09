import { useEffect } from 'react';

// Site metadata lives in figures/catalogue.mjs, which imports nothing and can
// therefore be read by scripts/prerender-routes.mjs at build time. A social
// scraper never runs this hook, so the values it applies have to be the same
// ones written into the HTML. Re-exported here because that is where the rest
// of the app already imports them from.
import {
  SITE,
  DEFAULT_TITLE as FALLBACK_TITLE,
  DEFAULT_DESCRIPTION as FALLBACK_DESCRIPTION,
  socialImage,
} from '../figures/catalogue.mjs';

export { SITE, FALLBACK_TITLE as DEFAULT_TITLE, FALLBACK_DESCRIPTION as DEFAULT_DESCRIPTION };

/** Create the tag if the document has not got one, then set an attribute on it. */
const upsert = (selector, create, attribute, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
};

/** Set an og: property, creating the tag if the prerender did not write one. */
const property = (name, value) =>
  upsert(
    `meta[property="${name}"]`,
    () => {
      const el = document.createElement('meta');
      el.setAttribute('property', name);
      return el;
    },
    'content',
    value,
  );

/** Remove an og: property the current route does not have a value for. */
const dropProperty = (name) => document.head.querySelector(`meta[property="${name}"]`)?.remove();

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
const usePageMeta = ({
  title,
  description,
  canonical,
  // Only a figure has a picture of its own; everything else previews as the
  // logo. Defaulted here rather than passed by five callers who would all pass
  // the same thing, and stable by identity so the effect does not re-run.
  image = socialImage(null),
  noindex = false,
} = {}) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : FALLBACK_TITLE;

    upsert(
      'meta[name="description"]',
      () => Object.assign(document.createElement('meta'), { name: 'description' }),
      'content',
      description || FALLBACK_DESCRIPTION,
    );

    property('og:title', title ? `${title} · ${SITE}` : FALLBACK_TITLE);
    property('og:description', description || FALLBACK_DESCRIPTION);

    // Every figure now previews as its own chart, so leaving these alone would
    // mean a reader who clicks from one figure to the next is looking at a
    // document that offers the first one's picture for the second one's URL.
    // Nothing that scrapes Open Graph runs JavaScript, so this changes no link
    // preview — it keeps the document honest about itself, which is cheaper
    // than remembering it is not.
    if (image) {
      property('og:image', image.url);
      upsert(
        'meta[name="twitter:image"]',
        () => Object.assign(document.createElement('meta'), { name: 'twitter:image' }),
        'content',
        image.url,
      );
      upsert(
        'meta[name="twitter:card"]',
        () => Object.assign(document.createElement('meta'), { name: 'twitter:card' }),
        'content',
        image.card,
      );

      if (image.alt) property('og:image:alt', image.alt);
      else dropProperty('og:image:alt');

      if (image.width) {
        property('og:image:width', String(image.width));
        property('og:image:height', String(image.height));
      } else {
        dropProperty('og:image:width');
        dropProperty('og:image:height');
      }
    }

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
      property('og:url', canonical);
    }

    return () => { document.title = FALLBACK_TITLE; };
  }, [title, description, canonical, image, noindex]);
};

export default usePageMeta;
