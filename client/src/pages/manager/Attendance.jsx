import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../api/axios';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

export default function ManagerAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to,   setTo]   = useState(today);
  const [msg,  setMsg]  = useState({ type:'', text:'' });
  const { data: records, loading, refetch } = useFetch(`/attendance?from=${from}&to=${to}`);
  const { data: employees } = useFetch('/employees');
  const [newRec, setNewRec] = useState({ employee_id:'', date: today, time_in:'', time_out:'', attendance_status:'Present' });

  const flash = (t, x) => { setMsg({ type:t, text:x }); setTimeout(() => setMsg({ type:'', text:'' }), 3000); };

  const add = async e => {
    e.preventDefault();
    try { await api.post('/attendance', newRec); flash('success','Record added.'); refetch(); }
    catch (err) { flash('danger', err.response?.data?.error ?? 'Error.'); }
  };

  return (
    <>
      <div className="page-heading mb-4">Attendance</div>
      <Alert type={msg.type||'success'} message={msg.text} onClose={() => setMsg({ type:'', text:'' })} />

      <div className="d-flex flex-wrap gap-3 mb-4 align-items-end">
        <div><label className="form-label small fw-semibold">From</label><input type="date" className="form-control form-control-sm" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div><label className="form-label small fw-semibold">To</label><input type="date" className="form-control form-control-sm" value={to} onChange={e => setTo(e.target.value)} /></div>
        <button className="btn btn-outline-secondary btn-sm" onClick={refetch}><i className="bi bi-search"></i></button>
      </div>

      <div className="card border-0 shadow-sm p-3 mb-4">
        <h6 className="fw-semibold mb-3 small">Log Attendance</h6>
        <form onSubmit={add} className="row g-3 align-items-end">
          <div className="col-md-3">
            <select className="form-select form-select-sm" required value={newRec.employee_id} onChange={e => setNewRec(p => ({ ...p, employee_id: e.target.value }))}>
              <option value="">Select Employee</option>
              {employees?.map(e => <option key={e.employee_id} value={e.employee_id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>
          <div className="col-md-2"><input type="date" className="form-control form-control-sm" required value={newRec.date} onChange={e => setNewRec(p => ({ ...p, date: e.target.value }))} /></div>
          <div className="col-md-2"><input type="time" className="form-control form-control-sm" value={newRec.time_in}  onChange={e => setNewRec(p => ({ ...p, time_in: e.target.value }))} /></div>
          <div className="col-md-2"><input type="time" className="form-control form-control-sm" value={newRec.time_out} onChange={e => setNewRec(p => ({ ...p, time_out: e.target.value }))} /></div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={newRec.attendance_status} onChange={e => setNewRec(p => ({ ...p, attendance_status: e.target.value }))}>
              {['Present','Absent','On Leave'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-1"><button className="btn btn-success btn-sm w-100">Add</button></div>
        </form>
      </div>

      <div className="card border-0 shadow-sm">
        {loading ? <Spinner /> : <AttendanceTable records={records ?? []} canManage={true} onRefresh={refetch} />}
      </div>
    </>
  );
}
