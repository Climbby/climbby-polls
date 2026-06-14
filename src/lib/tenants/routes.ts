export const RESERVED_TENANT_SLUGS = new Set([
  'admin',
  'manage',
  'polls',
  'archive',
  'api',
  'app',
  'login',
  'signup',
  'www',
])

export function tenantRoutes(slug: string) {
  const base = `/${slug}`
  return {
    home: base,
    manage: `${base}/manage`,
    poll: (pollSlug: string) => `${base}/polls/${pollSlug}`,
    pollHash: (pollSlug: string) => `${base}#${pollSlug}`,
  }
}

export function isValidTenantSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase()
  if (normalized.length < 2 || normalized.length > 64) return false
  if (RESERVED_TENANT_SLUGS.has(normalized)) return false
  return /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/.test(normalized)
}
