// Add this import at the top
import { signIn } from 'next-auth/react'

// Replace the existing social-btn for Google
<button
  className="social-btn"
  onClick={() => signIn('google', { callbackUrl: '/feed' })}
>
  G &nbsp; Continue with Google
</button>