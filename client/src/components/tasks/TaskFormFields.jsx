/**
 * Reusable task form fields used by both Admin and Manager create/edit pages.
 * Caller renders the <form> and submit button.
 */
export default function TaskFormFields({ form, setForm, employees = [], priorities = [], teams = [] }) {
  const toggle = id => {
    const ids = form.employee_ids.includes(id)
      ? form.employee_ids.filter(e => e !== id)
      : [...form.employee_ids, id];
    setForm(p => ({ ...p, employee_ids: ids }));
  };

  const applyTeam = e => {
    const teamId = +e.target.value;
    if (!teamId) return;
    const team = teams.find(t => t.team_id === teamId);
    if (!team) return;
    const memberIds = team.members
      .map(m => m.employee_id)
      .filter(id => employees.some(emp => emp.employee_id === id));
    const merged = Array.from(new Set([...form.employee_ids, ...memberIds]));
    setForm(p => ({ ...p, employee_ids: merged }));
    // Reset the selector back to blank
    e.target.value = '';
  };

  return (
    <>
      {/* Step 1 — Details */}
      <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize:'.7rem', letterSpacing:'.1em' }}>Step 1 — Task Details</h6>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Task Title <span className="text-danger">*</span></label>
        <input type="text" className="form-control" required
          value={form.task_title} onChange={e => setForm(p => ({ ...p, task_title: e.target.value }))} />
      </div>
      <div className="mb-4">
        <label className="form-label small fw-semibold">Description</label>
        <textarea className="form-control" rows={4}
          value={form.task_description} onChange={e => setForm(p => ({ ...p, task_description: e.target.value }))} />
      </div>

      <hr className="my-4" />

      {/* Step 2 — Employees */}
      <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize:'.7rem', letterSpacing:'.1em' }}>Step 2 — Assign Employees</h6>
      {teams.length > 0 && (
        <div className="mb-3">
          <label className="form-label small fw-semibold">Add a team</label>
          <select className="form-select form-select-sm" defaultValue="" onChange={applyTeam} style={{ maxWidth: 280 }}>
            <option value="">Select a team to tick its members…</option>
            {teams.map(t => (
              <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="mb-4 row g-2" style={{ maxHeight: 260, overflowY:'auto' }}>
        {employees.map(emp => (
          <div key={emp.employee_id} className="col-md-6">
            <label className="d-flex align-items-center gap-2 p-2 border rounded" style={{ cursor:'pointer', background: form.employee_ids.includes(emp.employee_id) ? '#eef2ff' : '#fff' }}>
              <input type="checkbox" className="form-check-input mt-0"
                checked={form.employee_ids.includes(emp.employee_id)}
                onChange={() => toggle(emp.employee_id)} />
              <div>
                <div className="fw-semibold small">{emp.first_name} {emp.last_name}</div>
                <div className="text-muted" style={{ fontSize:'.7rem' }}>{emp.department?.department_name}</div>
              </div>
            </label>
          </div>
        ))}
      </div>

      <hr className="my-4" />

      {/* Step 3 — Priority / Dates */}
      <h6 className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize:'.7rem', letterSpacing:'.1em' }}>Step 3 — Priority & Deadline</h6>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <label className="form-label small fw-semibold">Priority <span className="text-danger">*</span></label>
          <select className="form-select" required
            value={form.priority_id} onChange={e => setForm(p => ({ ...p, priority_id: e.target.value }))}>
            <option value="">Select…</option>
            {priorities.map(p => <option key={p.priority_id} value={p.priority_id}>{p.priority_name}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold">Start Date</label>
          <input type="date" className="form-control"
            value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold">Due Date <span className="text-danger">*</span></label>
          <input type="date" className="form-control" required
            value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
        </div>
      </div>
    </>
  );
}
