import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../../../hooks/useFetch';
import Spinner from '../../../components/ui/Spinner';
import Alert from '../../../components/ui/Alert';
import api from '../../../api/axios';

export default function EmployeeList() {
  const [search,   setSearch]   = useState('');
  const [deptId,   setDeptId]   = useState('');
  const [status,   setStatus]   = useState('');
  const [msg,      setMsg]      = useState('');

  const { data: employees, loading, refetch } = useFetch(`/employees?search=${search}&department_id=${deptId}&status=${status}`);
  const { data: depts } = useFetch('/departments');

  const archive = async (id, name) => {
    if (!confirm(`Archive ${name}? Their account will be deactivated but all historical records will be preserved.`)) return;
    await api.delete(`/employees/${id}`);
    setMsg(`${name} has been archived.`);
    refetch();
  };

  const statusBadge = s => {
    const map = { Active: 'success', 'On Leave': 'warning', Inactive: 'secondary' };
    return <span className={`badge bg-${map[s] ?? 'secondary'}-subtle text-${map[s] ?? 'secondary'} border`}>{s}</span>;
  };

  return (
    <>
      <div className="page-heading mb-4">Employee Management</div>

      {msg && <Alert type="success" message={msg} onClose={() => setMsg('')} />}

      {/* Toolbar */}
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-start mb-4">
        <div className="d-flex flex-wrap gap-2">
          <input type="text" className="form-control form-control-sm" style={{ width: 220 }}
            placeholder="Search name or email…" value={search}
            onChange={e => setSearch(e.target.value)} />
          <select className="form-select form-select-sm" style={{ width: 180 }}
            value={deptId} onChange={e => setDeptId(e.target.value)}>
            <option value="">All Departments</option>
            {depts?.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
          <select className="form-select form-select-sm" style={{ width: 140 }}
            value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['Active','On Leave','Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Link to="/admin/employees/new" className="btn btn-primary btn-sm">
          <i className="bi bi-person-plus-fill me-1"></i>Add Employee
        </Link>
      </div>

      <div className="card border-0 shadow-sm">
        {loading ? <Spinner /> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr><th>Employee</th><th>Department</th><th>Position</th><th>Role</th><th>Status</th><th className="text-end">Actions</th></tr>
              </thead>
              <tbody>
                {employees?.length === 0
                  ? <tr><td colSpan={6} className="text-center py-5 text-muted">No employees found.</td></tr>
                  : employees?.map(emp => (
                    <tr key={emp.employee_id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                               style={{ width:34, height:34, fontSize:'.8rem' }}>
                            {emp.first_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold">{emp.first_name} {emp.last_name}</div>
                            <div className="text-muted" style={{ fontSize:'.72rem' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department?.department_name ?? '—'}</td>
                      <td>{emp.position?.position_name ?? '—'}</td>
                      <td><span className="badge bg-secondary-subtle text-secondary border">{emp.user?.role?.role_name ?? 'None'}</span></td>
                      <td>{statusBadge(emp.status)}</td>
                      <td className="text-end">
                        <Link to={`/admin/employees/${emp.employee_id}`} className="btn btn-sm btn-outline-secondary py-0 px-2 me-1"><i className="bi bi-eye"></i></Link>
                        <Link to={`/admin/employees/${emp.employee_id}/edit`} className="btn btn-sm btn-outline-secondary py-0 px-2 me-1"><i className="bi bi-pencil"></i></Link>
                        <button onClick={() => archive(emp.employee_id, `${emp.first_name} ${emp.last_name}`)}
                          className="btn btn-sm btn-outline-warning py-0 px-2" title="Archive employee">
                          <i className="bi bi-archive"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
