export function levelColor(level: number): string {
  if (level > 60) return 'var(--color-success)'
  if (level > 30) return 'var(--color-warning)'
  return 'var(--color-danger)'
}
