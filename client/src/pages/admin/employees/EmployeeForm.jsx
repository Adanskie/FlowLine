import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import Alert from '../../../components/ui/Alert';

export default function EmployeeForm() {
  const nav = useNavigate();
  const [depts,     setDepts]     = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles,     setRoles]     = useState([{ role_id:1, role_name:'Administrator' },{ role_id:2, role_name:'Manager' },{ role_id:3, role_name:'Employee' }]);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [form, setForm] = useState({
    first_name:'', last_name:'', email:'', phone:'',
    department_id:'', position_id:'', employment_type:'', hire_date:'',
    role_id:'', username:'', password:'',
  });

  useEffect(() => {
    api.get('/departments').then(r => setDepts(r.data));
    api.get('/positions').then(r => setPositions(r.data));
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/employees', form);
      nav('/admin/employees');
    } catch (err) { setError(err.response?.data?.error ?? 'Failed to create employee.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-heading mb-4">Add Employee</div>
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm p-4">
            <Alert type="danger" message={error} onClose={() => setError('')} />
            <form onSubmit={submit}>

              <Section label="Personal Information" />
              <div className="row g-3 mb-4">
                <Field label="First Name" required><input className="form-control" required value={form.first_name} onChange={e => f('first_name', e.target.value)} /></Field>
                <Field label="Last Name"  required><input className="form-control" required value={form.last_name}  onChange={e => f('last_name',  e.target.value)} /></Field>
                <Field label="Email" required col="col-md-6"><input type="email" className="form-control" required value={form.email} onChange={e => f('email', e.target.value)} /></Field>
                <Field label="Phone" col="col-md-6"><input className="form-control" value={form.phone} onChange={e => f('phone', e.target.value)} /></Field>
                <Field label="Employment Type" col="col-md-6">
                  <select className="form-select" value={form.employment_type} onChange={e => f('employment_type', e.target.value)}>
                    <option value="">Select…</option>
                    {['Regular','Contractual','Part-time','Probationary'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Hire Date" col="col-md-6"><input type="date" className="form-control" value={form.hire_date} onChange={e => f('hire_date', e.target.value)} /></Field>
              </div>

              <hr className="my-4" />
              <Section label="Organizational Assignment" />
              <div className="row g-3 mb-4">
                <Field label="Department" required col="col-md-6">
                  <select className="form-select" required value={form.department_id} onChange={e => f('department_id', e.target.value)}>
                    <option value="">Select…</option>
                    {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                  </select>
                </Field>
                <Field label="Position" required col="col-md-6">
                  <select className="form-select" required value={form.position_id} onChange={e => f('position_id', e.target.value)}>
                    <option value="">Select…</option>
                    {positions.map(p => <option key={p.position_id} value={p.position_id}>{p.position_name}</option>)}
                  </select>
                </Field>
              </div>

              <hr className="my-4" />
              <Section label="System Account" />
              <div className="row g-3 mb-4">
                <Field label="Role" required col="col-md-4">
                  <select className="form-select" required value={form.role_id} onChange={e => f('role_id', e.target.value)}>
                    <option value="">Select…</option>
                    {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                  </select>
                </Field>
                <Field label="Username" required col="col-md-4"><input className="form-control" required value={form.username} onChange={e => f('username', e.target.value)} /></Field>
                <Field label="Password" required col="col-md-4"><input type="password" className="form-control" required minLength={6} value={form.password} onChange={e => f('password', e.target.value)} /></Field>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light" onClick={() => nav(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-2" />}
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const Section = ({ label }) => (
  <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize:'.7rem', letterSpacing:'.1em' }}>{label}</h6>
);

const Field = ({ label, required, col = 'col-md-6', children }) => (
  <div className={col}>
    <label className="form-label small fw-semibold">{label}{required && <span className="text-danger ms-1">*</span>}</label>
    {children}
  </div>
);
