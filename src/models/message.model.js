const pool = require("../config/database");

async function create({ senderId, receiverId, content }) {
  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [senderId, receiverId, content]
  );
  return result.rows[0];
}

// Fetches the conversation between two specific users, oldest-first
// within the page, paginated with limit/offset like your thread APIs.
async function findConversation(userA, userB, limit, offset) {
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at DESC
     LIMIT $3 OFFSET $4`,
    [userA, userB, limit, offset]
  );
  return result.rows;
}

module.exports = { create, findConversation };