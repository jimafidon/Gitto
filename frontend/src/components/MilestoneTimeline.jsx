// frontend/src/components/MilestoneTimeline.jsx

export default function MilestoneTimeline({ milestones = [], detailed = false }) {
  if (milestones.length === 0) return (
    <div style={{ color: 'var(--text3)', fontSize: 13 }}>No milestones added yet.</div>
  )

  return (
    <div className="milestone-timeline">
      {milestones.map((m, i) => {
        const cls = m.status === 'completed' ? 'done' : m.status === 'in_progress' ? 'active' : ''
        const icon = m.status === 'completed' ? '✓' : m.status === 'in_progress' ? '●' : '○'

        return (
          <div key={m._id || i} className="milestone-item">
            <div className={`milestone-dot ${cls}`}>{icon}</div>
            <div className="milestone-content">
              <h3>{m.title}</h3>
              {detailed && m.description && <p>{m.description}</p>}
              <div className="date">
                {m.status === 'completed' && m.completedAt
                  ? new Date(m.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : m.status === 'in_progress'
                  ? 'In progress'
                  : m.dueDate
                  ? `Est. ${new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                  : 'Upcoming'
                }
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}