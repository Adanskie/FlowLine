import { useParams, Link, useNavigate } from 'react-router-dom';
import useFetch from '../../../hooks/useFetch';
import api from '../../../api/axios';
import StageBadge from '../../../components/ui/StageBadge';
import Spinner from '../../../components/ui/Spinner';

export default function EmployeeView() {
  const { id } = useParams();
  const nav    = useNavigate();
  const { data: emp, loading } = useFetch(`/employees/${id}`);

  if (loading) return <Spinner />;
  if (!emp) return <div className="text-muted">Employee not found.</div>;

  const statusColor = { Active:'success', 'On Leave':'warning', Inactive:'secondary' };

  return (
    <>
      <div className="page-heading mb-4">Employee Profile</div>
      <div className="row g-4">
        {/* Left */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 text-center mb-3">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold mx-auto mb-3"
                 style={{ width:80, height:80, fontSize:'2rem' }}>
              {emp.first_name[0].toUpperCase()}
            </div>
            <h5 className="fw-bold mb-0">{emp.first_name} {emp.last_name}</h5>
            <p className="text-muted small mb-2">{emp.position?.position_name}</p>
            <span className={`badge bg-${statusColor[emp.status] ?? 'secondary'}-subtle text-${statusColor[emp.status] ?? 'secondary'} border mb-3`}>{emp.status}</span>
            <div className="d-flex gap-2 justify-content-center">
              <Link to={`/admin/employees/${id}/edit`} className="btn btn-sm btn-outline-primary"><i className="bi bi-pencil me-1"></i>Edit</Link>
              <button
                className="btn btn-sm btn-outline-warning"
                onClick={async () => {
                  if (!confirm(`Archive ${emp.first_name} ${emp.last_name}?\n\nTheir account will be deactivated but all tasks, comments, approvals and activity logs are preserved.`)) return;
                  await api.delete(`/employees/${id}`);
                  nav('/admin/employees');
                }}>
                <i className="bi bi-archive me-1"></i>Archive
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-sm p-3 small">
            {[
              ['bi-envelope',    'Email',       emp.email],
              ['bi-telephone',   'Phone',       emp.phone ?? '—'],
              ['bi-building',    'Department',  emp.department?.department_name ?? '—'],
              ['bi-briefcase',   'Emp. Type',   emp.employment_type ?? '—'],
              ['bi-calendar',    'Hire Date',   emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : '—'],
              ['bi-shield-fill', 'Role',        emp.user?.role?.role_name ?? '—'],
              ['bi-person',      'Username',    emp.user?.username ?? '—'],
            ].map(([icon, label, value]) => (
              <div key={label} className="d-flex align-items-start gap-2 py-2 border-bottom">
                <i className={`bi ${icon} text-muted mt-1`} style={{ width:16 }}></i>
                <div>
                  <div className="text-muted" style={{ fontSize:'.7rem' }}>{label}</div>
                  <div className="fw-semibold">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="px-3 pt-3 pb-2 border-bottom fw-semibold small">Assigned Tasks</div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr><th>Task</th><th>Due Date</th><th>Stage</th></tr>
                </thead>
                <tbody>
                  {emp.taskAssignments?.length === 0
                    ? <tr><td colSpan={3} className="text-center py-3 text-muted">No tasks assigned.</td></tr>
                    : emp.taskAssignments?.map(a => (
                      <tr key={a.assignment_id}>
                        <td><Link to={`/admin/tasks/${a.task?.task_id}`} className="fw-semibold text-decoration-none text-dark">{a.task?.task_title}</Link></td>
                        <td className={a.task?.due_date && new Date(a.task.due_date) < new Date() ? 'text-danger' : ''}>{a.task?.due_date ? new Date(a.task.due_date).toLocaleDateString() : '—'}</td>
                        <td><StageBadge stage={a.task?.stage?.stage_name} /></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
