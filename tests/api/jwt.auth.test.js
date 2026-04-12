
//  * Auth regression tests.
//  * These will pass once the auth routes in backend/src/routes/auth.routes.js
//  * and backend/src/controllers/auth.controller.js are uncommented and wired up.
//  */
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../backend/src/server.js'

const TEST_USER = {
  name:     'Test User',
  handle:   'testuser',
  email:    'test@example.com',
  password: 'password123',
}

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER)

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_USER.email)
    expect(res.body.user.handle).toBe(TEST_USER.handle)
    expect(res.body.user.password).toBeUndefined() // never expose password hash
  })

  it('rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send(TEST_USER)
    const res = await request(app).post('/api/auth/register').send(TEST_USER)

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/email|taken/i)
  })

  it('rejects duplicate handle', async () => {
    await request(app).post('/api/auth/register').send(TEST_USER)
    const res = await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'other@example.com', // different email, same handle
    })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/handle|taken/i)
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials and returns a token', async () => {
    await request(app).post('/api/auth/register').send(TEST_USER)

    const res = await request(app).post('/api/auth/login').send({
      email:    TEST_USER.email,
      password: TEST_USER.password,
    })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_USER.email)
  })

  it('rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send(TEST_USER)

    const res = await request(app).post('/api/auth/login').send({
      email:    TEST_USER.email,
      password: 'wrongpassword',
    })

    expect(res.status).toBe(401)
  })

  it('rejects unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email:    'nobody@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns current user for valid token', async () => {
    const register = await request(app).post('/api/auth/register').send(TEST_USER)
    const { token } = register.body

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(TEST_USER.email)
  })

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken')

    expect(res.status).toBe(401)
  })
})
