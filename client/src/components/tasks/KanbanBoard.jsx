import { Link } from 'react-router-dom';
import StageBadge from '../ui/StageBadge';
import PriorityBadge from '../ui/PriorityBadge';

const STAGE_COLORS = {
  'Pending':     '#9ca3af',
  'In Progress': '#3b82f6',
  'For Review':  '#f59e0b',
  'Completed':   '#10b981',
  'Overdue':     '#ef4444',
};

const STAGES = ['Pending','In Progress','For Review','Completed','Overdue'];

export default function KanbanBoard({ tasks = [], basePath }) {
  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.stage?.stage_name === s);
    return acc;
  }, {});

  // Also add overdue tasks (past due & not completed) to Overdue column
  const overdueIds = new Set(
    tasks.filter(t => new Date(t.due_date) < new Date() && t.stage?.stage_name !== 'Completed').map(t => t.task_id)
  );
  overdueIds.forEach(id => {
    const t = tasks.find(x => x.task_id === id);
    if (t && !grouped['Overdue'].find(x => x.task_id === id)) grouped['Overdue'].push(t);
  });

  const latestProgress = t => t.updates?.[0]?.progress_percent ?? 0;

  return (
    <div className="kanban-wrap">
      {STAGES.map(stage => {
        const color  = STAGE_COLORS[stage];
        const items  = grouped[stage] ?? [];
        return (
          <div key={stage} className="kanban-col">
            <div className="d-flex justify-content-between align-items-center mb-3" style={{ fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em' }}>
              <span style={{ color }}>{stage}</span>
              <span className="badge rounded-pill" style={{ background:`${color}20`, color, fontSize:'.72rem' }}>{items.length}</span>
            </div>
            {items.length === 0
              ? <div className="text-center py-3 text-muted" style={{ fontSize:'.75rem' }}>No tasks</div>
              : items.map(t => {
                  const prog = latestProgress(t);
                  return (
                    <Link key={t.task_id} to={`${basePath}/${t.task_id}`} className="kanban-card">
                      <div className="fw-semibold small mb-2" style={{ color:'#1e1b4b', lineHeight:1.3 }}>
                        {t.task_title.length > 48 ? t.task_title.slice(0,48)+'…' : t.task_title}
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <PriorityBadge priority={t.priority?.priority_name} />
                        <span style={{ fontSize:'.7rem', color: new Date(t.due_date) < new Date() ? '#ef4444' : '#9ca3af' }}>
                          {new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                        </span>
                      </div>
                      <div className="progress progress-thin mb-1">
                        <div className="progress-bar" style={{ width:`${prog}%`, background: color }} />
                      </div>
                      <div className="d-flex justify-content-between" style={{ fontSize:'.7rem', color:'#9ca3af' }}>
                        <span>{t.assignments?.length ?? 0} assigned</span>
                        <span>{prog}%</span>
                      </div>
                    </Link>
                  );
                })
            }
          </div>
        );
      })}
    </div>
  );
}
