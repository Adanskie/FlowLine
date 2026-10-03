import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/ui/StatCard';
import StageBadge from '../../components/ui/StageBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import TeamWorkload from '../../components/ui/TeamWorkload';
import Spinner from '../../components/ui/Spinner';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);
  if (!data) return <Spinner />;

  return (
    <>
      <div className="page-heading mb-4">Manager Dashboard</div>

      <div className="row g-3 mb-4">
        {[
          { label:'My Tasks',         value: data.totalTasks,      icon:'bi-kanban-fill',             color:'#4f46e5', bg:'#eef2ff' },
          { label:'Pending Approval', value: data.pendingApproval, icon:'bi-eye-fill',                color:'#f59e0b', bg:'#fef3c7' },
          { label:'Completed',        value: data.completedCount,  icon:'bi-check-circle-fill',       color:'#10b981', bg:'#d1fae5' },
          { label:'Overdue',          value: data.overdueCount,    icon:'bi-exclamation-circle-fill', color:'#ef4444', bg:'#fee2e2' },
        ].map(c => (
          <div key={c.label} className="col-6 col-md-3"><StatCard {...c} /></div>
        ))}
      </div>

      <TeamWorkload data={data.teamWorkload} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-semibold mb-0">Recent Tasks</h6>
        <Link to="/manager/tasks/new" className="btn btn-primary btn-sm">
          <i className="bi bi-plus-circle me-1"></i>Assign Task
        </Link>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Due Date</th><th>Stage</th><th></th></tr>
            </thead>
            <tbody>
              {data.recentTasks.length === 0
                ? <tr><td colSpan={6} className="text-center py-4 text-muted">No tasks yet.</td></tr>
                : data.recentTasks.map(t => (
                  <tr key={t.task_id}>
                    <td className="fw-semibold">{t.task_title}</td>
                    <td>{t.assignments.slice(0,2).map(a => <span key={a.assignment_id} className="badge bg-light text-dark border me-1">{a.employee?.first_name} {a.employee?.last_name}</span>)}</td>
                    <td><PriorityBadge priority={t.priority?.priority_name} /></td>
                    <td className={new Date(t.due_date) < new Date() ? 'text-danger' : ''}>{new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td><StageBadge stage={t.stage?.stage_name} /></td>
                    <td><Link to={`/manager/tasks/${t.task_id}`} className="btn btn-sm btn-outline-secondary py-0 px-2">View</Link></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
