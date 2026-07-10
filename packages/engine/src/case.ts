export function applyCase(template: string, sourceFirstChar: string): string {
  const isUpper = sourceFirstChar !== sourceFirstChar.toLowerCase()
  if (!isUpper) return template
  return template.length > 1
    ? template[0].toUpperCase() + template.slice(1)
    : template.toUpperCase()
}
