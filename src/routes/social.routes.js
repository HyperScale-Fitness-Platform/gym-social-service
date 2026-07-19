const express = require("express");
const socialController = require("../controllers/social.controller");
const { adminOnly, protect } = require("../middleware/auth.middleware"); 

const router = express.Router();

// ==========================================
// 1. THREADS
// ==========================================
router.get("/threads", protect, socialController.getAllThreads);
router.get("/users/:id/threads", protect, socialController.getUserThreads);
router.post("/threads", protect, socialController.createThread);
router.get("/threads/:id", protect, socialController.getThreadById);
router.put("/threads/:id", protect, socialController.updateThread);
router.delete("/threads/:id", protect, socialController.deleteThread);

// ==========================================
// 2. COMMENTS
// ==========================================
router.get("/threads/:id/comments", protect, socialController.getThreadComments);
router.post("/threads/:id/comments", protect, socialController.createComment);
router.put("/threads/:id/comments/:commentId", protect, socialController.updateComment);
router.delete("/threads/:id/comments/:commentId", protect, socialController.deleteComment);

// Admin
router.delete("/admin/threads/:id", protect, adminOnly, socialController.adminDeleteThread);

module.exports = router;