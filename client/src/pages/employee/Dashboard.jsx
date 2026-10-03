import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/ui/StatCard';
import StageBadge from '../../components/ui/StageBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Spinner from '../../components/ui/Spinner';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
    const today = new Date().toISOString().split('T')[0];
    api.get(`/attendance?from=${today}&to=${today}`).then(r => setAttendance(r.data[0] ?? null));
  }, []);

  if (!data) return <Spinner />;

  return (
    <>
      <div className="page-heading mb-4">My Dashboard</div>

      <div className="row g-3 mb-4">
        {[
          { label:'Assigned Tasks', value: data.totalTasks,     icon:'bi-kanban-fill',             color:'#4f46e5', bg:'#eef2ff' },
          { label:'Completed',      value: data.completedCount, icon:'bi-check-circle-fill',       color:'#10b981', bg:'#d1fae5' },
          { label:'Overdue',        value: data.overdueCount,   icon:'bi-exclamation-circle-fill', color:'#ef4444', bg:'#fee2e2' },
        ].map(c => (
          <div key={c.label} className="col-6 col-md-4"><StatCard {...c} /></div>
        ))}
      </div>

      {/* Today's attendance */}
      {attendance ? (
        <div className="alert alert-info d-flex gap-2 align-items-center py-2 small mb-4">
          <i className="bi bi-calendar-check-fill"></i>
          Today: Time in <strong>{attendance.time_in ?? '—'}</strong> / Time out <strong>{attendance.time_out ?? '—'}</strong>
          &nbsp;—&nbsp;<strong>{attendance.attendance_status}</strong>
        </div>
      ) : (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small mb-4">
          <i className="bi bi-exclamation-circle-fill"></i>
          No attendance record for today.
          <Link to="/employee/attendance" className="ms-auto btn btn-sm btn-warning py-0 px-2">Log Attendance</Link>
        </div>
      )}

      <h6 className="fw-semibold mb-3">My Recent Tasks</h6>
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr><th>Task</th><th>Priority</th><th>Due Date</th><th>Stage</th><th></th></tr>
            </thead>
            <tbody>
              {data.recentTasks.length === 0
                ? <tr><td colSpan={5} className="text-center py-4 text-muted">No tasks assigned yet.</td></tr>
                : data.recentTasks.map(t => (
                  <tr key={t.task_id}>
                    <td className="fw-semibold">{t.task_title}</td>
                    <td><PriorityBadge priority={t.priority?.priority_name} /></td>
                    <td className={new Date(t.due_date) < new Date() ? 'text-danger' : ''}>{new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td><StageBadge stage={t.stage?.stage_name} /></td>
                    <td><Link to={`/employee/tasks/${t.task_id}`} className="btn btn-sm btn-outline-secondary py-0 px-2">View</Link></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
