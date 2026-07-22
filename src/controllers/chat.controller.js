const chatService = require("../services/chat.service");

// GET /chat/:otherUserId?limit=20&offset=0
// Fetches message history between the logged-in user (req.user.id,
// set from the x-user-id header) and whoever they're chatting with.
async function getConversation(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.otherUserId;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    const messages = await chatService.getConversation(
      currentUserId,
      otherUserId,
      limit,
      offset
    );
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
}

module.exports = { getConversation };