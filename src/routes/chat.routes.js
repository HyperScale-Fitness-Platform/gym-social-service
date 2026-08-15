const express = require("express");
const chatController = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware"); 

const router = express.Router();
router.get( "/connections", protect, chatController.getConnections);
router.get("/:otherUserId", protect, chatController.getConversation);
module.exports = router;