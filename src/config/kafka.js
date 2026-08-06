const { Kafka } = require("kafkajs");
const pool = require("../config/database");

const kafka = new Kafka({
  clientId: "social-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "social-service-group",
});

async function startProfileConsumer() {
  try {
    await consumer.connect();

    console.log("Social Service connected to Kafka Broker");

    await consumer.subscribe({
      topic: "customer_creation",
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());

          console.log(
            `Received customer profile event for ${payload.id}`
          );

          const {
            id,
            full_name,
            photo_url,
          } = payload;

          await pool.query(
            `
            INSERT INTO customer_profiles
              (user_id, full_name, photo_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id)
            DO UPDATE SET
              full_name = EXCLUDED.full_name,
              photo_url = EXCLUDED.photo_url,
              updated_at = NOW()
            `,
            [id, full_name, photo_url]
          );

          console.log(
            `Customer profile stored for ${id}`
          );

        } catch (error) {
          console.error(
            "Failed to process customer profile event:",
            error
          );
        }
      },
    });

  } catch (error) {
    console.error(
      "Failed to start Social Kafka consumer:",
      error
    );

    process.exit(1);
  }
}

module.exports = {
  startProfileConsumer,
};