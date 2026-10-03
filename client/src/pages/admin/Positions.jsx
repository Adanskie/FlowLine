import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../api/axios';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

export default function Positions() {
  const { data, loading, refetch } = useFetch('/positions');
  const [form,    setForm]    = useState({ position_name: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [msg,     setMsg]     = useState({ type:'', text:'' });

  const flash = (t, x) => { setMsg({ type:t, text:x }); setTimeout(() => setMsg({ type:'', text:'' }), 3000); };

  const save = async e => {
    e.preventDefault();
    try {
      editing ? await api.put(`/positions/${editing}`, form) : await api.post('/positions', form);
      flash('success', editing ? 'Updated.' : 'Created.');
      setForm({ position_name:'', description:'' }); setEditing(null); refetch();
    } catch (err) { flash('danger', err.response?.data?.error ?? 'Error.'); }
  };

  const del = async (id, name) => {
    if (!confirm(`Remove "${name}"?`)) return;
    await api.delete(`/positions/${id}`);
    flash('success','Removed.'); refetch();
  };

  return (
    <>
      <div className="page-heading mb-4">Positions</div>
      <Alert type={msg.type || 'success'} message={msg.text} onClose={() => setMsg({ type:'', text:'' })} />

      <div className="row g-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm p-4">
            <h6 className="fw-semibold mb-3">{editing ? 'Edit Position' : 'New Position'}</h6>
            <form onSubmit={save}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Name <span className="text-danger">*</span></label>
                <input className="form-control" required value={form.position_name}
                  onChange={e => setForm(p => ({ ...p, position_name: e.target.value }))} />
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Description</label>
                <textarea className="form-control" rows={2} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="d-flex gap-2">
                {editing && <button type="button" className="btn btn-light btn-sm" onClick={() => { setEditing(null); setForm({ position_name:'', description:'' }); }}>Cancel</button>}
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
                  {data?.map(p => (
                    <tr key={p.position_id}>
                      <td className="fw-semibold">{p.position_name}</td>
                      <td className="text-muted">{p.description || '—'}</td>
                      <td className="text-center"><span className="badge bg-primary-subtle text-primary">{p._count?.employees ?? 0}</span></td>
                      <td className="text-end">
                        <button onClick={() => { setEditing(p.position_id); setForm({ position_name: p.position_name, description: p.description ?? '' }); }} className="btn btn-sm btn-outline-secondary py-0 px-2 me-1"><i className="bi bi-pencil"></i></button>
                        <button onClick={() => del(p.position_id, p.position_name)} className="btn btn-sm btn-outline-danger py-0 px-2"><i className="bi bi-trash"></i></button>
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
