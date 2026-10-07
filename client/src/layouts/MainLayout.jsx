import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { authApi } from '../api/auth';

export default function MainLayout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
    <div className="bg-white text-gray-900 min-h-screen flex flex-col">
      <Header user={user} onLogout={authApi.logout} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-white overflow-x-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
