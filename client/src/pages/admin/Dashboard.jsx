import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../api/axios';
import StatCard from '../../components/ui/StatCard';
import StageBadge from '../../components/ui/StageBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import TeamWorkload from '../../components/ui/TeamWorkload';
import Spinner from '../../components/ui/Spinner';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);

  if (!data) return <Spinner />;

  const stageColors = ['#9ca3af','#3b82f6','#f59e0b','#10b981','#ef4444'];

  return (
    <>
      <div className="page-heading mb-4">Admin Dashboard</div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total Employees', value: data.totalEmployees,  icon:'bi-people-fill',            color:'#4f46e5', bg:'#eef2ff' },
          { label:'Total Tasks',     value: data.totalTasks,       icon:'bi-kanban-fill',             color:'#0891b2', bg:'#ecfeff' },
          { label:'Completed',       value: data.completedCount,   icon:'bi-check-circle-fill',       color:'#10b981', bg:'#d1fae5' },
          { label:'Overdue',         value: data.overdueCount,     icon:'bi-exclamation-circle-fill', color:'#ef4444', bg:'#fee2e2' },
          { label:'For Review',      value: data.forReviewCount,   icon:'bi-eye-fill',                color:'#f59e0b', bg:'#fef3c7' },
          { label:'Present Today',   value: data.presentToday,     icon:'bi-calendar-check-fill',     color:'#8b5cf6', bg:'#f5f3ff' },
        ].map(c => (
          <div key={c.label} className="col-6 col-md-4 col-xl-2">
            <StatCard {...c} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 h-100">
            <p className="fw-semibold small text-uppercase text-muted mb-3" style={{ letterSpacing:'.07em' }}>Tasks by Stage</p>
            <Doughnut
              data={{
                labels: data.stageCounts.map(s => s.stage),
                datasets: [{ data: data.stageCounts.map(s => s.count), backgroundColor: stageColors, borderWidth: 2 }]
              }}
              options={{ cutout:'62%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{ size:11 } } } } }}
            />
          </div>
        </div>
        <div className="col-md-8">
          <div className="card border-0 shadow-sm p-3 h-100">
            <p className="fw-semibold small text-uppercase text-muted mb-3" style={{ letterSpacing:'.07em' }}>Completions — Last 7 Days</p>
            <Line
              data={{
                labels: data.weeklyChart.map(d => d.label),
                datasets: [{ label:'Completed', data: data.weeklyChart.map(d => d.count), borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,.08)', fill:true, tension:.4, pointRadius:4 }]
              }}
              options={{ scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } }, plugins:{ legend:{ display:false } } }}
            />
          </div>
        </div>
      </div>

      {/* Team Workload */}
      <TeamWorkload data={data.teamWorkload} />

      {/* Recent Tasks */}
      <div className="card border-0 shadow-sm">
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <span className="fw-semibold">Recent Tasks</span>
          <Link to="/admin/tasks" className="btn btn-sm btn-outline-primary">View all</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Due Date</th><th>Stage</th></tr>
            </thead>
            <tbody>
              {data.recentTasks.length === 0
                ? <tr><td colSpan={5} className="text-center py-4 text-muted">No tasks yet.</td></tr>
                : data.recentTasks.map(t => (
                  <tr key={t.task_id}>
                    <td><Link to={`/admin/tasks/${t.task_id}`} className="fw-semibold text-decoration-none text-dark">{t.task_title}</Link></td>
                    <td>{t.assignments.slice(0,2).map(a => <span key={a.assignment_id} className="badge bg-light text-dark border me-1">{a.employee?.first_name} {a.employee?.last_name}</span>)}</td>
                    <td><PriorityBadge priority={t.priority?.priority_name} /></td>
                    <td className={new Date(t.due_date) < new Date() ? 'text-danger' : ''}>{new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td><StageBadge stage={t.stage?.stage_name} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
