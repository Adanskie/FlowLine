import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import StageBadge from '../ui/StageBadge';
import PriorityBadge from '../ui/PriorityBadge';
import Alert from '../ui/Alert';
import downloadFile from '../../utils/downloadFile';

export default function TaskDetail({ task, stages = [], canManage = false, editPath, onRefresh }) {
  const nav = useNavigate();
  const [stageForm,    setStageForm]    = useState({ stage_id: task.stage_id, remarks: '' });
  const [approvalForm, setApprovalForm] = useState({ approval_status: 'Approved', remarks: '' });
  const [comment,      setComment]      = useState('');
  const [file,         setFile]         = useState(null);
  const [msg,          setMsg]          = useState({ type:'', text:'' });
  const [uploading,    setUploading]    = useState(false);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type:'', text:'' }), 3500); };

  const progress = task.updates?.[0]?.progress_percent ?? 0;
  const latestApproval = task.approvals?.[0];
  const isOverdue = new Date(task.due_date) < new Date() && task.stage?.stage_name !== 'Completed';

  const changeStage = async e => {
    e.preventDefault();
    await api.post(`/tasks/${task.task_id}/change-stage`, stageForm);
    flash('success','Stage updated.'); onRefresh();
  };

  const approve = async e => {
    e.preventDefault();
    await api.post(`/tasks/${task.task_id}/approve`, approvalForm);
    flash('success',`Task ${approvalForm.approval_status}.`); onRefresh();
  };

  const postComment = async e => {
    e.preventDefault();
    await api.post(`/tasks/${task.task_id}/comment`, { comment_text: comment });
    setComment(''); onRefresh();
  };

  const deleteComment = async id => {
    await api.delete(`/tasks/${task.task_id}/comments/${id}`);
    onRefresh();
  };

  const uploadFile = async e => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    await api.post(`/tasks/${task.task_id}/attachments`, fd);
    setFile(null); flash('success','File uploaded.'); onRefresh();
    setUploading(false);
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${task.task_id}`);
    nav(-1);
  };

  return (
    <div className="row g-4">
      {/* ── LEFT ── */}
      <div className="col-lg-8">
        <Alert type={msg.type || 'success'} message={msg.text} onClose={() => setMsg({ type:'', text:'' })} />

        {/* Header */}
        <div className="card border-0 shadow-sm p-4 mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h5 className="fw-bold mb-2">{task.task_title}</h5>
              <div className="d-flex flex-wrap gap-2">
                <StageBadge stage={task.stage?.stage_name} />
                <PriorityBadge priority={task.priority?.priority_name} />
                {isOverdue && <span className="badge bg-danger-subtle text-danger">Overdue</span>}
              </div>
            </div>
            {canManage && (
              <div className="d-flex gap-2">
                <Link to={editPath} className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil"></i></Link>
                <button onClick={deleteTask} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button>
              </div>
            )}
          </div>
          <p className="text-muted small mb-4">{task.task_description || 'No description.'}</p>
          <div className="row g-3 small">
            <div className="col-6 col-md-3"><div className="text-muted">Start</div><div className="fw-semibold">{task.start_date ? new Date(task.start_date).toLocaleDateString() : '—'}</div></div>
            <div className="col-6 col-md-3"><div className="text-muted">Due</div><div className={`fw-semibold ${isOverdue ? 'text-danger' : ''}`}>{new Date(task.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div></div>
            <div className="col-6 col-md-3"><div className="text-muted">Created By</div><div className="fw-semibold">{task.creator?.employee ? `${task.creator.employee.first_name} ${task.creator.employee.last_name}` : task.creator?.username}</div></div>
            <div className="col-6 col-md-3"><div className="text-muted">Progress</div><div className="fw-semibold">{progress}%</div></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card border-0 shadow-sm p-3 mb-4">
          <div className="d-flex justify-content-between small mb-1"><span className="fw-semibold">Overall Progress</span><span>{progress}%</span></div>
          <div className="progress" style={{ height: 8 }}><div className="progress-bar bg-primary" style={{ width:`${progress}%` }} /></div>
        </div>

        {/* Stage change (managers) */}
        {canManage && (
          <div className="card border-0 shadow-sm p-3 mb-4">
            <p className="fw-semibold small mb-2">Change Stage</p>
            <form onSubmit={changeStage} className="d-flex flex-wrap gap-2">
              <select className="form-select form-select-sm" style={{ width: 180 }}
                value={stageForm.stage_id} onChange={e => setStageForm(p => ({ ...p, stage_id: +e.target.value }))}>
                {stages.map(s => <option key={s.stage_id} value={s.stage_id}>{s.stage_name}</option>)}
              </select>
              <input type="text" className="form-control form-control-sm" style={{ flex: 1, minWidth: 140 }} placeholder="Reason (optional)"
                value={stageForm.remarks} onChange={e => setStageForm(p => ({ ...p, remarks: e.target.value }))} />
              <button className="btn btn-sm btn-outline-primary">Update Stage</button>
            </form>
          </div>
        )}

        {/* Approval panel */}
        {canManage && task.stage?.stage_name === 'For Review' && (
          <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderLeft: '3px solid #f59e0b' }}>
            <p className="fw-semibold mb-3"><i className="bi bi-eye-fill text-warning me-2"></i>Approval Required</p>
            <form onSubmit={approve}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Decision</label>
                <select className="form-select" value={approvalForm.approval_status}
                  onChange={e => setApprovalForm(p => ({ ...p, approval_status: e.target.value }))}>
                  <option value="Approved">✅ Approve — Mark as Completed</option>
                  <option value="Revision Requested">🔁 Request Revision — Return to In Progress</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Remarks</label>
                <textarea className="form-control" rows={2} placeholder="Optional feedback…"
                  value={approvalForm.remarks} onChange={e => setApprovalForm(p => ({ ...p, remarks: e.target.value }))} />
              </div>
              <button className="btn btn-warning">Submit Decision</button>
            </form>
          </div>
        )}

        {latestApproval && (
          <div className="card border-0 shadow-sm p-3 mb-4 small">
            <span className="fw-semibold">Last Review: </span>
            <span className={`badge ms-1 ${latestApproval.approval_status === 'Approved' ? 'bg-success' : 'bg-warning text-dark'}`}>{latestApproval.approval_status}</span>
            {latestApproval.remarks && <span className="text-muted ms-2">— {latestApproval.remarks}</span>}
          </div>
        )}

        {/* Progress updates */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="px-3 pt-3 pb-2 border-bottom fw-semibold small">Progress Updates ({task.updates?.length ?? 0})</div>
          {task.updates?.length === 0
            ? <div className="p-3 text-center text-muted small">No updates yet.</div>
            : task.updates.map(u => (
              <div key={u.update_id} className="px-3 py-2 border-bottom small">
                <div className="d-flex justify-content-between">
                  <span className="fw-semibold">{u.employee?.first_name} {u.employee?.last_name}</span>
                  <span className="text-muted">{new Date(u.update_date).toLocaleString()}</span>
                </div>
                <p className="mb-1 mt-1">{u.update_message}</p>
                <div className="progress progress-thin"><div className="progress-bar bg-primary" style={{ width:`${u.progress_percent}%` }} /></div>
                <span className="text-muted">{u.progress_percent}% complete</span>
              </div>
            ))
          }
        </div>

        {/* Comments */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="px-3 pt-3 pb-2 border-bottom fw-semibold small">Comments</div>
          {task.comments?.length === 0
            ? <div className="p-3 text-center text-muted small">No comments yet.</div>
            : task.comments.map(c => (
              <div key={c.comment_id} className="px-3 py-2 border-bottom small">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">{c.user?.employee ? `${c.user.employee.first_name} ${c.user.employee.last_name}` : c.user?.username}</span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted" style={{ fontSize:'.7rem' }}>{new Date(c.created_at).toLocaleString()}</span>
                    {canManage && <button onClick={() => deleteComment(c.comment_id)} className="btn btn-sm p-0 text-danger border-0 bg-transparent"><i className="bi bi-x"></i></button>}
                  </div>
                </div>
                <p className="mb-0 mt-1">{c.comment_text}</p>
              </div>
            ))
          }
          <div className="p-3">
            <form onSubmit={postComment} className="d-flex gap-2">
              <input type="text" className="form-control form-control-sm" placeholder="Add a comment…" required
                value={comment} onChange={e => setComment(e.target.value)} />
              <button className="btn btn-sm btn-primary">Post</button>
            </form>
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="col-lg-4">
        {/* Assigned */}
        <div className="card border-0 shadow-sm p-3 mb-4">
          <p className="fw-semibold small mb-2">Assigned To</p>
          {task.assignments?.map(a => (
            <div key={a.assignment_id} className="d-flex align-items-center gap-2 py-1">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                   style={{ width:30, height:30, fontSize:'.75rem' }}>
                {(a.employee?.first_name?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="small">
                <div className="fw-semibold">{a.employee?.first_name} {a.employee?.last_name}</div>
                <div className="text-muted" style={{ fontSize:'.7rem' }}>{a.employee?.position?.position_name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stage history */}
        <div className="card border-0 shadow-sm p-3 mb-4">
          <p className="fw-semibold small mb-2">Stage History</p>
          {task.stageHistory?.map(h => (
            <div key={h.history_id} className="d-flex gap-2 mb-2 small">
              <i className="bi bi-circle-fill text-muted mt-1" style={{ fontSize:'.4rem' }}></i>
              <div>
                <div>
                  {h.oldStage && <><span className="text-muted">{h.oldStage.stage_name}</span><i className="bi bi-arrow-right mx-1 text-muted"></i></>}
                  <span className="fw-semibold">{h.newStage?.stage_name}</span>
                </div>
                <div className="text-muted" style={{ fontSize:'.7rem' }}>
                  {h.changedBy?.employee ? `${h.changedBy.employee.first_name} ${h.changedBy.employee.last_name}` : h.changedBy?.username} · {new Date(h.changed_at).toLocaleString()}
                </div>
                {h.remarks && <div className="text-muted fst-italic">{h.remarks}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Attachments */}
        <div className="card border-0 shadow-sm p-3 mb-4">
          <p className="fw-semibold small mb-2">Attachments ({task.attachments?.length ?? 0})</p>
          {task.attachments?.map(a => (
            <div key={a.attachment_id} className="d-flex align-items-center justify-content-between py-1 border-bottom small">
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-file-earmark text-muted"></i>
                <span>{a.file_name.length > 28 ? a.file_name.slice(0,28)+'…' : a.file_name}</span>
              </div>
              <button
                onClick={() => downloadFile(api, a.attachment_id, a.file_name, msg => flash('danger', msg))}
                className="btn btn-sm btn-outline-secondary py-0 px-2">
                <i className="bi bi-download"></i>
              </button>
            </div>
          ))}
          <form onSubmit={uploadFile} className="d-flex gap-2 mt-2">
            <input type="file" className="form-control form-control-sm" onChange={e => setFile(e.target.files[0])} required />
            <button className="btn btn-sm btn-outline-primary flex-shrink-0" disabled={uploading}>
              {uploading ? <span className="spinner-border spinner-border-sm" /> : 'Upload'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
