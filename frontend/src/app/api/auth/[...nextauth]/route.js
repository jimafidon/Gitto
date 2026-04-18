import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GithubProvider({
      clientId:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    // Called after Google returns the user's profile
    // We use this to create/find the user in OUR database
    async signIn({ user, account }) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
          {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name:       user.name,
              email:      user.email,
              avatar:     user.image,
              providerId: account.providerAccountId,
            }),
          }
        )

        const data = await res.json()
        if (!res.ok) return false

        // Attach our JWT to the user object so we can access it in the session
        user.backendToken = data.token
        user.backendId    = data.user.id
        user.handle       = data.user.handle
        return true
      } catch {
        return false
      }
    },

    // Called whenever a JWT is created or updated
    async jwt({ token, user }) {
      // 'user' is only available on first sign in
      if (user) {
        token.backendToken = user.backendToken
        token.backendId    = user.backendId
        token.handle       = user.handle
      }
      return token
    },

    // Called whenever the session is accessed in the frontend
    async session({ session, token }) {
      session.backendToken = token.backendToken
      session.user.id      = token.backendId
      session.user.handle  = token.handle
      return session
    },
  },

  pages: {
    signIn: '/login',   // redirect to my login page, not NextAuth's default
  },
})

export { handler as GET, handler as POST }