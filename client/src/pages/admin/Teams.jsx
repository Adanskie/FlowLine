import { useState, useEffect } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../api/axios';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const EMPTY = { team_name: '', department_id: '', team_lead_id: '' };

export default function Teams() {
  const { data: teams, loading, refetch } = useFetch('/teams');
  const [depts,     setDepts]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form,      setForm]      = useState(EMPTY);
  const [editing,   setEditing]   = useState(null);
  const [msg,       setMsg]       = useState({ type: '', text: '' });

  useEffect(() => {
    api.get('/departments').then(r => setDepts(r.data));
    api.get('/employees').then(r => setEmployees(r.data));
  }, []);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  // Employees belonging to the selected department
  const deptEmployees = employees.filter(
    e => String(e.department_id) === String(form.department_id) && !e.is_deleted
  );

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async e => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/teams/${editing}`, form);
        flash('success', 'Team updated.');
      } else {
        await api.post('/teams', form);
        flash('success', 'Team created.');
      }
      setForm(EMPTY);
      setEditing(null);
      refetch();
    } catch (err) {
      flash('danger', err.response?.data?.error ?? 'Error.');
    }
  };

  const del = async (id, name) => {
    if (!confirm(`Remove "${name}"? Members will be unassigned from this team.`)) return;
    await api.delete(`/teams/${id}`);
    flash('success', 'Team removed.');
    refetch();
  };

  const startEdit = t => {
    setEditing(t.team_id);
    setForm({
      team_name:     t.team_name,
      department_id: String(t.department_id),
      team_lead_id:  t.team_lead_id ? String(t.team_lead_id) : '',
    });
  };

  const cancel = () => { setEditing(null); setForm(EMPTY); };

  return (
    <>
      <div className="page-heading mb-4">Teams</div>
      <Alert type={msg.type || 'success'} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />

      <div className="row g-4">
        {/* Form */}
        <div className="col-md-5">
          <div className="card border-0 shadow-sm p-4">
            <h6 className="fw-semibold mb-3">{editing ? 'Edit Team' : 'New Team'}</h6>
            <form onSubmit={save}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Team Name <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.team_name}
                  onChange={e => f('team_name', e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Department <span className="text-danger">*</span></label>
                <select className="form-select" required value={form.department_id}
                  onChange={e => { f('department_id', e.target.value); f('team_lead_id', ''); }}>
                  <option value="">Select…</option>
                  {depts.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Team Lead <span className="text-muted">(optional)</span></label>
                <select className="form-select" value={form.team_lead_id}
                  onChange={e => f('team_lead_id', e.target.value)}
                  disabled={!form.department_id}>
                  <option value="">None</option>
                  {deptEmployees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex gap-2">
                {editing && (
                  <button type="button" className="btn btn-light btn-sm" onClick={cancel}>Cancel</button>
                )}
                <button type="submit" className="btn btn-primary btn-sm">
                  {editing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            {loading ? <Spinner /> : (
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Team Name</th>
                    <th>Department</th>
                    <th>Team Lead</th>
                    <th className="text-center">Members</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {teams?.map(t => (
                    <tr key={t.team_id}>
                      <td className="fw-semibold">{t.team_name}</td>
                      <td className="text-muted">{t.department?.department_name ?? '—'}</td>
                      <td className="text-muted">
                        {t.teamLead ? `${t.teamLead.first_name} ${t.teamLead.last_name}` : '—'}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary">
                          {t.members?.length ?? 0}
                        </span>
                      </td>
                      <td className="text-end">
                        <button onClick={() => startEdit(t)}
                          className="btn btn-sm btn-outline-secondary py-0 px-2 me-1">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button onClick={() => del(t.team_id, t.team_name)}
                          className="btn btn-sm btn-outline-danger py-0 px-2">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teams?.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-3">No teams yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
