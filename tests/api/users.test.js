import { describe, it, expect } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { app } from '../../backend/src/server.js'
import User from '../../backend/src/models/User.js'

// ── helper: register a user via the API and return { token, user } ────────────
async function createUser(overrides = {}) {
  const res = await request(app).post('/api/auth/register').send({
    name:     'Test User',
    handle:   'testuser',
    email:    'test@example.com',
    password: 'password123',
    ...overrides,
  })
  return res.body
}

// ═══════════════════════════════════════════════════════════════════════════════
//  USER MODEL
// ═══════════════════════════════════════════════════════════════════════════════

describe('User model — creation', () => {
  it('creates a valid user', async () => {
    const user = await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com' })
    expect(user._id).toBeDefined()
    expect(user.name).toBe('Alice')
    expect(user.handle).toBe('alice')
    expect(user.email).toBe('alice@example.com')
  })

  it('defaults role to user', async () => {
    const user = await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com' })
    expect(user.role).toBe('user')
  })

  it('defaults isVerified to false', async () => {
    const user = await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com' })
    expect(user.isVerified).toBe(false)
  })

  it('followersCount and followingCount virtuals default to 0', async () => {
    const user = await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com' })
    expect(user.followersCount).toBe(0)
    expect(user.followingCount).toBe(0)
  })
})

describe('User model — validation', () => {
  it('rejects missing name', async () => {
    await expect(
      User.create({ handle: 'alice', email: 'alice@example.com' })
    ).rejects.toThrow(/name is required/i)
  })

  it('rejects missing handle', async () => {
    await expect(
      User.create({ name: 'Alice', email: 'alice@example.com' })
    ).rejects.toThrow(/handle is required/i)
  })

  it('rejects missing email', async () => {
    await expect(
      User.create({ name: 'Alice', handle: 'alice' })
    ).rejects.toThrow(/email is required/i)
  })

  it('rejects handle shorter than 3 characters', async () => {
    await expect(
      User.create({ name: 'Alice', handle: 'al', email: 'alice@example.com' })
    ).rejects.toThrow()
  })

  it('rejects handle with special characters', async () => {
    await expect(
      User.create({ name: 'Alice', handle: 'ali ce!', email: 'alice@example.com' })
    ).rejects.toThrow()
  })

  it('rejects invalid email format', async () => {
    await expect(
      User.create({ name: 'Alice', handle: 'alice', email: 'not-an-email' })
    ).rejects.toThrow()
  })

  it('rejects duplicate handle', async () => {
    await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com' })
    await expect(
      User.create({ name: 'Bob', handle: 'alice', email: 'bob@example.com' })
    ).rejects.toThrow()
  })

  it('rejects duplicate email', async () => {
    await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com' })
    await expect(
      User.create({ name: 'Bob', handle: 'bob', email: 'alice@example.com' })
    ).rejects.toThrow()
  })
})

describe('User model — password', () => {
  it('hashes the password on save', async () => {
    await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com', password: 'secret123' })
    const user = await User.findOne({ handle: 'alice' }).select('+password')
    expect(user.password).not.toBe('secret123')
    expect(user.password).toMatch(/^\$2/)  // bcrypt hash prefix
  })

  it('does not expose password by default', async () => {
    await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com', password: 'secret123' })
    const user = await User.findOne({ handle: 'alice' })
    expect(user.password).toBeUndefined()
  })

  it('comparePassword returns true for correct password', async () => {
    await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com', password: 'secret123' })
    const user = await User.findOne({ handle: 'alice' }).select('+password')
    await expect(user.comparePassword('secret123')).resolves.toBe(true)
  })

  it('comparePassword returns false for wrong password', async () => {
    await User.create({ name: 'Alice', handle: 'alice', email: 'alice@example.com', password: 'secret123' })
    const user = await User.findOne({ handle: 'alice' }).select('+password')
    await expect(user.comparePassword('wrongpassword')).resolves.toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/users/:handle
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/users/:handle', () => {
  it('returns a user profile', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .get('/api/users/testuser')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.handle).toBe('testuser')
    expect(res.body.user.followersCount).toBe(0)
    expect(res.body.user.followingCount).toBe(0)
    expect(res.body.user.projectsCount).toBe(0)
  })

  it('returns 404 for a nonexistent handle', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .get('/api/users/doesnotexist')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

})

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/users/:id/follow
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/users/:id/follow', () => {
  it('follows another user and increments their follower count', async () => {
    const { token }     = await createUser({ handle: 'alice', email: 'alice@example.com', name: 'Alice' })
    const { user: bob } = await createUser({ handle: 'bob',   email: 'bob@example.com',   name: 'Bob'   })

    const res = await request(app)
      .post(`/api/users/${bob.id}/follow`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const profile = await request(app)
      .get('/api/users/bob')
      .set('Authorization', `Bearer ${token}`)

    expect(profile.body.user.followersCount).toBe(1)
  })

  it('cannot follow yourself', async () => {
    const { token, user } = await createUser()

    const res = await request(app)
      .post(`/api/users/${user.id}/follow`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/yourself/i)
  })

  it('returns 404 for a nonexistent user id', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .post(`/api/users/${new mongoose.Types.ObjectId()}/follow`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).post(`/api/users/${new mongoose.Types.ObjectId()}/follow`)
    expect(res.status).toBe(401)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  DELETE /api/users/:id/follow
// ═══════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/users/:id/follow', () => {
  it('unfollows a user and decrements their follower count', async () => {
    const { token }     = await createUser({ handle: 'alice', email: 'alice@example.com', name: 'Alice' })
    const { user: bob } = await createUser({ handle: 'bob',   email: 'bob@example.com',   name: 'Bob'   })

    await request(app).post(`/api/users/${bob.id}/follow`).set('Authorization', `Bearer ${token}`)

    const res = await request(app)
      .delete(`/api/users/${bob.id}/follow`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const profile = await request(app)
      .get('/api/users/bob')
      .set('Authorization', `Bearer ${token}`)

    expect(profile.body.user.followersCount).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/users/search
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/users/search', () => {
  it('returns matching users by handle', async () => {
    const { token } = await createUser({ handle: 'alice', email: 'alice@example.com', name: 'Alice' })

    const res = await request(app)
      .get('/api/users/search?q=alice')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.users.length).toBeGreaterThan(0)
    expect(res.body.users[0].handle).toBe('alice')
  })

  it('returns matching users by name', async () => {
    const { token } = await createUser({ handle: 'alice', email: 'alice@example.com', name: 'Alice Wonder' })

    const res = await request(app)
      .get('/api/users/search?q=Wonder')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.users.length).toBeGreaterThan(0)
  })

  it('returns empty array when nothing matches', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .get('/api/users/search?q=zzznomatch')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(0)
  })

  it('returns empty array for a blank query', async () => {
    const { token } = await createUser()

    const res = await request(app)
      .get('/api/users/search?q=')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(0)
  })

})
