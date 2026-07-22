// test-client-2.js
const { io } = require("socket.io-client");

const socket = io("http://localhost:4003", {
  auth: { userId: "22222222-2222-2222-2222-222222222222", role: "customer" },
});

socket.on("connect", () => {
  console.log("user 2222... connected, waiting for messages...");
});

socket.on("new_message", (msg) => console.log("user 2222... received:", msg));