// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import Login from './components/Login';
import SignUp from './components/SignUp';
import DashboardView from './components/DashboardView';
import Spinner from './components/common/Spinner';
import MainLayout from './components/MainLayout';
import ContentLibraryView from './components/ContentLibraryView';
import SettingsView from './components/SettingsView';
import TeamView from './components/TeamView';
import BillingView from './components/BillingView';
import PricingPage from './components/PricingPage';
import AnalyticsView from './components/AnalyticsView';
import NewPostView from './components/NewPostView';
import EditPostView from './components/EditPostView';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const AppContent: React.FC = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return <Spinner />;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route
        path="/*"
        element={
          user ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<DashboardView />} />
                <Route path="/content-library" element={<ContentLibraryView />} />
                <Route path="/analytics" element={<AnalyticsView />} />
                <Route path="/settings" element={<SettingsView />} />
                <Route path="/team" element={<TeamView />} />
                <Route path="/billing" element={<BillingView />} />
                <Route path="/new-post" element={<NewPostView />} />
                <Route path="/edit-post/:id" element={<EditPostView />} />
                {/* Add other protected routes here */}
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
