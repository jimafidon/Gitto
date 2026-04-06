// frontend/src/components/ui/EmptyState.jsx
//
// Usage:
//   <EmptyState icon="📭" title="No posts yet" description="Follow users to see posts." />
//   <EmptyState icon="🔍" title="No results" description="Try a different search." action={<Button>Clear</Button>} />

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}