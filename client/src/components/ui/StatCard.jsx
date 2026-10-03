export default function StatCard({ label, value, icon, color = '#4f46e5', bg = '#eef2ff' }) {
  return (
    <div className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 h-100">
      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
           style={{ width: 44, height: 44, background: bg }}>
        <i className={`bi ${icon} fs-5`} style={{ color }}></i>
      </div>
      <div>
        <div className="fw-bold fs-5 lh-1">{value ?? 0}</div>
        <div className="text-muted" style={{ fontSize: '.75rem' }}>{label}</div>
      </div>
    </div>
  );
}
