import { useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import useFetch from '../../hooks/useFetch';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminReports() {
  const today  = new Date().toISOString().split('T')[0];
  const first  = new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const [from, setFrom] = useState(first);
  const [to,   setTo]   = useState(today);
  const [deptId, setDeptId] = useState('');
  const [empId,  setEmpId]  = useState('');

  const params = `date_from=${from}&date_to=${to}&department_id=${deptId}&employee_id=${empId}`;
  const { data, loading, refetch } = useFetch(`/reports?${params}`);
  const { data: depts }     = useFetch('/departments');
  const { data: employees } = useFetch('/employees');

  const exportExcel = () => window.open(`/api/reports/export/excel?${params}`, '_blank');

  if (loading || !data) return <Spinner />;

  return (
    <>
      <div className="page-heading mb-4">Reports</div>

      {/* Filters */}
      <div className="card border-0 shadow-sm p-3 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-6 col-md-2"><label className="form-label small fw-semibold">From</label><input type="date" className="form-control form-control-sm" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div className="col-6 col-md-2"><label className="form-label small fw-semibold">To</label><input type="date" className="form-control form-control-sm" value={to} onChange={e => setTo(e.target.value)} /></div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Department</label>
            <select className="form-select form-select-sm" value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">All Departments</option>
              {depts?.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Employee</label>
            <select className="form-select form-select-sm" value={empId} onChange={e => setEmpId(e.target.value)}>
              <option value="">All Employees</option>
              {employees?.map(e => <option key={e.employee_id} value={e.employee_id}>{e.first_name} {e.last_name}</option>)}
            </select>
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={refetch}><i className="bi bi-funnel me-1"></i>Apply</button>
            <button className="btn btn-outline-success btn-sm" onClick={exportExcel}><i className="bi bi-file-spreadsheet me-1"></i>Excel</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total Tasks',    value: data.totalTasks,     icon:'bi-kanban-fill',             color:'#4f46e5', bg:'#eef2ff' },
          { label:'Completed',      value: data.completedTasks, icon:'bi-check-circle-fill',       color:'#10b981', bg:'#d1fae5' },
          { label:'Overdue',        value: data.overdueTasks,   icon:'bi-exclamation-circle-fill', color:'#ef4444', bg:'#fee2e2' },
          { label:'Completion Rate',value: `${data.completionRate}%`, icon:'bi-bar-chart-fill',    color:'#f59e0b', bg:'#fef3c7' },
        ].map(c => <div key={c.label} className="col-6 col-md-3"><StatCard {...c} /></div>)}
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3">
            <p className="fw-semibold small text-uppercase text-muted mb-3" style={{ letterSpacing:'.07em' }}>Tasks by Stage</p>
            <Doughnut
              data={{ labels: data.stageCounts.map(s => s.stage), datasets: [{ data: data.stageCounts.map(s => s.count), backgroundColor: ['#9ca3af','#3b82f6','#f59e0b','#10b981','#ef4444'], borderWidth:2 }] }}
              options={{ cutout:'62%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{ size:11 } } } } }}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3">
            <p className="fw-semibold small text-uppercase text-muted mb-3" style={{ letterSpacing:'.07em' }}>Tasks by Priority</p>
            <Bar
              data={{ labels: data.priorityCounts.map(p => p.priority), datasets: [{ label:'Tasks', data: data.priorityCounts.map(p => p.count), backgroundColor:['#10b981','#f59e0b','#ef4444'], borderRadius:6 }] }}
              options={{ plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } }}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3">
            <p className="fw-semibold small text-uppercase text-muted mb-3" style={{ letterSpacing:'.07em' }}>Attendance Summary</p>
            <Doughnut
              data={{ labels: data.attendanceSummary.map(a => a.attendance_status), datasets: [{ data: data.attendanceSummary.map(a => a._count.attendance_id), backgroundColor:['#10b981','#ef4444','#f59e0b'], borderWidth:2 }] }}
              options={{ cutout:'60%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{ size:11 } } } } }}
            />
          </div>
        </div>
      </div>

      {/* Employee performance table */}
      <div className="card border-0 shadow-sm">
        <div className="px-3 pt-3 pb-2 border-bottom fw-semibold small">Employee Performance</div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light"><tr><th>Employee</th><th>Department</th><th className="text-center">Assigned</th><th className="text-center">Completed</th><th className="text-center">Overdue</th><th>Completion Rate</th></tr></thead>
            <tbody>
              {data.performance.length === 0
                ? <tr><td colSpan={6} className="text-center py-4 text-muted">No data for this period.</td></tr>
                : data.performance.map(r => (
                  <tr key={r.employee.employee_id}>
                    <td className="fw-semibold">{r.employee.first_name} {r.employee.last_name}</td>
                    <td className="text-muted">{r.employee.department?.department_name ?? '—'}</td>
                    <td className="text-center">{r.assigned}</td>
                    <td className="text-center text-success fw-semibold">{r.completed}</td>
                    <td className="text-center text-danger">{r.overdue}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height:6 }}>
                          <div className={`progress-bar ${r.completion_rate >= 80 ? 'bg-success' : r.completion_rate >= 50 ? 'bg-warning' : 'bg-danger'}`}
                               style={{ width:`${r.completion_rate}%` }} />
                        </div>
                        <span className="fw-semibold" style={{ minWidth:36, textAlign:'right' }}>{r.completion_rate}%</span>
                      </div>
                    </td>
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
