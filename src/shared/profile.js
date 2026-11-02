// Name and photo from user_metadata (Google sets full_name/name and avatar_url/picture).
export function displayName(user) {
  const meta = user?.user_metadata ?? {}
  return meta.full_name || meta.name || user?.email || ''
}

// First name for short labels (nav link, greeting); empty when we only know the email.
export function firstName(user) {
  const meta = user?.user_metadata ?? {}
  const full = String(meta.full_name || meta.name || '').trim()
  return full ? full.split(/\s+/)[0] : ''
}

// user_metadata is editable by its owner, so only accept an ordinary https image link.
export function avatarUrl(user) {
  const meta = user?.user_metadata ?? {}
  const url = meta.avatar_url || meta.picture || ''
  return /^https:\/\/[^\s"'<>]+$/.test(url) ? url : ''
}
