import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';

const ICON_MAP = {
  assignment: ['bi-person-plus-fill',       'primary'],
  status:     ['bi-arrow-repeat',            'info'],
  approval:   ['bi-check-circle-fill',       'success'],
  deadline:   ['bi-exclamation-circle-fill', 'danger'],
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(r => setNotifications(r.data))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="page-heading">Notifications</div>
        <button onClick={markAllRead} className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-check2-all me-1"></i>Mark all as read
        </button>
      </div>

      <div className="card border-0 shadow-sm">
        {notifications.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-bell-slash d-block fs-2 mb-2 opacity-50"></i>
            No notifications yet.
          </div>
        ) : notifications.map(n => {
          const [icon, color] = ICON_MAP[n.notification_type] ?? ['bi-bell-fill', 'secondary'];
          return (
            <div key={n.notification_id}
                 className={`d-flex align-items-start gap-3 p-3 border-bottom ${!n.is_read ? 'bg-primary-subtle' : ''}`}>
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                   style={{ width:38, height:38, background:`var(--bs-${color}-bg-subtle, #eef2ff)` }}>
                <i className={`bi ${icon} text-${color}`}></i>
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold small">{n.title}</div>
                <div className="text-muted small">{n.message}</div>
                <div className="text-muted mt-1" style={{ fontSize:'.7rem' }}>
                  {new Date(n.created_at).toLocaleString()}
                  {!n.is_read && <span className="badge bg-primary ms-2">New</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
