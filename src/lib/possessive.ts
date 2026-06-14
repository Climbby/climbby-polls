export function possessivePrefix(displayName: string): string {
  return displayName.endsWith('s') ? `${displayName}' ` : `${displayName}'s `
}
