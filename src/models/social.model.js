const pool = require("../config/database");

// ==========================================
// 1. THREADS
// ==========================================
async function findAllThreads({ limit = 10, offset = 0 }) {
  const result = await pool.query(
    `
    SELECT
      t.*,
      p.full_name,
      p.photo_url
    FROM threads t
    LEFT JOIN customer_profiles p
      ON t.user_id = p.user_id
    ORDER BY t.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return result.rows;
}


async function findThreadsByUserId(userId, limit = 10, offset = 0) {
  const result = await pool.query(
    `
    SELECT
      t.*,
      p.full_name,
      p.photo_url
    FROM threads t
    LEFT JOIN customer_profiles p
      ON t.user_id = p.user_id
    WHERE t.user_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );

  return result.rows;
}

async function findThreadById(id) {
  const result = await pool.query(
    `
    SELECT
      t.*,
      p.full_name,
      p.photo_url
    FROM threads t
    LEFT JOIN customer_profiles p
      ON t.user_id = p.user_id
    WHERE t.id = $1
    `,
    [id]
  );

  return result.rows[0];
}

async function createThread({ userId, title, content }) {

    const result = await pool.query(
        `
        INSERT INTO threads (
            user_id,
            title,
            content
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            userId,
            title,
            content
        ]
    );

    const thread = result.rows[0];

    const profileResult = await pool.query(
        `
        SELECT
            full_name,
            photo_url
        FROM customer_profiles
        WHERE user_id = $1
        `,
        [userId]
    );

    const profile = profileResult.rows[0];

    return {
        ...thread,
        full_name: profile?.full_name || null,
        photo_url: profile?.photo_url || null
    };
}

async function updateThread(id, { title, content }, userId) {
  const result = await pool.query(
    `
    UPDATE threads
    SET
      title = COALESCE($1, title),
      content = COALESCE($2, content),
      updated_at = NOW()
    WHERE id = $3
      AND user_id = $4
    RETURNING *
    `,
    [title, content, id, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const thread = result.rows[0];

  const profileResult = await pool.query(
    `
    SELECT
      full_name,
      photo_url
    FROM customer_profiles
    WHERE user_id = $1
    `,
    [thread.user_id]
  );

  const profile = profileResult.rows[0];

  return {
    ...thread,
    full_name: profile?.full_name || null,
    photo_url: profile?.photo_url || null
  };
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
async function findCommentsByThreadId(
  threadId,
  limit = 20,
  offset = 0
) {
  const result = await pool.query(
    `
    SELECT
      c.*,
      p.full_name,
      p.photo_url
    FROM comments c
    LEFT JOIN customer_profiles p
      ON c.user_id = p.user_id
    WHERE c.thread_id = $1
    ORDER BY c.created_at ASC
    LIMIT $2 OFFSET $3
    `,
    [threadId, limit, offset]
  );

  return result.rows;
}

async function createComment({
    threadId,
    userId,
    content
}) {

    const result = await pool.query(
        `
        INSERT INTO comments (
            thread_id,
            user_id,
            content
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            threadId,
            userId,
            content
        ]
    );

    const comment = result.rows[0];

    const profileResult = await pool.query(
        `
        SELECT
            full_name,
            photo_url
        FROM customer_profiles
        WHERE user_id = $1
        `,
        [userId]
    );

    const profile = profileResult.rows[0];

    return {
        ...comment,
        full_name: profile?.full_name || null,
        photo_url: profile?.photo_url || null
    };
}


async function updateComment(commentId, userId, content) {
  const result = await pool.query(
    `
    UPDATE comments
    SET
      content = $1,
      updated_at = NOW()
    WHERE id = $2
      AND user_id = $3
    RETURNING *
    `,
    [content, commentId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const comment = result.rows[0];

  const profileResult = await pool.query(
    `
    SELECT
      full_name,
      photo_url
    FROM customer_profiles
    WHERE user_id = $1
    `,
    [comment.user_id]
  );

  const profile = profileResult.rows[0];

  return {
    ...comment,
    full_name: profile?.full_name || null,
    photo_url: profile?.photo_url || null
  };
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