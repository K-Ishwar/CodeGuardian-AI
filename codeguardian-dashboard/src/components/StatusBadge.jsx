// ---------------------------------------------------------------------------
// StatusBadge — colored status pill
// Renders a pill badge with colors mapped to status:
//   processing → amber  |  analyzed → green  |  failed → red
// ---------------------------------------------------------------------------

export default function StatusBadge({ status = 'processing' }) {
  const normalizedStatus = status.toLowerCase();
  
  let config = {
    bg: 'color-mix(in srgb, var(--color-accent-amber) 10%, transparent)',
    border: 'color-mix(in srgb, var(--color-accent-amber) 30%, transparent)',
    text: 'var(--color-accent-amber)',
    label: '● Processing',
  };

  if (normalizedStatus === 'analyzed' || normalizedStatus === 'completed') {
    config = {
      bg: 'color-mix(in srgb, var(--color-accent-green) 10%, transparent)',
      border: 'color-mix(in srgb, var(--color-accent-green) 30%, transparent)',
      text: 'var(--color-accent-green)',
      label: '✓ Analyzed',
    };
  } else if (normalizedStatus === 'failed') {
    config = {
      bg: 'color-mix(in srgb, var(--color-accent-red) 10%, transparent)',
      border: 'color-mix(in srgb, var(--color-accent-red) 30%, transparent)',
      text: 'var(--color-accent-red)',
      label: '✕ Failed',
    };
  }

  return (
    <span
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.text,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '9999px',
        padding: '2px 8px',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
