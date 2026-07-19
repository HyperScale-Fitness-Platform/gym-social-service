const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const socialRoutes = require("./routes/social.routes");
const { errorHandler } = require("./middleware/errorHandler.middleware");

const app = express();

// Without this, req.body would be undefined for JSON requests — this
// tells Express to automatically parse incoming JSON bodies.
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "social-service" });
});


app.use("/social", socialRoutes);

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`social-service listening on port ${PORT}`);
});