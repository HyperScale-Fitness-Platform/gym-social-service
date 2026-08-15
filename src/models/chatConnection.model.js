const pool = require("../config/database");

async function createConnection(userA, userB) {
  const [userOne, userTwo] = [userA, userB].sort();

  const result = await pool.query(
    `
    INSERT INTO chat_connections
      (user_one_id, user_two_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *
    `,
    [userOne, userTwo]
  );

  return result.rows[0] || null;
}

async function connectionExists(userA, userB) {
  const result = await pool.query(
    `
    SELECT id
    FROM chat_connections
    WHERE
      (user_one_id = $1 AND user_two_id = $2)
      OR
      (user_one_id = $2 AND user_two_id = $1)
    LIMIT 1
    `,
    [userA, userB]
  );

  return result.rows.length > 0;
}

async function getUserConnections(userId) {
  const result = await pool.query(
    `
    SELECT
      CASE
        WHEN cc.user_one_id = $1 THEN cc.user_two_id
        ELSE cc.user_one_id
      END AS other_user_id,

      cp.full_name,
      cp.photo_url

    FROM chat_connections cc

    LEFT JOIN customer_profiles cp
      ON cp.user_id =
        CASE
          WHEN cc.user_one_id = $1 THEN cc.user_two_id
          ELSE cc.user_one_id
        END

    WHERE cc.user_one_id = $1
       OR cc.user_two_id = $1

    ORDER BY cp.full_name ASC
    `,
    [userId]
  );

  return result.rows;
}


module.exports = {
  createConnection,
  connectionExists,
  getUserConnections,
};