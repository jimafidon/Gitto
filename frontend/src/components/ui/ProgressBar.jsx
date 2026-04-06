// frontend/src/components/ui/ProgressBar.jsx
//
// Usage:
//   <ProgressBar value={65} />
//   <ProgressBar value={100} size="lg" showLabel />

export default function ProgressBar({ value = 0, size = 'md', showLabel = false }) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div>
      <div className={`progress-wrap ${size === 'lg' ? 'progress-lg' : ''}`}>
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      {showLabel && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{clamped}% complete</div>
      )}
    </div>
  )
}