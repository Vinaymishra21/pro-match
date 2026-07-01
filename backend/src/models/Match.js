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
    endedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Order-independent key for the pair ("<smallerId>_<largerId>"). A unique
    // index on this makes a duplicate match physically impossible even if both
    // users like each other at the same instant (the loser gets E11000).
    pairKey: { type: String }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

// Derive pairKey from the two participants before every validate/save.
matchSchema.pre('validate', function setPairKey(next) {
  if (this.userA && this.userB) {
    this.pairKey = [String(this.userA), String(this.userB)].sort().join('_');
  }
  next();
});

// Partial so legacy rows (pairKey unset) don't collide on null while the field
// backfills; enforced for every new match.
matchSchema.index(
  { pairKey: 1 },
  { unique: true, partialFilterExpression: { pairKey: { $type: 'string' } } }
);

module.exports = mongoose.model('Match', matchSchema);
