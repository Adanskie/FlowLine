import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import api from '../../api/axios';

export default function AppLayout() {
  const [unread, setUnread] = useState(0);

  // Poll unread notification count every 30 s
  useEffect(() => {
    const fetch = () => api.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    fetch();
    const timer = setInterval(fetch, 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar unread={unread} />

      {/* Main area pushed right of sidebar */}
      <div style={{ marginLeft: 250, flex: 1, minHeight: '100vh', background: '#f5f6fa' }}>
        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 1030,
          background: '#fff', borderBottom: '1px solid #e9ecef',
          padding: '0 1.5rem', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e1b4b' }}>
            Flowline
          </span>
          <span className="text-muted small d-none d-md-inline">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </header>

        {/* Page content */}
        <main style={{ padding: '1.75rem 2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
