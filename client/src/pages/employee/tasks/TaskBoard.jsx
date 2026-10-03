import useFetch from '../../../hooks/useFetch';
import KanbanBoard from '../../../components/tasks/KanbanBoard';
import Spinner from '../../../components/ui/Spinner';

export default function EmployeeTaskBoard() {
  const { data: tasks, loading } = useFetch('/tasks');

  return (
    <>
      <div className="page-heading mb-4">My Tasks</div>
      {loading ? <Spinner /> : <KanbanBoard tasks={tasks ?? []} basePath="/employee/tasks" />}
    </>
  );
}
