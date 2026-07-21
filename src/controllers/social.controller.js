const socialModel = require("../models/social.model"); // Assuming this is your model's file name

// ==========================================
// 1. THREADS
// ==========================================
async function getAllThreads(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    const threads = await socialModel.findAllThreads({ limit, offset });
    res.status(200).json(threads);
  } catch (err) {
    next(err);
  }
}

async function getUserThreads(req, res, next) {
  try {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    const threads = await socialModel.findThreadsByUserId(userId, limit, offset);
    res.status(200).json(threads);
  } catch (err) {
    next(err);
  }
}

async function getThreadById(req, res, next) {
  try {
    const thread = await socialModel.findThreadById(req.params.id);
    
    if (!thread) {
      const error = new Error("Thread not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json(thread);
  } catch (err) {
    next(err);
  }
}

async function createThread(req, res, next) {
  try {
    const { title, content } = req.body;
    const userId = req.user.id; 

    if (!title || !content) {
      const error = new Error("Title and content are required");
      error.status = 400;
      throw error;
    }

    const newThread = await socialModel.createThread({ userId, title, content });
    res.status(201).json(newThread);
  } catch (err) {
    next(err);
  }
}

async function updateThread(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    // 1. Check if thread exists and verify ownership
    const thread = await socialModel.findThreadById(id);
    if (!thread) {
      const error = new Error("Thread not found");
      error.status = 404;
      throw error;
    }
    if (thread.user_id !== userId) {
      const error = new Error("You do not have permission to edit this thread");
      error.status = 403;
      throw error;
    }

    // 2. Perform the update
    const updatedThread = await socialModel.updateThread(id, { title, content }, userId);
    res.status(200).json(updatedThread);
  } catch (err) {
    next(err);
  }
}

async function deleteThread(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const thread = await socialModel.findThreadById(id);
    if (!thread) {
      const error = new Error("Thread not found");
      error.status = 404;
      throw error;
    }
    if (thread.user_id !== userId) {
      const error = new Error("You do not have permission to delete this thread");
      error.status = 403;
      throw error;
    }

    await socialModel.deleteThread(id, userId);
    res.status(200).json({ message: "Thread deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 2. COMMENTS
// ==========================================

async function getThreadComments(req, res, next) {
  try {
    const threadId = req.params.id;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    // Verify thread exists first (optional but cleaner UX)
    const thread = await socialModel.findThreadById(threadId);
    if (!thread) {
      const error = new Error("Thread not found");
      error.status = 404;
      throw error;
    }

    const comments = await socialModel.findCommentsByThreadId(threadId, limit, offset);
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

async function createComment(req, res, next) {
  try {
    const threadId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      const error = new Error("Comment content cannot be empty");
      error.status = 400;
      throw error;
    }

    const thread = await socialModel.findThreadById(threadId);
    if (!thread) {
      const error = new Error("Thread not found");
      error.status = 404;
      throw error;
    }

    const newComment = await socialModel.createComment({ threadId, userId, content });
    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
}

async function updateComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      const error = new Error("Comment content cannot be empty");
      error.status = 400;
      throw error;
    }
    
    const updatedComment = await socialModel.updateComment(commentId, userId, content);
    if (!updatedComment) {
      const error = new Error("Comment not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json(updatedComment);
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const deletedComment = await socialModel.deleteComment(commentId, userId);
    if (!deletedComment) {
      const error = new Error("Comment not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({ message: "Comment removed successfully" });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 3. ADMIN CONTROLLERS
// ==========================================

async function adminDeleteThread(req, res, next) {
  try {
    const { id } = req.params;
    
    const thread = await socialModel.adminDeleteThread(id);
    if (!thread) {
      const error = new Error("Thread not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({ message: "Thread content administratively removed" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllThreads,
  getUserThreads,
  getThreadById,
  createThread,
  updateThread,
  deleteThread,
  getThreadComments,
  createComment,
  updateComment,
  deleteComment,
  adminDeleteThread
};