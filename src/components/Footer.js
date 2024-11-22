import React from 'react';

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <p style={citationStyle}>
        Data Sources:
        <br />
        <span>Statistics Canada. Table 14-10-0064-01 Employee wages by industry, annual.</span>
        <br />
        <span>Statistics Canada. Table 18-10-0005-01 Consumer Price Index, annual average, not seasonally adjusted.</span>
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
