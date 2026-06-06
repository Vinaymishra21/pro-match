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

// Records that `userId` has paid (with a credit) to reveal `likerId`, who liked
// them. Pro users see all likers without any Reveal rows.
const revealSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    likerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

revealSchema.index({ userId: 1, likerId: 1 }, { unique: true });

module.exports = mongoose.model('Reveal', revealSchema);
