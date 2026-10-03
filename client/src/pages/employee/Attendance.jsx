import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

const STATUS_BADGE = { Present:'success', Absent:'danger', 'On Leave':'warning' };

export default function EmployeeAttendance() {
  const [records,      setRecords]      = useState([]);
  const [todayRecord,  setTodayRecord]  = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [msg,          setMsg]          = useState({ type:'', text:'' });

  const flash = (t, x) => { setMsg({ type:t, text:x }); setTimeout(() => setMsg({ type:'', text:'' }), 3500); };

  const load = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [all, todayRes] = await Promise.all([
      api.get('/attendance'),
      api.get(`/attendance?from=${today}&to=${today}`),
    ]);
    setRecords(all.data);
    setTodayRecord(todayRes.data[0] ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const timeIn  = async () => { try { await api.post('/attendance/time-in');  flash('success', `Time-in recorded at ${new Date().toLocaleTimeString()}.`); load(); } catch (e) { flash('danger', e.response?.data?.error ?? 'Error.'); } };
  const timeOut = async () => { try { await api.post('/attendance/time-out'); flash('success', `Time-out recorded at ${new Date().toLocaleTimeString()}.`); load(); } catch (e) { flash('danger', e.response?.data?.error ?? 'Error.'); } };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="page-heading mb-4">My Attendance</div>
      <Alert type={msg.type||'success'} message={msg.text} onClose={() => setMsg({ type:'', text:'' })} />

      {/* Today card */}
      <div className="card border-0 shadow-sm p-4 mb-4">
        <h6 className="fw-semibold mb-3">Today — {new Date().toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric', year:'numeric' })}</h6>
        {todayRecord ? (
          <div className="row g-3 small mb-3">
            <div className="col-4"><div className="text-muted">Status</div><span className={`badge bg-${STATUS_BADGE[todayRecord.attendance_status]}-subtle text-${STATUS_BADGE[todayRecord.attendance_status]} fs-6`}>{todayRecord.attendance_status}</span></div>
            <div className="col-4"><div className="text-muted">Time In</div><div className="fw-bold">{todayRecord.time_in || '—'}</div></div>
            <div className="col-4"><div className="text-muted">Time Out</div><div className="fw-bold">{todayRecord.time_out || '—'}</div></div>
          </div>
        ) : null}

        <div className="d-flex gap-3 flex-wrap">
          {!todayRecord && <button onClick={timeIn} className="btn btn-success"><i className="bi bi-box-arrow-in-right me-1"></i>Time In</button>}
          {todayRecord && !todayRecord.time_out && <button onClick={timeOut} className="btn btn-danger"><i className="bi bi-box-arrow-right me-1"></i>Time Out</button>}
          {todayRecord?.time_out && (
            <div className="alert alert-success py-2 small mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill"></i>
              Attendance complete. {(() => {
                const [ih, im] = todayRecord.time_in.split(':').map(Number);
                const [oh, om] = todayRecord.time_out.split(':').map(Number);
                const hrs = ((oh * 60 + om) - (ih * 60 + im)) / 60;
                return `${hrs.toFixed(1)} hrs logged.`;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="card border-0 shadow-sm">
        <div className="px-3 pt-3 pb-2 border-bottom fw-semibold small">Attendance History</div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light"><tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {records.length === 0
                ? <tr><td colSpan={5} className="text-center py-4 text-muted">No records yet.</td></tr>
                : records.map(r => (
                  <tr key={r.attendance_id}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.time_in || '—'}</td>
                    <td>{r.time_out || '—'}</td>
                    <td>{r.time_in && r.time_out ? (() => { const [ih,im] = r.time_in.split(':').map(Number); const [oh,om] = r.time_out.split(':').map(Number); return `${(((oh*60+om)-(ih*60+im))/60).toFixed(1)} hrs`; })() : '—'}</td>
                    <td><span className={`badge bg-${STATUS_BADGE[r.attendance_status]}-subtle text-${STATUS_BADGE[r.attendance_status]}`}>{r.attendance_status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
