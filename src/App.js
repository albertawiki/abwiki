import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
// Import additional pages (if you want separate pages for specific issues)
import HealthCare from './pages/HealthCare';
//import Inflation from './pages/Inflation';
//import Housing from './pages/Housing';
//import Economy from './pages/Economy';
//import Wildfires from './pages/Wildfires';
import './App.css';

/*<Route path="/inflation" element={<Inflation />} />
<Route path="/housing" element={<Housing />} />
<Route path="/economy" element={<Economy />} />
<Route path="/wildfires" element={<Wildfires />} />*/

const App = () => {
  return (
    <Router>
      {/* Navbar to navigate between pages */}
      {/*<Navbar />*/}
      
      <div className="container">
        <Routes>
          {/* Define routes for each page */}
          <Route path="/" element={<Home />} />
          {/*<Route path="/health" element={<HealthCare />} />*/}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
