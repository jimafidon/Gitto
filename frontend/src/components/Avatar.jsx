// frontend/src/components/Avatar.jsx
// Renders a profile picture if available, otherwise shows initials.

const GRADIENTS = [
  'linear-gradient(135deg,#7fff6e,#4fffdf)',
  'linear-gradient(135deg,#ff6e6e,#ff9d4d)',
  'linear-gradient(135deg,#a06eff,#ff6eb4)',
  'linear-gradient(135deg,#4fffdf,#6e8fff)',
  'linear-gradient(135deg,#ffdf4f,#ff9d4d)',
]

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

// Pick a consistent gradient based on name (same name = same colour)
function getGradient(name) {
  const index = (name?.charCodeAt(0) || 0) % GRADIENTS.length
  return GRADIENTS[index]
}

export default function Avatar({ name, src, size = 40, textSize }) {
  const fontSize = textSize || Math.floor(size * 0.35)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: getGradient(name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, color: '#000',
        fontFamily: 'var(--font-display)', flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  )
}