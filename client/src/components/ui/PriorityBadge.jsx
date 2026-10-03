const map = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' };

export default function PriorityBadge({ priority }) {
  return (
    <span className="fw-semibold small" style={{ color: map[priority] ?? '#374151' }}>
      {priority}
    </span>
  );
}
