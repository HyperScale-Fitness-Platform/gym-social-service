const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const http = require("http");

const socialRoutes = require("./routes/social.routes");
const chatRoutes = require("./routes/chat.routes");

const { initSocket } = require("./config/socket");
const { errorHandler } = require("./middleware/errorHandler.middleware");

const { startProfileConsumer } = require("./config/kafka")

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "social-service",
  });
});

app.use("/social", socialRoutes);
app.use("/chat", chatRoutes);

app.use(errorHandler);

const httpServer = http.createServer(app);

initSocket(httpServer);

const PORT = process.env.PORT;

async function startServer() {
  try {
    await startProfileConsumer();

    httpServer.listen(PORT, () => {
      console.log(`social-service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start social-service:", error);
    process.exit(1);
  }
}

startServer();