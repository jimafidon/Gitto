// frontend/src/components/ui/Card.jsx
//
// Usage:
//   <Card>content</Card>
//   <Card size="sm" hover>clickable card</Card>

export default function Card({
  children,
  size     = 'md',    // 'sm' | 'md' | 'lg'
  hover    = false,   // adds lift on hover
  onClick,
  style = {},
  className = '',
}) {
  const classes = [
    'card',
    size !== 'md' ? `card-${size}` : '',
    hover ? 'project-card-mini' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
    >
      {children}
    </div>
  )
}