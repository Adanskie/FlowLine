import { useParams } from 'react-router-dom';
import useFetch from '../../../hooks/useFetch';
import TaskDetail from '../../../components/tasks/TaskDetail';
import Spinner from '../../../components/ui/Spinner';

export default function AdminTaskView() {
  const { id } = useParams();
  const { data: task,   loading: tl, refetch } = useFetch(`/tasks/${id}`);
  const { data: stages, loading: sl }          = useFetch('/dashboard');

  if (tl || sl) return <Spinner />;

  const stageList = [
    { stage_id:1, stage_name:'Pending' },
    { stage_id:2, stage_name:'In Progress' },
    { stage_id:3, stage_name:'For Review' },
    { stage_id:4, stage_name:'Completed' },
    { stage_id:5, stage_name:'Overdue' },
  ];

  return (
    <>
      <div className="page-heading mb-4">Task Detail</div>
      <TaskDetail task={task} stages={stageList} canManage={true} editPath={`/admin/tasks/${id}/edit`} onRefresh={refetch} />
    </>
  );
}
