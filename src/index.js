const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const socialRoutes = require("./routes/social.routes");
const { initSocket } = require("./config/socket");
const chatRoutes = require("./routes/chat.routes");
const { errorHandler } = require("./middleware/errorHandler.middleware");
const http = require("http");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "social-service" });
});


app.use("/social", socialRoutes);
app.use("/chat", chatRoutes);

app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
  console.log(`social-service listening on port ${PORT}`);
});