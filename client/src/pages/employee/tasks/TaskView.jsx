import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api/axios';
import useFetch from '../../../hooks/useFetch';
import TaskDetail from '../../../components/tasks/TaskDetail';
import Spinner from '../../../components/ui/Spinner';
import Alert from '../../../components/ui/Alert';

export default function EmployeeTaskView() {
  const { id } = useParams();
  const { data: task, loading, refetch } = useFetch(`/tasks/${id}`);
  const [progressForm, setProgressForm] = useState({ update_message: '', progress_percent: 0 });
  const [msg,          setMsg]          = useState({ type: '', text: '' });
  const [submitting,   setSubmitting]   = useState(false);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 3500); };

  if (loading) return <Spinner />;

  const notDone    = task.stage?.stage_name !== 'Completed' && task.stage?.stage_name !== 'For Review';
  const currentPct = task.updates?.[0]?.progress_percent ?? 0;

  const postProgress = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/tasks/${id}/progress`, progressForm);
      flash('success', 'Progress saved.');
      setProgressForm({ update_message: '', progress_percent: currentPct });
      refetch();
    } catch { flash('danger', 'Failed to save.'); }
    finally { setSubmitting(false); }
  };

  const submitReview = async () => {
    if (!confirm('Submit this task for manager review?')) return;
    await api.post(`/tasks/${id}/submit-review`);
    flash('success', 'Submitted for review.');
    refetch();
  };

  return (
    <>
      <div className="page-heading mb-4">Task Detail</div>
      <Alert type={msg.type || 'success'} message={msg.text} onClose={() => setMsg({ type: '', text: '' })} />

      {/* Employee-specific: progress update + submit for review */}
      {notDone && (
        <div className="row g-3 mb-4">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm p-4">
              <p className="fw-semibold small mb-3">Post a Progress Update</p>
              <form onSubmit={postProgress}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Progress: <strong>{progressForm.progress_percent}%</strong>
                  </label>
                  <input type="range" className="form-range" min={0} max={100} step={5}
                    value={progressForm.progress_percent}
                    onChange={e => setProgressForm(p => ({ ...p, progress_percent: +e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Update Message <span className="text-danger">*</span></label>
                  <textarea className="form-control" rows={3} required
                    placeholder="Describe what you've done…"
                    value={progressForm.update_message}
                    onChange={e => setProgressForm(p => ({ ...p, update_message: e.target.value }))} />
                </div>
                <button className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting && <span className="spinner-border spinner-border-sm me-2" />}
                  Save Update
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4">
              <p className="fw-semibold small mb-2">Ready to submit?</p>
              <p className="text-muted small mb-3">Submit this task for your manager to review and approve.</p>
              <button className="btn btn-warning w-100" onClick={submitReview}>
                <i className="bi bi-send me-1"></i>Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      <TaskDetail task={task} stages={[]} canManage={false} onRefresh={refetch} />
    </>
  );
}
