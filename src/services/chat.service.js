const messageModel = require("../models/message.model");
const {
  connectionExists,
  getUserConnections: getUserConnectionsFromDb,
} = require("../models/chatConnection.model");

async function saveMessage({ senderId, receiverId, content }) {
  if (!content || !receiverId) {
    throw {
      status: 400,
      message: "receiverId and content are required",
    };
  }

  const connected = await connectionExists(
    senderId,
    receiverId
  );

  if (!connected) {
    throw {
      status: 403,
      message: "You don't have an active chat with this user",
    };
  }

  return messageModel.create({
    senderId,
    receiverId,
    content,
  });
}

async function getConversation(
  userA,
  userB,
  limit,
  offset
) {
  const connected = await connectionExists(
    userA,
    userB
  );

  if (!connected) {
    throw {
      status: 403,
      message: "You don't have an active chat with this user",
    };
  }

  return messageModel.findConversation(
    userA,
    userB,
    limit,
    offset
  );
}

async function getUserConnections(userId) {
  return getUserConnectionsFromDb(userId);
}

module.exports = {
  saveMessage,
  getConversation,
  getUserConnections,
};