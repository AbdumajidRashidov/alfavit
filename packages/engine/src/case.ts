export function applyCase(template: string, sourceFirstChar: string): string {
  const isUpper = sourceFirstChar !== sourceFirstChar.toLowerCase()
  return isUpper ? template.toUpperCase() : template
}
