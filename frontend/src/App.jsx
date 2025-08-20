import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Silos from './components/Inventory/Silos/Silos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Silos />} />
      </Routes>
    </Router>
  );
}

export default App;
