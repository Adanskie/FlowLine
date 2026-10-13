import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import downloadFile from '../../utils/downloadFile';

export default function AdminFiles() {
  const { data: files, loading, refetch } = useFetch('/files');
  const [dlError, setDlError] = useState('');

  const del = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await api.delete(`/files/${id}`);
    refetch();
  };

  return (
    <>
      <div className="page-heading mb-4">File Repository</div>
      <Alert type="danger" message={dlError} onClose={() => setDlError('')} />
      <div className="card border-0 shadow-sm">
        {loading ? <Spinner /> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light"><tr><th>File Name</th><th>Type</th><th>Task</th><th>Uploaded By</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {files?.length === 0
                  ? <tr><td colSpan={6} className="text-center py-5 text-muted"><i className="bi bi-folder2-open d-block fs-2 mb-2 opacity-50"></i>No files yet.</td></tr>
                  : files?.map(f => (
                    <tr key={f.attachment_id}>
                      <td><i className="bi bi-file-earmark text-muted me-1"></i><span className="fw-semibold">{f.file_name}</span></td>
                      <td><span className="badge bg-secondary-subtle text-secondary">{f.file_type?.toUpperCase() ?? '?'}</span></td>
                      <td>{f.task?.task_title ?? '—'}</td>
                      <td className="text-muted">{f.uploadedBy?.employee ? `${f.uploadedBy.employee.first_name} ${f.uploadedBy.employee.last_name}` : f.uploadedBy?.username ?? '—'}</td>
                      <td className="text-muted">{new Date(f.uploaded_at).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button onClick={() => downloadFile(api, f.attachment_id, f.file_name, setDlError)} className="btn btn-sm btn-outline-primary py-0 px-2 me-1"><i className="bi bi-download"></i></button>
                        <button onClick={() => del(f.attachment_id, f.file_name)} className="btn btn-sm btn-outline-danger py-0 px-2"><i className="bi bi-trash"></i></button>
                      </td>
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
