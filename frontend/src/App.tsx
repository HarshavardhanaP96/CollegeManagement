import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CollegeListPage } from './pages/superadmin/CollegeListPage';
import { useAuthStore } from './store/authStore';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/superadmin/colleges" element={<CollegeListPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;


