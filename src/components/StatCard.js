import React, { useState } from 'react';

const StatCard = ({ title, description, sources, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="stat-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <div>{children}</div>
      <button className="source-button" onClick={toggleExpand}>
        {isExpanded ? 'Hide Sources' : 'Show Sources'}
      </button>
      {isExpanded && (
        <div className="sources-section">
          <h3>Sources</h3>
          <ul>
            {sources.map((source, index) => (
              <li key={index}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StatCard;
