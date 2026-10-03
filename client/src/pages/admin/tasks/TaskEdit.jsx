import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import TaskFormFields from '../../../components/tasks/TaskFormFields';
import Spinner from '../../../components/ui/Spinner';
import Alert from '../../../components/ui/Alert';

export default function AdminTaskEdit() {
  const { id } = useParams();
  const nav    = useNavigate();
  const [employees,  setEmployees]  = useState([]);
  const [priorities, setPriorities] = useState([{priority_id:1,priority_name:'Low'},{priority_id:2,priority_name:'Medium'},{priority_id:3,priority_name:'High'}]);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data));
    api.get(`/tasks/${id}`).then(r => {
      const t = r.data;
      setForm({
        task_title: t.task_title, task_description: t.task_description ?? '',
        priority_id: String(t.priority_id), start_date: t.start_date?.split('T')[0] ?? '',
        due_date: t.due_date?.split('T')[0] ?? '',
        employee_ids: t.assignments.map(a => a.employee_id),
      });
    });
  }, [id]);

  if (!form) return <Spinner />;

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.put(`/tasks/${id}`, form);
      nav(`/admin/tasks/${id}`);
    } catch (err) { setError(err.response?.data?.error ?? 'Failed to update.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-heading mb-4">Edit Task</div>
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm p-4">
            <Alert type="danger" message={error} onClose={() => setError('')} />
            <form onSubmit={submit}>
              <TaskFormFields form={form} setForm={setForm} employees={employees} priorities={priorities} />
              <div className="d-flex justify-content-end gap-2 pt-2">
                <button type="button" className="btn btn-light" onClick={() => nav(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
