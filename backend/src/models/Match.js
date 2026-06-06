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

const matchSchema = new Schema(
  {
    userA: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userB: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // True when the two users have different professions. Chatting on a
    // cross-profession match requires Pro (the weekly limit gates discovery;
    // this gates the conversation).
    crossProfession: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: null },
    // 'active' | 'unmatched' | 'blocked'. Soft state so history is kept for
    // moderation; anything other than 'active' is hidden from both users.
    status: { type: String, enum: ['active', 'unmatched', 'blocked'], default: 'active', index: true },
    // Who ended it (for audit / "unmatched by them" UX later).
    endedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

module.exports = mongoose.model('Match', matchSchema);
