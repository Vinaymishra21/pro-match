const mongoose = require('mongoose');

const { Schema } = mongoose;

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  }
};

const messageSchema = new Schema(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

module.exports = mongoose.model('Message', messageSchema);
