import { useState } from 'react';
import api from '../../api/axios';

const STATUS_BADGE = { Present:'success', Absent:'danger', 'On Leave':'warning' };

export default function AttendanceTable({ records = [], canManage = false, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({});

  const startEdit = r => { setEditing(r.attendance_id); setForm({ time_in: r.time_in ?? '', time_out: r.time_out ?? '', attendance_status: r.attendance_status }); };
  const save = async e => {
    e.preventDefault();
    await api.put(`/attendance/${editing}`, form);
    setEditing(null); onRefresh();
  };
  const del = async id => { if (!confirm('Delete this record?')) return; await api.delete(`/attendance/${id}`); onRefresh(); };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 small">
        <thead className="table-light">
          <tr><th>Employee</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Status</th>{canManage && <th></th>}</tr>
        </thead>
        <tbody>
          {records.length === 0
            ? <tr><td colSpan={6} className="text-center py-4 text-muted">No records found.</td></tr>
            : records.map(r => (
              editing === r.attendance_id ? (
                <tr key={r.attendance_id}>
                  <td colSpan={2} className="fw-semibold">{r.employee?.first_name} {r.employee?.last_name} — {new Date(r.date).toLocaleDateString()}</td>
                  <td><input type="time" className="form-control form-control-sm" value={form.time_in} onChange={e => setForm(p => ({ ...p, time_in: e.target.value }))} /></td>
                  <td><input type="time" className="form-control form-control-sm" value={form.time_out} onChange={e => setForm(p => ({ ...p, time_out: e.target.value }))} /></td>
                  <td>
                    <select className="form-select form-select-sm" value={form.attendance_status} onChange={e => setForm(p => ({ ...p, attendance_status: e.target.value }))}>
                      {['Present','Absent','On Leave'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button onClick={save} className="btn btn-sm btn-success py-0 px-2 me-1">Save</button>
                    <button onClick={() => setEditing(null)} className="btn btn-sm btn-light py-0 px-2">×</button>
                  </td>
                </tr>
              ) : (
                <tr key={r.attendance_id}>
                  <td className="fw-semibold">{r.employee?.first_name} {r.employee?.last_name}</td>
                  <td>{new Date(r.date).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}</td>
                  <td>{r.time_in || '—'}</td>
                  <td>{r.time_out || '—'}</td>
                  <td><span className={`badge bg-${STATUS_BADGE[r.attendance_status] ?? 'secondary'}-subtle text-${STATUS_BADGE[r.attendance_status] ?? 'secondary'}`}>{r.attendance_status}</span></td>
                  {canManage && (
                    <td className="text-end">
                      <button onClick={() => startEdit(r)} className="btn btn-sm btn-outline-secondary py-0 px-2 me-1"><i className="bi bi-pencil"></i></button>
                      <button onClick={() => del(r.attendance_id)} className="btn btn-sm btn-outline-danger py-0 px-2"><i className="bi bi-trash"></i></button>
                    </td>
                  )}
                </tr>
              )
            ))
          }
        </tbody>
      </table>
    </div>
  );
}
