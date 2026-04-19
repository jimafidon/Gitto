import mongoose from 'mongoose'

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed'],
      default: 'upcoming',
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
  }
)

const projectCommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['in_progress', 'paused', 'completed'],
      default: 'in_progress',
    },
    tags: [{ type: String }],
    progress: { type: Number, min: 0, max: 100, default: 0 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    milestones: [milestoneSchema],
    stars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [projectCommentSchema],
  },
  { timestamps: true }
)

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema)

export default Project
