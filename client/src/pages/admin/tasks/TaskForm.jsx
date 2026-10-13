import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import TaskFormFields from '../../../components/tasks/TaskFormFields';
import Alert from '../../../components/ui/Alert';

export default function AdminTaskForm() {
  const nav = useNavigate();
  const [employees,  setEmployees]  = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [teams,      setTeams]      = useState([]);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [form, setForm] = useState({ task_title:'', task_description:'', priority_id:'', start_date:'', due_date:'', employee_ids:[] });

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data));
    api.get('/teams').then(r => setTeams(r.data));
    api.get('/tasks').then(() => {}).catch(() => {});
    // Priorities come from tasks endpoint shape — fetch directly
    fetch('/api/tasks').then(() => {}).catch(() => {});
    // Fetch priorities via a quick tasks request to get the enum
    api.get('/dashboard').then(() => {});
    // Simple workaround: seed priorities from first task or hardcode
    setPriorities([{priority_id:1,priority_name:'Low'},{priority_id:2,priority_name:'Medium'},{priority_id:3,priority_name:'High'}]);
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!form.employee_ids.length) { setError('Select at least one employee.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/tasks', { ...form, employee_ids: form.employee_ids });
      nav('/admin/tasks');
    } catch (err) { setError(err.response?.data?.error ?? 'Failed to create task.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-heading mb-4">Assign Task</div>
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm p-4">
            <Alert type="danger" message={error} onClose={() => setError('')} />
            <form onSubmit={submit}>
              <TaskFormFields form={form} setForm={setForm} employees={employees} priorities={priorities} teams={teams} />
              <div className="d-flex justify-content-end gap-2 pt-2">
                <button type="button" className="btn btn-light" onClick={() => nav(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading && <span className="spinner-border spinner-border-sm me-2" />}
                  <i className="bi bi-send-fill me-1"></i>Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
