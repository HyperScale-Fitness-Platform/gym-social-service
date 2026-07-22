const { Server } = require("socket.io");
const chatService = require("../services/chat.service");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // This runs ONCE per new connection, before any messages are exchanged.
  // We read the user's identity from the handshake — the client sends
  // this when it first connects, the same way the gateway forwards
  // user-id on normal HTTP requests.
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const role = socket.handshake.auth.role;

    if (!userId) {
      return next(new Error("unauthorized: missing userId"));
    }

    socket.userId = userId;
    socket.role = role;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`socket connected: user ${socket.userId}`);

    // Every user joins a personal room named after their own id. This
    // means "send a message to user X" is always just "emit to room
    // user:X" — regardless of how many sockets that user has open
    // (e.g. phone + laptop both connected at once).
    socket.join(`user:${socket.userId}`);

    socket.on("send_message", async (payload, callback) => {
      try {
        const { receiverId, content } = payload;

        // Save to the database FIRST — this is the source of truth.
        // If the recipient is offline, this is the only record of the
        // message until they next fetch history.
        const message = await chatService.saveMessage({
          senderId: socket.userId,
          receiverId,
          content,
        });

        // Push it live to the recipient's room, if they're connected.
        io.to(`user:${receiverId}`).emit("new_message", message);

        // Also echo it back to the sender's OTHER connected devices
        io.to(`user:${socket.userId}`).emit("new_message", message);

        // Acknowledge back to the sender that it was saved successfully
        if (callback) callback({ status: "ok", message });
      } catch (err) {
        console.error("send_message error:", err);
        if (callback) callback({ status: "error", error: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`socket disconnected: user ${socket.userId}`);
    });
  });

  return io;
}

module.exports = { initSocket };