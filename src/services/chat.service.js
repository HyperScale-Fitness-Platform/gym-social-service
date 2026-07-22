const messageModel = require("../models/message.model");

async function saveMessage({ senderId, receiverId, content }) {
  if (!content || !receiverId) {
    throw { status: 400, message: "receiverId and content are required" };
  }
  return messageModel.create({ senderId, receiverId, content });
}

async function getConversation(userA, userB, limit, offset) {
  return messageModel.findConversation(userA, userB, limit, offset);
}

module.exports = { saveMessage, getConversation };