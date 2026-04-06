// frontend/src/components/ui/Badge.jsx
//
// Usage:
//   <Badge>In Progress</Badge>
//   <Badge variant="teal">Completed</Badge>
//   <Badge variant="gray">Paused</Badge>

export default function Badge({ children, variant = 'green' }) {
  // Map project status strings to badge variants automatically
  const variantMap = {
    in_progress: 'green',
    completed:   'teal',
    paused:      'gray',
    error:       'red',
  }

  const resolved = variantMap[variant] || variant

  return (
    <span className={`badge badge-${resolved}`}>
      {children}
    </span>
  )
}

// Helper — pass a raw status string and get the right badge
export function StatusBadge({ status }) {
  const labels = {
    in_progress: 'In Progress',
    completed:   'Completed',
    paused:      'Paused',
  }
  return <Badge variant={status}>{labels[status] || status}</Badge>
}