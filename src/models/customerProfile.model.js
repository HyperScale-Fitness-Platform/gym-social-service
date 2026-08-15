const pool = require("../config/database");

async function upsertCustomerProfile({
  userId,
  fullName,
  photoUrl,
}) {
  const result = await pool.query(
    `
    INSERT INTO customer_profiles (
      user_id,
      full_name,
      photo_url
    )
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      photo_url = EXCLUDED.photo_url,
      updated_at = NOW()
    RETURNING *
    `,
    [userId, fullName, photoUrl]
  );

  return result.rows[0];
}

async function getCustomerProfile(userId) {
  const result = await pool.query(
    `
    SELECT user_id, full_name, photo_url
    FROM customer_profiles
    WHERE user_id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  upsertCustomerProfile,
  getCustomerProfile,
};