import React from 'react';
import usePageMeta from '../hooks/usePageMeta';
import AlbertaMark from '../components/AlbertaMark';
import { DEFAULT_DESCRIPTION } from '../figures/catalogue.mjs';

/**
 * The site itself, drawn at social-card proportions, for
 * `scripts/render-og-images.mjs` to photograph — the picture a shared link to
 * the home page, a topic page, or any page that is not a figure previews with.
 *
 * Not a screenshot of the actual hero, for the same reason a figure's card
 * isn't a screenshot of its real card: the hero sits inside a page with
 * navigation and a column width set around it, none of which belongs in an
 * image that has to stand on its own at whatever size a chat client decides
 * to draw it. This carries the same outline and lockup a reader already sees
 * on the home page, so the preview and the page it links to read as the same
 * thing rather than a promise and a different delivery.
 *
 * Deliberately not the crest this replaced. That mark used the flag's own
 * colours and a heraldic silhouette, which reads closer to an official seal
 * than the unaffiliated register the rest of the site works to hold — see the
 * FAQ's "who maintains it". A soft outline and a plain wordmark make the same
 * claim the FAQ does: this is a reference, not an institution.
 */
const DefaultOgCard = () => {
  usePageMeta({ noindex: true });

  return (
    <div className="og-card og-card-default" data-og-ready="default">
      <AlbertaMark className="og-card-default-mark" />
      <div className="og-card-default-text">
        <h1 className="og-card-default-title">alberta.wiki</h1>
        <p className="og-card-default-tagline">Data that matters most to Albertans</p>
        <p className="og-card-default-provenance">{DEFAULT_DESCRIPTION}</p>
      </div>
    </div>
  );
};

export default DefaultOgCard;
