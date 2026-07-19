const pool = require("../config/database");

// ==========================================
// 1. THREADS
// ==========================================
async function findAllThreads({ limit = 10, offset = 0 }) {
  const result = await pool.query(`SELECT * FROM threads ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return result.rows;
}

async function findThreadsByUserId(userId, limit = 10, offset = 0) {
  const result = await pool.query(
    `SELECT * FROM threads 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

async function findThreadById(id) {
  const result = await pool.query(
    `SELECT * FROM threads WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

async function createThread({ userId, title, content }) {
  const result = await pool.query(
    `INSERT INTO threads (user_id, title, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, title, content]
  );
  return result.rows[0];
}

async function updateThread(id, { title, content }, userId) {
  const result = await pool.query(
    `UPDATE threads 
     SET title = COALESCE($1, title), 
         content = COALESCE($2, content), 
         updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [title, content, id, userId]
  );
  return result.rows[0];
}

async function deleteThread(id, userId) {
  const result = await pool.query(
    `DELETE FROM threads WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return result.rows[0];
}

// ==========================================
// 2. COMMENTS
// ==========================================
async function findCommentsByThreadId(threadId, limit = 20, offset = 0) {
  const result = await pool.query(
    `SELECT * FROM comments 
     WHERE thread_id = $1 
     ORDER BY created_at ASC 
     LIMIT $2 OFFSET $3`,
    [threadId, limit, offset]
  );
  return result.rows;
}

async function createComment({ threadId, userId, content }) {
  const result = await pool.query(
    `INSERT INTO comments (thread_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [threadId, userId, content]
  );
  return result.rows[0];
}

async function updateComment(commentId, userId, content) {
  const result = await pool.query(
    `UPDATE comments 
     SET content = $1, updated_at = NOW() 
     WHERE id = $2 AND user_id = $3 
     RETURNING *`,
    [content, commentId, userId]
  );
  return result.rows[0];
}

async function deleteComment(commentId, userId) {
  const result = await pool.query(
    `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *`,
    [commentId, userId]
  );
  return result.rows[0];
}

// ==========================================
// 3. Admin
// ==========================================
async function adminDeleteThread(id) {
  const result = await pool.query(
    `DELETE FROM threads WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}


module.exports = {
  findAllThreads,
  findThreadsByUserId,
  findThreadById,
  createThread,
  updateThread,
  deleteThread,
  findCommentsByThreadId,
  createComment,
  updateComment,
  deleteComment,
  adminDeleteThread
};