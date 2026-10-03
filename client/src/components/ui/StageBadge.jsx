const map = {
  'Pending':     { bg: '#f3f4f6', color: '#374151' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
  'For Review':  { bg: '#fef3c7', color: '#92400e' },
  'Completed':   { bg: '#d1fae5', color: '#065f46' },
  'Overdue':     { bg: '#fee2e2', color: '#991b1b' },
};

export default function StageBadge({ stage }) {
  const s = map[stage] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span className="badge rounded-pill px-2 py-1"
          style={{ background: s.bg, color: s.color, fontSize: '.72rem', fontWeight: 600 }}>
      {stage}
    </span>
  );
}
