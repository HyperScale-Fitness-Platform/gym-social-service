const { Kafka } = require("kafkajs");
const pool = require("../config/database");

const {
  createConnection,
} = require("../models/chatConnection.model");

const kafka = new Kafka({
  clientId: "social-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

const consumer = kafka.consumer({
  groupId: "social-service-group",
});

async function startProfileConsumer() {
  try {
    await consumer.connect();

    console.log("Social Service connected to Kafka Broker");

    // Existing customer profile event
    await consumer.subscribe({
      topic: "customer_creation",
      fromBeginning: true,
    });

    // New PT booking event
    await consumer.subscribe({
      topic: "PT_SESSION_BOOKED",
      fromBeginning: true,
    });

    await consumer.subscribe({
      topic: "PT_PACKAGE_PURCHASED",
      fromBeginning: true,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());

          console.log(
            `[Kafka] Received ${topic}`,
            payload
          );

          // -----------------------------------------
          // CUSTOMER CREATED
          // -----------------------------------------
          if (topic === "customer_creation") {
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
          }

          // -----------------------------------------
          // PT SESSION BOOKED
          // -----------------------------------------
          else if (topic === "PT_SESSION_BOOKED") {
            const {
              bookingId,
              customerId,
              trainerId,
              trainerSlotId,
            } = payload;

            if (!bookingId || !customerId || !trainerId) {
              throw new Error(
                "Invalid PT_SESSION_BOOKED event: bookingId, customerId and trainerId are required"
              );
            }

            await createConnection(
              customerId,
              trainerId
            );

            console.log(
              `[Chat] Connection established: customer ${customerId} <-> trainer ${trainerId}`
            );
          }

          else if (topic === "PT_PACKAGE_PURCHASED") {

            const {
              ptPackageId,
              customerId,
              trainerId,
              packageType,
              sessionsTotal,
            } = payload;

            if (!ptPackageId || !customerId || !trainerId) {
              throw new Error(
                "Invalid PT_PACKAGE_PURCHASED event: ptPackageId, customerId and trainerId are required"
              );
            }

            await createConnection(
              customerId,
              trainerId
            );

            console.log(
              `[Chat] Connection established after package purchase: customer ${customerId} <-> trainer ${trainerId}`
            );
          }


        } catch (error) {
          console.error(
            `Failed to process Kafka event on topic ${topic}:`,
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