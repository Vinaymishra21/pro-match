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

// Valid report reasons (kept in sync with the client picker).
const REPORT_REASONS = [
  'Harassment or bullying',
  'Fake profile',
  'Inappropriate photos',
  'Spam or scam',
  'Underage',
  'Other'
];

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true },
    note: { type: String, default: '', maxlength: 1000 },
    // Moderation workflow state (the admin dashboard will act on these).
    status: { type: String, enum: ['open', 'reviewing', 'resolved', 'dismissed'], default: 'open', index: true },
    // Whether the reporter also chose to block the user at report time.
    alsoBlocked: { type: Boolean, default: false }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

module.exports = mongoose.model('Report', reportSchema);
module.exports.REPORT_REASONS = REPORT_REASONS;
