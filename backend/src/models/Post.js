import mongoose from 'mongoose'

const postCommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const attachmentSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 80 },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
  },
  { _id: false }
)

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    milestone: {
      title: { type: String, trim: true },
      progress: { type: Number, min: 0, max: 100 },
    },
    tags: [{ type: String }],
    attachments: [attachmentSchema],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [postCommentSchema],
  },
  { timestamps: true }
)

postSchema.index({ createdAt: -1 })

const Post = mongoose.models.Post || mongoose.model('Post', postSchema)

export default Post
