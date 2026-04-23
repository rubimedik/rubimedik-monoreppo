import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import Users from './pages/Users';
import Consultations from './pages/Consultations';
import Donations from './pages/Donations';
import Financials from './pages/Financials';
import KYC from './pages/KYC';
import Login from './pages/Login';
import Referrals from './pages/Referrals';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Toaster position="top-right" richColors />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="users" element={<Users />} />
              <Route path="consultations" element={<Consultations />} />
              <Route path="donations" element={<Donations />} />
              <Route path="financials" element={<Financials />} />
              <Route path="kyc" element={<KYC />} />
              <Route path="referrals" element={<Referrals />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
