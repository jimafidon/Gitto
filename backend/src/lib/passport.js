// backend/src/lib/passport.js

import passport              from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as GitHubStrategy } from 'passport-github2'
import User from '../models/User.js'

// ── shared find-or-create logic ───────────────────────────────
// Both providers do the same thing — find or create a user.
// Extract it into a helper so you don't repeat it.
async function findOrCreateUser({ provider, providerId, name, email, avatar }) {
  let user = await User.findOne({
    $or: [
      { 'providers.provider': provider, 'providers.providerId': providerId },
      { email },
    ],
  })

  if (user) {
    const alreadyLinked = user.providers.some(
      p => p.provider === provider && p.providerId === providerId
    )
    if (!alreadyLinked) {
      user.providers.push({ provider, providerId })
      if (!user.avatar && avatar) user.avatar = avatar
      await user.save()
    }
  } else {
    const baseHandle = name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 15)

    let handle = baseHandle
    let count  = 1
    while (await User.findOne({ handle })) {
      handle = `${baseHandle}${count++}`
    }

    user = await User.create({
      name, email, avatar, handle,
      isVerified: true,
      password:   null,
      providers:  [{ provider, providerId }],
    })
  }

  return user
}

export function configurePassport() {

  // ── Google ────────────────────────────────────────────────────
  passport.use(new GoogleStrategy(
    {
      clientID:    process.env.GOOGLE_CLIENT_ID,
      clientSecret:process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
      scope:       ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser({
          provider:   'google',
          providerId: profile.id,
          name:       profile.displayName,
          email:      profile.emails?.[0]?.value,
          avatar:     profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) {
        done(err, null)
      }
    }
  ))

  // ── GitHub ────────────────────────────────────────────────────
  passport.use(new GitHubStrategy(
    {
      clientID:    process.env.GITHUB_CLIENT_ID,
      clientSecret:process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/github/callback`,
      scope:       ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub sometimes doesn't return a public email —
        // fall back to the first verified email in the emails array
        const email =
          profile.emails?.find(e => e.verified)?.value ||
          profile.emails?.[0]?.value

        if (!email) return done(new Error('No email returned from GitHub'), null)

        const user = await findOrCreateUser({
          provider:   'github',
          providerId: String(profile.id),
          name:       profile.displayName || profile.username,
          email,
          avatar:     profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) {
        done(err, null)
      }
    }
  ))

  passport.serializeUser((user, done)   => done(null, user._id))
  passport.deserializeUser(async (id, done) => {
    try   { done(null, await User.findById(id)) }
    catch (err) { done(err, null) }
  })
}

export default passport