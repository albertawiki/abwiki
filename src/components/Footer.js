import React from 'react';

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <p style={citationStyle}>
        All original figures and calculations are free to use and share under the <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons By Attribution</a> license.
      </p>
      <p style={citationStyle}>
        All data are property of their respective owners, annotated in the Sources under each chart. Please refer to the respective sources for more details and the most current information.
      </p>
      <p style={citationStyle}>
        Hosted in Calgary, Alberta.
      </p>
    </footer>
  );
};

const footerStyle = {
  backgroundColor: '#f1f1f1',
  padding: '20px',
  textAlign: 'center',
  fontSize: '14px',
  color: '#333',
};

const citationStyle = {
  fontStyle: 'italic',
  marginBottom: '10px',
};

export default Footer;
