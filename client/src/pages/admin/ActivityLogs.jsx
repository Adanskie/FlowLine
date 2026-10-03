import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import Spinner from '../../components/ui/Spinner';

const ACTION_COLOR = { login:'primary', logout:'secondary', create:'success', update:'info', delete:'danger', approval:'warning', assignment:'success' };

export default function ActivityLogs() {
  const [search, setSearch]    = useState('');
  const [action, setAction]    = useState('');
  const [from,   setFrom]      = useState('');
  const [to,     setTo]        = useState('');

  const params = `search=${search}&action_type=${action}&from=${from}&to=${to}`;
  const { data: logs, loading, refetch } = useFetch(`/activity-logs?${params}`);

  return (
    <>
      <div className="page-heading mb-4">Audit Log</div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <input type="text" className="form-control form-control-sm" style={{ width:220 }}
          placeholder="Search description…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select form-select-sm" style={{ width:150 }}
          value={action} onChange={e => setAction(e.target.value)}>
          <option value="">All Actions</option>
          {['login','logout','create','update','delete','approval','assignment'].map(a =>
            <option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>
          )}
        </select>
        <input type="date" className="form-control form-control-sm" style={{ width:140 }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="form-control form-control-sm" style={{ width:140 }} value={to}   onChange={e => setTo(e.target.value)} />
        <button className="btn btn-outline-secondary btn-sm" onClick={refetch}><i className="bi bi-search"></i></button>
      </div>

      <div className="card border-0 shadow-sm">
        {loading ? <Spinner /> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light"><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Table</th><th>Description</th></tr></thead>
              <tbody>
                {logs?.length === 0
                  ? <tr><td colSpan={5} className="text-center py-5 text-muted"><i className="bi bi-journal-text d-block fs-2 mb-2 opacity-50"></i>No activity logged.</td></tr>
                  : logs?.map(l => (
                    <tr key={l.log_id}>
                      <td className="text-muted text-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="fw-semibold">{l.user?.employee ? `${l.user.employee.first_name} ${l.user.employee.last_name}` : l.user?.username ?? '—'}</td>
                      <td>
                        <span className={`badge bg-${ACTION_COLOR[l.action_type]??'secondary'}-subtle text-${ACTION_COLOR[l.action_type]??'secondary'} border`}>
                          {l.action_type?.charAt(0).toUpperCase()+l.action_type?.slice(1)}
                        </span>
                      </td>
                      <td className="text-muted">{l.table_affected ?? '—'}</td>
                      <td className="text-muted">{l.description?.length > 70 ? l.description.slice(0,70)+'…' : l.description}</td>
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
