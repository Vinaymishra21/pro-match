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

const swipeSchema = new Schema(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: ['like', 'pass'], required: true },
    // true when the like crosses professions (Phase 2 who-likes-you / reveal logic)
    crossProfession: { type: Boolean, default: false },
    // A Super Like is still an action:'like' (so all match logic is unchanged) —
    // this flag just marks it as the standout variant for the Likes list.
    superLike: { type: Boolean, default: false }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

swipeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

module.exports = mongoose.model('Swipe', swipeSchema);
