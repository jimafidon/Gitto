// backend/src/models/User.js
import mongoose  from 'mongoose'
import bcrypt    from 'bcryptjs'

const { Schema } = mongoose

const UserSchema = new Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },

    handle: {
      type:      String,
      required:  [true, 'Handle is required'],
      unique:    true,
      trim:      true,
      lowercase: true,
      match:     [/^[a-z0-9_]{3,20}$/, 'Handle can only contain letters, numbers and underscores (3–20 chars)'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    // Nullable — OAuth users won't have a password
    password: {
      type:     String,
      default:  null,
      select:   false,   // never returned in queries unless explicitly asked for
      minlength: [8, 'Password must be at least 8 characters'],
    },

    avatar: {
      type:    String,
      default: null,     // URL to profile picture
    },

    bio: {
      type:      String,
      default:   '',
      maxlength: [200, 'Bio cannot exceed 200 characters'],
    },

    location: {
      type:    String,
      default: '',
    },

    // Who this user follows (array of User IDs)
    following: {
      type:    [Schema.Types.ObjectId],
      ref:     'User',
      default: [],
    },

    // Who follows this user
    followers: {
      type:    [Schema.Types.ObjectId],
      ref:     'User',
      default: [],
    },

    // ── OAuth providers ────────────────────────────────────────────────────────
    // Stores the provider name + their ID on that platform.
    // A user can link both Google and GitHub to the same account.
    providers: [
      {
        provider:   { type: String },   // 'google' | 'github'
        providerId: { type: String },   // the user's ID on that platform
      },
    ],

    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },

    isVerified: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v
        delete ret.password   // extra safety — never send password hash to client
        return ret
      },
    },
  }
)

// ── Virtuals ──────────────────────────────────────────────────────────────────
UserSchema.virtual('followersCount').get(function () {
  return this.followers.length
})

UserSchema.virtual('followingCount').get(function () {
  return this.following.length
})

// ── Indexes ───────────────────────────────────────────────────────────────────
UserSchema.index({ handle: 1 })
UserSchema.index({ email: 1 })

// ── Pre-save: hash password ───────────────────────────────────────────────────
// Only runs when the password field has been changed (not on every save)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// ── Instance method: compare passwords ───────────────────────────────────────
// Called as:  const isMatch = await user.comparePassword('plaintext')
UserSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password)
}

export default mongoose.model('User', UserSchema)