import React from 'react';

const StatCard = ({ title, value, unit, description }) => {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <p>{value} {unit}</p>
      <p>{description}</p>
    </div>
  );
};

export default StatCard;
