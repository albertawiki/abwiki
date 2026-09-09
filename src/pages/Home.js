import React from 'react';
import usePageMeta from '../hooks/usePageMeta';
import Footer from '../components/Footer';
import MainContent from './MainContent';
import FeaturedCarousel from '../components/FeaturedCarousel';
import AlbertaMark from '../components/AlbertaMark';
import { SITE_ORIGIN } from '../figures';

const Home = () => {
  usePageMeta({ canonical: `${SITE_ORIGIN}/` });

  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="home-hero-text">
          <h1>alberta.wiki</h1>
          <p className="home-tagline">Data that matters most to Albertans</p>
        {/* The tagline says what the site is for. This says why it can be
            trusted, which is the whole claim, so it stays on the front page
            rather than only on the pages a reader has to go looking for. */}
          <p className="home-provenance">
            Every figure traces back to an original public document, and the numbers
            behind each chart are one click away.
          </p>
        </div>

        <AlbertaMark className="home-hero-mark" />
      </header>

      <FeaturedCarousel />

      <MainContent />

      <div className="footer-spacing" />
      <Footer />
    </div>
  );
};

export default Home;
