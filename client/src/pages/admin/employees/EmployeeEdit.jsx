import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import Spinner from '../../../components/ui/Spinner';
import Alert from '../../../components/ui/Alert';

const ROLES = [{ role_id:1, role_name:'Administrator' },{ role_id:2, role_name:'Manager' },{ role_id:3, role_name:'Employee' }];
const EMP_TYPES = ['Regular','Contractual','Part-time','Probationary'];
const STATUSES  = ['Active','On Leave','Inactive'];

export default function EmployeeEdit() {
  const { id } = useParams();
  const nav    = useNavigate();
  const [depts,     setDepts]     = useState([]);
  const [positions, setPositions] = useState([]);
  const [teams,     setTeams]     = useState([]);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [form,      setForm]      = useState(null);

  useEffect(() => {
    api.get('/departments').then(r => setDepts(r.data));
    api.get('/positions').then(r => setPositions(r.data));
    api.get('/teams').then(r => setTeams(r.data));
    api.get(`/employees/${id}`).then(r => {
      const e = r.data;
      setForm({
        first_name: e.first_name, last_name: e.last_name, email: e.email, phone: e.phone ?? '',
        department_id: String(e.department_id ?? ''), position_id: String(e.position_id ?? ''),
        employment_type: e.employment_type ?? '', hire_date: e.hire_date?.split('T')[0] ?? '',
        status: e.status, role_id: String(e.user?.role_id ?? ''),
        username: e.user?.username ?? '', password: '',
        team_id: e.team_id ? String(e.team_id) : '',
      });
    });
  }, [id]);

  if (!form) return <Spinner />;

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.put(`/employees/${id}`, form);
      nav(`/admin/employees/${id}`);
    } catch (err) { setError(err.response?.data?.error ?? 'Update failed.'); }
    finally { setLoading(false); }
  };

  const Row = ({ label, col='col-md-6', req, children }) => (
    <div className={col}>
      <label className="form-label small fw-semibold">{label}{req && <span className="text-danger ms-1">*</span>}</label>
      {children}
    </div>
  );

  return (
    <>
      <div className="page-heading mb-4">Edit Employee</div>
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm p-4">
            <Alert type="danger" message={error} onClose={() => setError('')} />
            <form onSubmit={submit}>
              <div className="row g-3 mb-4">
                <Row label="First Name" req><input className="form-control" required value={form.first_name} onChange={e => f('first_name', e.target.value)} /></Row>
                <Row label="Last Name"  req><input className="form-control" required value={form.last_name}  onChange={e => f('last_name',  e.target.value)} /></Row>
                <Row label="Email" req><input type="email" className="form-control" required value={form.email} onChange={e => f('email', e.target.value)} /></Row>
                <Row label="Phone"><input className="form-control" value={form.phone} onChange={e => f('phone', e.target.value)} /></Row>
                <Row label="Employment Type">
                  <select className="form-select" value={form.employment_type} onChange={e => f('employment_type', e.target.value)}>
                    <option value="">Select…</option>
                    {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Row>
                <Row label="Hire Date"><input type="date" className="form-control" value={form.hire_date} onChange={e => f('hire_date', e.target.value)} /></Row>
                <Row label="Status" req>
                  <select className="form-select" required value={form.status} onChange={e => f('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Row>
              </div>
              <hr className="my-4" />
              <div className="row g-3 mb-4">
                <Row label="Department" req>
                  <select className="form-select" required value={form.department_id} onChange={e => f('department_id', e.target.value)}>
                    <option value="">Select…</option>
                    {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                  </select>
                </Row>
                <Row label="Position" req>
                  <select className="form-select" required value={form.position_id} onChange={e => f('position_id', e.target.value)}>
                    <option value="">Select…</option>
                    {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_name}</option>)}
                  </select>
                </Row>
                <Row label="Team">
                  <select className="form-select" value={form.team_id}
                    onChange={e => f('team_id', e.target.value)}
                    disabled={!form.department_id}>
                    <option value="">None</option>
                    {teams
                      .filter(t => String(t.department_id) === String(form.department_id))
                      .map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                  </select>
                </Row>
              </div>
              <hr className="my-4" />
              <div className="row g-3 mb-4">
                <Row label="Role" req col="col-md-4">
                  <select className="form-select" required value={form.role_id} onChange={e => f('role_id', e.target.value)}>
                    <option value="">Select…</option>
                    {ROLES.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                  </select>
                </Row>
                <Row label="Username" req col="col-md-4"><input className="form-control" required value={form.username} onChange={e => f('username', e.target.value)} /></Row>
                <Row label="New Password" col="col-md-4"><input type="password" className="form-control" placeholder="Leave blank to keep" value={form.password} onChange={e => f('password', e.target.value)} /></Row>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={() => nav(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
