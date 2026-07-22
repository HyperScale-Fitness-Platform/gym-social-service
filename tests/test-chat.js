// test-client.js — run with: node tests/test-chat.js
const { io } = require("socket.io-client");

const userId1 = "11111111-1111-1111-1111-111111111111";
const userId2 = "22222222-2222-2222-2222-222222222222";

const socket = io("http://localhost:4003", {
  auth: { userId: userId1, role: "customer" },
});

socket.on("connect", () => {
  console.log("connected!");
  socket.emit(
    "send_message",
    { receiverId: userId2, content: "hey, free to train Tuesday?" },
    (ack) => console.log("ack:", ack)
  );
});

socket.on("new_message", (msg) => console.log("received:", msg));