import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { authApi } from '../api/auth';

export default function MainLayout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = authApi.getToken();
      if (!token) {
        // Not logged in -> redirect to login
        navigate('/login', { replace: true });
        return;
      }

      const profile = await authApi.getCurrentUser();
      if (profile) {
        setUser(profile);
      } else {
        // Fallback to locally stored username if offline
        const localUsername = authApi.getUsername();
        if (localUsername) {
          setUser({
            username: localUsername,
            avatarUrl: `https://github.com/${localUsername}.png`,
            role: 'User',
          });
        }
      }
    };

    fetchUser();
  }, [navigate]);

  return (
    <div className="bg-white text-gray-900 h-screen flex flex-col overflow-hidden">
      <Header
        user={user}
        onLogout={authApi.logout}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto overflow-x-hidden min-w-0">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
