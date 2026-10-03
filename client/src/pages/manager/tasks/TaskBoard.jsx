import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../../../hooks/useFetch';
import KanbanBoard from '../../../components/tasks/KanbanBoard';
import Spinner from '../../../components/ui/Spinner';

export default function ManagerTaskBoard() {
  const [search, setSearch] = useState('');
  const { data: tasks, loading } = useFetch(`/tasks?search=${search}`);

  return (
    <>
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
        <div className="page-heading">Task Board</div>
        <div className="d-flex gap-2">
          <input type="text" className="form-control form-control-sm" style={{ width: 200 }}
            placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
          <Link to="/manager/tasks/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-circle me-1"></i>Assign Task
          </Link>
        </div>
      </div>
      {loading ? <Spinner /> : <KanbanBoard tasks={tasks ?? []} basePath="/manager/tasks" />}
    </>
  );
}
