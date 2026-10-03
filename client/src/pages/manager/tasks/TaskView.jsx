import { useParams } from 'react-router-dom';
import useFetch from '../../../hooks/useFetch';
import TaskDetail from '../../../components/tasks/TaskDetail';
import Spinner from '../../../components/ui/Spinner';

const STAGES = [
  { stage_id:1, stage_name:'Pending' },
  { stage_id:2, stage_name:'In Progress' },
  { stage_id:3, stage_name:'For Review' },
  { stage_id:4, stage_name:'Completed' },
  { stage_id:5, stage_name:'Overdue' },
];

export default function ManagerTaskView() {
  const { id } = useParams();
  const { data: task, loading, refetch } = useFetch(`/tasks/${id}`);
  if (loading) return <Spinner />;

  return (
    <>
      <div className="page-heading mb-4">Task Detail</div>
      <TaskDetail task={task} stages={STAGES} canManage={true}
        editPath={`/manager/tasks/${id}/edit`} onRefresh={refetch} />
    </>
  );
}
