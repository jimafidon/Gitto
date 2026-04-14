import passport             from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User                 from '../models/User.js'

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,

        // This must exactly match the redirect URI you added in Google Console
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,

        // Ask Google for the user's profile info and email
        scope: ['profile', 'email'],
      },

      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id
          const email    = profile.emails?.[0]?.value
          const name     = profile.displayName
          const avatar   = profile.photos?.[0]?.value

          if (!email) {
            return done(new Error('No email returned from Google'), null)
          }

          // ── Find existing user ───────────────────────────────────────────
          // Check by Google provider ID first (most reliable)
          // then fall back to email in case they previously signed up with password
          let user = await User.findOne({
            $or: [
              { 'providers.provider': 'google', 'providers.providerId': googleId },
              { email },
            ],
          })

          if (user) {
            // User already exists — make sure Google is linked to their account
            const alreadyLinked = user.providers.some(
              p => p.provider === 'google' && p.providerId === googleId
            )

            if (!alreadyLinked) {
              // They previously signed up with email/password —
              // link their Google account to the same profile
              user.providers.push({ provider: 'google', providerId: googleId })

              // Also update avatar if they don't have one yet
              if (!user.avatar && avatar) user.avatar = avatar

              await user.save()
            }
          } else {
            // ── New user — create their account ─────────────────────────
            // Generate a unique handle from their Google display name
            const baseHandle = name
              .toLowerCase()
              .replace(/\s+/g, '')      // remove spaces
              .replace(/[^a-z0-9_]/g, '') // remove special characters
              .slice(0, 15)             // max 15 chars for the base

            let handle = baseHandle
            let count  = 1

            // Keep incrementing until we find a handle that isn't already taken
            while (await User.findOne({ handle })) {
              handle = `${baseHandle}${count++}`
            }

            user = await User.create({
              name,
              email,
              avatar,
              handle,
              isVerified: true,    // Google already verified their email address
              password:   null,    // no password — they use Google to sign in
              providers: [{ provider: 'google', providerId: googleId }],
            })
          }

          // Pass the user to the route handler (no error)
          return done(null, user)

        } catch (err) {
          return done(err, null)
        }
      }
    )
  )

  // ── Serialise / Deserialise ────────────────────────────────────────────────
  // These are required by Passport even though we are not using sessions.
  // We use JWTs for sessions instead, but Passport still needs these defined.
  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
      done(null, user)
    } catch (err) {
      done(err, null)
    }
  })
}

export default passport