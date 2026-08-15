const { Server } = require("socket.io");
const chatService = require("../services/chat.service");
const chatConnectionModel = require("../models/chatConnection.model");

let io;

function initSocket(httpServer) {
   io = new Server(httpServer, {
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
        // ------------------------------------------
        // 1. Validate input
        // ------------------------------------------

        if (!receiverId || !content || !content.trim()) {
          if (callback) {
            callback({
              status: "error",
              error: "receiverId and content are required",
            });
          }

          return;
        }

        // ------------------------------------------
        // 2. Make sure the users are allowed to chat
        // ------------------------------------------

        const connectionExists =
          await chatConnectionModel.connectionExists(
            socket.userId,
            receiverId
          );

        if (!connectionExists) {
          if (callback) {
            callback({
              status: "error",
              error:
                "You do not have a chat connection with this user",
            });
          }

          return;
        }

        // ------------------------------------------
        // 3. Save message to database
        // ------------------------------------------
        // The database is the source of truth.
        // This means the message is saved even if
        // the receiver is currently offline.

        const message = await chatService.saveMessage({
          senderId: socket.userId,
          receiverId,
          content: content.trim(),
        });

        // ------------------------------------------
        // 4. Send message to receiver
        // ------------------------------------------

        io.to(`user:${receiverId}`).emit(
          "new_message",
          message
        );

        // ------------------------------------------
        // 5. Send message back to sender
        // ------------------------------------------
        // This is useful when the sender has multiple
        // devices/tabs connected.

        io.to(`user:${socket.userId}`).emit(
          "new_message",
          message
        );

        // ------------------------------------------
        // 6. Acknowledge successful sending
        // ------------------------------------------

        if (callback) {
          callback({
            status: "ok",
            message,
          });
        }

      } catch (err) {
        console.error("send_message error:", err);

        if (callback) {
          callback({
            status: "error",
            error: err.message || "Failed to send message",
          });
        }
      }
    });

    // ==========================================
    // COMMUNITY THREAD ROOMS
    // ==========================================

    socket.on("join:thread", (threadId) => {
      if (!threadId) return;

      socket.join(`thread:${threadId}`);

      console.log(
        `User ${socket.userId} joined thread:${threadId}`
      );
    });

    socket.on("leave:thread", (threadId) => {
      if (!threadId) return;

      socket.leave(`thread:${threadId}`);

      console.log(
        `User ${socket.userId} left thread:${threadId}`
      );
    });

    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on("disconnect", () => {
      console.log(
        `socket disconnected: user ${socket.userId}`
      );
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
}

module.exports = {
  initSocket,
  getIO,
};