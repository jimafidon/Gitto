// frontend/src/components/ui/Input.jsx
//
// Usage:
//   <Input placeholder="Email" type="email" value={v} onChange={...} />
//   <Input label="Username" error={errors.handle} />
//   <Input multiline rows={4} />   ← renders a textarea

export default function Input({
  label,
  error,
  multiline = false,
  rows      = 3,
  style     = {},
  className = '',
  ...props
}) {
  const inputClass = ['input', className].filter(Boolean).join(' ')

  return (
    <div className="form-group" style={style}>
      {label && <label className="form-label">{label}</label>}

      {multiline
        ? <textarea className={inputClass} rows={rows} {...props} style={{ resize: 'vertical' }} />
        : <input    className={inputClass} {...props} />
      }

      {error && (
        <div style={{ fontSize: 12, color: 'var(--accent3)', marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  )
}