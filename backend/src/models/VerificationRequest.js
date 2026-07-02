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

// A user's request to have their profession verified. Admin reviews and
// approves/rejects — verification is NEVER self-serve (that badge is the trust
// anchor of the app, so it must be gated by a human/real check).
const verificationRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profession: { type: String, default: '' },
    note: { type: String, default: '', maxlength: 500 }, // optional user-supplied context
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

// At most one pending request per user.
verificationRequestSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
