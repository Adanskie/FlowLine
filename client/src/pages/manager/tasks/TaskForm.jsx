import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import TaskFormFields from '../../../components/tasks/TaskFormFields';
import Alert from '../../../components/ui/Alert';

const DEFAULT_PRIORITIES = [
  { priority_id: 1, priority_name: 'Low' },
  { priority_id: 2, priority_name: 'Medium' },
  { priority_id: 3, priority_name: 'High' },
];

export default function ManagerTaskForm() {
  const nav = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [teams,     setTeams]     = useState([]);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [form, setForm] = useState({
    task_title: '', task_description: '', priority_id: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '', employee_ids: [],
  });

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data));
    api.get('/teams').then(r => setTeams(r.data));
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!form.employee_ids.length) { setError('Select at least one employee.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/tasks', form);
      nav('/manager/tasks');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create task.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-heading mb-4">Assign Task</div>
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm p-4">
            <Alert type="danger" message={error} onClose={() => setError('')} />
            <form onSubmit={submit}>
              <TaskFormFields form={form} setForm={setForm} employees={employees} priorities={DEFAULT_PRIORITIES} teams={teams} />
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
