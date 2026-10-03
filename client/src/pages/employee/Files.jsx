import useFetch from '../../hooks/useFetch';
import Spinner from '../../components/ui/Spinner';

export default function EmployeeFiles() {
  const { data: files, loading } = useFetch('/files');
  return (
    <>
      <div className="page-heading mb-4">My Task Files</div>
      <div className="card border-0 shadow-sm">
        {loading ? <Spinner /> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light"><tr><th>File Name</th><th>Type</th><th>Task</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {files?.length === 0
                  ? <tr><td colSpan={5} className="text-center py-5 text-muted">No files yet.</td></tr>
                  : files?.map(f => (
                    <tr key={f.attachment_id}>
                      <td className="fw-semibold"><i className="bi bi-file-earmark text-muted me-1"></i>{f.file_name}</td>
                      <td><span className="badge bg-secondary-subtle text-secondary">{f.file_type?.toUpperCase() ?? '?'}</span></td>
                      <td>{f.task?.task_title ?? '—'}</td>
                      <td className="text-muted">{new Date(f.uploaded_at).toLocaleDateString()}</td>
                      <td><a href={`/api/files/${f.attachment_id}/download`} className="btn btn-sm btn-outline-primary py-0 px-2"><i className="bi bi-download"></i></a></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
