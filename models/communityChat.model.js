const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const communityChatSchema = new Schema(
  {
    content: {
      type: String,
    },
    sender: {
      type: String,
    },
    reciver: {
      type: String,
    },
    senderId: {
      type: Number,
    },
    reciverId: {
      type: Number,
    },
seen:{type:Boolean},
    created_at: {
      type: Date,
    },
  },
  {
    autoIndex: false,
  },
  {
    timestamps: true,
  }
);

let communityChat = mongoose.model("communityChat", communityChatSchema);

module.exports = communityChat;

