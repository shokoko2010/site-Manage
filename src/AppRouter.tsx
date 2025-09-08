import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimpleLandingPage from './components/SimpleLandingPage';
import App from './App';

console.log('AppRouter component loaded');

const AppRouter: React.FC = () => {
  console.log('AppRouter rendering');
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimpleLandingPage />} />
        <Route path="/app/*" element={<App />} />
        <Route path="/dashboard" element={<App />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;