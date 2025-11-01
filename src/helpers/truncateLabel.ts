export default function truncateLabel(label: string, maxLength = 45): string {
  if (!label) return ''
  return label.length > maxLength ? `${label.slice(0, maxLength).trimEnd()}…` : label
}
