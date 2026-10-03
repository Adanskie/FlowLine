import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../api/axios';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

export default function Departments() {
  const { data, loading, refetch } = useFetch('/departments');
  const [form,    setForm]    = useState({ department_name: '', description: '' });
  const [editing, setEditing] = useState(null); // id being edited
  const [msg,     setMsg]     = useState({ type:'', text:'' });

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type:'', text:'' }), 3000); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/departments/${editing}`, form);
        flash('success', 'Department updated.');
      } else {
        await api.post('/departments', form);
        flash('success', 'Department created.');
      }
      setForm({ department_name:'', description:'' });
      setEditing(null);
      refetch();
    } catch (err) { flash('danger', err.response?.data?.error ?? 'Error.'); }
  };

  const del = async (id, name) => {
    if (!confirm(`Remove "${name}"?`)) return;
    await api.delete(`/departments/${id}`);
    flash('success', 'Removed.'); refetch();
  };

  const startEdit = d => { setEditing(d.department_id); setForm({ department_name: d.department_name, description: d.description ?? '' }); };
  const cancel    = () => { setEditing(null); setForm({ department_name:'', description:'' }); };

  return (
    <>
      <div className="page-heading mb-4">Departments</div>
      <Alert type={msg.type || 'success'} message={msg.text} onClose={() => setMsg({ type:'', text:'' })} />

      <div className="row g-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm p-4">
            <h6 className="fw-semibold mb-3">{editing ? 'Edit Department' : 'New Department'}</h6>
            <form onSubmit={save}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Name <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.department_name}
                  onChange={e => setForm(p => ({ ...p, department_name: e.target.value }))} />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Description</label>
                <textarea className="form-control" rows={2} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="d-flex gap-2">
                {editing && <button type="button" className="btn btn-light btn-sm" onClick={cancel}>Cancel</button>}
                <button type="submit" className="btn btn-primary btn-sm">{editing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card border-0 shadow-sm">
            {loading ? <Spinner /> : (
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light"><tr><th>Name</th><th>Description</th><th className="text-center">Employees</th><th></th></tr></thead>
                <tbody>
                  {data?.map(d => (
                    <tr key={d.department_id}>
                      <td className="fw-semibold">{d.department_name}</td>
                      <td className="text-muted">{d.description || '—'}</td>
                      <td className="text-center"><span className="badge bg-primary-subtle text-primary">{d._count?.employees ?? 0}</span></td>
                      <td className="text-end">
                        <button onClick={() => startEdit(d)} className="btn btn-sm btn-outline-secondary py-0 px-2 me-1"><i className="bi bi-pencil"></i></button>
                        <button onClick={() => del(d.department_id, d.department_name)} className="btn btn-sm btn-outline-danger py-0 px-2"><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
