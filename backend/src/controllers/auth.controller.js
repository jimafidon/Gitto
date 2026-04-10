export async function getMe(req, res) {
  return res.json({
    user: {
      _id: req.user._id,
      name: req.user.name || '',
      handle: req.user.handle || '',
      email: req.user.email || '',
      avatar: req.user.avatar || '',
      followers: req.user.followers || [],
      following: req.user.following || [],
    },
  })
}
