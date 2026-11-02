import { describe, expect, it } from 'vitest'
import { avatarUrl, displayName, firstName } from '../src/shared/profile.js'

const google = { email: 'jane@example.com', user_metadata: { full_name: 'Jane  Q. Doe', avatar_url: 'https://lh3.googleusercontent.com/a/abc=s96-c' } }
const emailOnly = { email: 'sam@example.com', user_metadata: {} }

describe('profile helpers', () => {
  it('uses the Google name and photo from user_metadata', () => {
    expect(displayName(google)).toBe('Jane  Q. Doe')
    expect(firstName(google)).toBe('Jane')
    expect(avatarUrl(google)).toBe('https://lh3.googleusercontent.com/a/abc=s96-c')
  })
  it('accepts the alternative name/picture keys', () => {
    const u = { email: 'a@b.co', user_metadata: { name: 'Lee', picture: 'https://example.com/p.png' } }
    expect(displayName(u)).toBe('Lee')
    expect(avatarUrl(u)).toBe('https://example.com/p.png')
  })
  it('falls back to the email when there is no name, and no first name', () => {
    expect(displayName(emailOnly)).toBe('sam@example.com')
    expect(firstName(emailOnly)).toBe('')
    expect(avatarUrl(emailOnly)).toBe('')
  })
  it('ignores photo values that are not ordinary https links', () => {
    for (const bad of ['javascript:alert(1)', 'http://example.com/p.png', 'data:image/png;base64,AAAA', 'https://x.co/a"onerror="x', '  ']) {
      expect(avatarUrl({ user_metadata: { avatar_url: bad } })).toBe('')
    }
  })
  it('handles a missing user', () => {
    expect(displayName(null)).toBe('')
    expect(firstName(undefined)).toBe('')
    expect(avatarUrl(null)).toBe('')
  })
})
