/**
 * Team Workload widget — shows active task count per employee
 * sorted heaviest-first with a colour-coded load bar.
 */
export default function TeamWorkload({ data = [] }) {
  const max = Math.max(...data.map(d => d.active_tasks), 1);

  const barColor = (n) => {
    if (n >= 7) return '#ef4444';
    if (n >= 4) return '#f59e0b';
    if (n >= 1) return '#10b981';
    return '#d1d5db';
  };

  const label = (n) => {
    if (n >= 7) return 'Heavy';
    if (n >= 4) return 'Moderate';
    if (n >= 1) return 'Available';
    return 'Free';
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="px-3 pt-3 pb-2 border-bottom d-flex justify-content-between align-items-center">
        <div>
          <span className="fw-semibold">Team Workload</span>
          <span className="text-muted small ms-2">active tasks per employee · heaviest first</span>
        </div>
      </div>
      <div className="p-3">
        {data.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            <i className="bi bi-people d-block fs-3 mb-1 opacity-50"></i>
            No active task assignments yet.
          </div>
        ) : data.map(m => {
          const pct   = Math.max(Math.round((m.active_tasks / max) * 100), 3);
          const color = barColor(m.active_tasks);
          return (
            <div key={m.employee_id} className="d-flex align-items-center gap-3 py-2 border-bottom">
              {/* Avatar */}
              <div className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                   style={{ width: 34, height: 34, background: color, fontSize: '.78rem' }}>
                {(m.first_name?.[0] ?? '?').toUpperCase()}
              </div>
              {/* Name */}
              <div style={{ minWidth: 140 }}>
                <div className="fw-semibold small">{m.name}</div>
                <div style={{ fontSize: '.7rem', color: '#9ca3af' }}>
                  {m.overdue_tasks > 0
                    ? <span className="text-danger">{m.overdue_tasks} overdue</span>
                    : 'No overdue'}
                </div>
              </div>
              {/* Bar */}
              <div className="flex-grow-1">
                <div className="progress" style={{ height: 8, borderRadius: 99 }}>
                  <div className="progress-bar"
                       style={{ width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .4s ease' }} />
                </div>
              </div>
              {/* Count + label */}
              <div className="text-end flex-shrink-0" style={{ minWidth: 110 }}>
                <span className="fw-bold small">{m.active_tasks}</span>
                <span className="text-muted small"> active task{m.active_tasks !== 1 ? 's' : ''}</span>
                <span className="badge ms-1 rounded-pill"
                      style={{ background: `${color}22`, color, fontSize: '.65rem', border: `1px solid ${color}44` }}>
                  {label(m.active_tasks)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
