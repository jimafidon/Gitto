import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../backend/src/server.js'

describe('Feature route smoke checks', () => {
  describe('post comments routes', () => {
    it('GET /api/posts/:id/comments rejects invalid ids', async () => {
      const res = await request(app).get('/api/posts/not-an-object-id/comments')
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Invalid post id')
    })

    it('POST /api/posts/:id/comments requires auth', async () => {
      const res = await request(app)
        .post('/api/posts/not-an-object-id/comments')
        .send({ body: 'hello' })
      expect(res.status).toBe(401)
      expect(res.body.message).toContain('No token provided')
    })
  })

  describe('project progress + discussion routes', () => {
    it('GET /api/projects/:id/comments rejects invalid ids', async () => {
      const res = await request(app).get('/api/projects/not-an-object-id/comments')
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Invalid project id')
    })

    it('PATCH /api/projects/:id/milestones/:milestoneId/complete requires auth', async () => {
      const res = await request(app).patch('/api/projects/not-an-object-id/milestones/not-an-object-id/complete')
      expect(res.status).toBe(401)
      expect(res.body.message).toContain('No token provided')
    })
  })
})
