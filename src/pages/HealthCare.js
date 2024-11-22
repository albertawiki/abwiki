import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import axios from 'axios';

const HealthCare = () => {
  const [healthData, setHealthData] = useState({});

  useEffect(() => {
    // Mocked API call or fetch real data
    axios.get('/api/healthcare')
      .then(response => setHealthData(response.data));
  }, []);

  return (
    <div className="healthcare-page">
      <h2>Healthcare Dashboard</h2>
      <div className="grid">
        {/* ER Wait Times */}
        <StatCard
          title="ER Wait Times"
          value={healthData.erWaitTime}
          unit="min"
          description="Average wait times in ER across Alberta's worst-performing hospitals."
        />
        
        {/* Add more healthcare-related stats here */}
      </div>
    </div>
  );
};

export default HealthCare;
