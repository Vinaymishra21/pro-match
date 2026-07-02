const mongoose = require('mongoose');

const { Schema } = mongoose;

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  }
};

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String, default: '' },

    // Profile
    profession: { type: String, default: '', trim: true },
    bio: { type: String, default: '' },
    age: { type: Number, default: null, min: 18, max: 80 },
    // Date of birth (source of truth for age; age is derived + stored for the
    // discovery age filter). Collected at onboarding, enforced 18+.
    dob: { type: Date, default: null },
    location: { type: String, default: '' },
    // Self identity + who they want to be matched with.
    gender: { type: String, default: '' }, // e.g. 'Man', 'Woman', 'Non-binary', …
    // Genders this user wants to see. Empty = open to everyone.
    genderPreference: { type: [String], default: [] },
    // Age range this user wants to see [min, max]. Empty = no preference.
    agePreference: { type: [Number], default: [] },
    lookingFor: { type: String, default: '' },
    // Max distance preference label (display/filter only; no geo yet).
    maxDistance: { type: String, default: '' },

    // Additional profile facts.
    height: { type: String, default: '' }, // e.g. "5'9\" (175 cm)"
    languages: { type: [String], default: [] },
    religion: { type: String, default: '' },

    // User-selected prompts: [{ prompt, answer }]. Replaces the fixed set.
    customPrompts: {
      type: [
        {
          prompt: { type: String, default: '' },
          answer: { type: String, default: '' }
        }
      ],
      default: []
    },
    education: { type: String, default: '' },
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    headline: { type: String, default: '' },
    interests: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    drinking: { type: String, default: '' },
    smoking: { type: String, default: '' },
    workout: { type: String, default: '' },
    pets: { type: String, default: '' },
    professionWhy: { type: String, default: '' },
    professionLoveLevel: { type: String, default: '' },
    firstDateIdea: { type: String, default: '' },
    weekendVibe: { type: String, default: '' },

    // Expo push token (Phase 1.5)
    pushToken: { type: String, default: '' },

    // Safety: users this person has blocked. Blocking is one-directional in
    // intent but hides BOTH ways (neither sees the other in discovery/matches).
    blockedUsers: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },

    // Account state: deactivated accounts are hidden everywhere but recoverable
    // (logging back in reactivates). Deletion is a separate, permanent action.
    isDeactivated: { type: Boolean, default: false, index: true },
    deactivatedAt: { type: Date, default: null },

    // Moderation ban (admin-only). Unlike isDeactivated this is NOT reversible by
    // the user — logging back in does not lift it, and auth is refused while set.
    isBanned: { type: Boolean, default: false, index: true },
    bannedAt: { type: Date, default: null },

    // Profession verification (Phase 1.2/2). professionVerified is the trust
    // badge — now only set true by admin approval (see verificationStatus), never
    // self-serve. verificationStatus tracks the request lifecycle.
    professionVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none'
    },

    // Moderation signals.
    // Shadow ban: the user keeps using the app but is hidden from everyone else
    // (discovery + who-likes-you). Used for auto-actions so abusers don't
    // immediately know to make a new account.
    isShadowBanned: { type: Boolean, default: false, index: true },
    shadowBannedAt: { type: Date, default: null },
    // Count of blocked-content attempts (chat/profile); escalates to shadow ban.
    spamStrikes: { type: Number, default: 0 },
    // Set when an automated signal (e.g. duplicate photo) needs a human look.
    flaggedForReview: { type: Boolean, default: false },
    flagReason: { type: String, default: '' },

    // Admin/moderation access (for the admin dashboard). Off for normal users.
    isAdmin: { type: Boolean, default: false },

    // Monetization (Phase 2)
    tier: { type: String, enum: ['free', 'pro'], default: 'free' },
    proExpiresAt: { type: Date, default: null },
    credits: { type: Number, default: 0, min: 0 },
    // Lifetime count of swipe-undos used. Free users get 1 total; Pro unlimited.
    undosUsed: { type: Number, default: 0, min: 0 },

    // Weekly cross-profession discovery tracker. `weekStart` is the Monday of the
    // week these unlocks belong to; it auto-resets when a new week begins.
    professionUnlocks: {
      weekStart: { type: Date, default: null },
      professions: { type: [String], default: [] }
    },

    // Weekly Super Like allowance usage (same Monday-reset model as unlocks).
    superLikeUsage: {
      weekStart: { type: Date, default: null },
      count: { type: Number, default: 0 }
    },

    // Weekly Boost allowance usage.
    boostUsage: {
      weekStart: { type: Date, default: null },
      count: { type: Number, default: 0 }
    },

    // Active Boost/Spotlight window — while this is in the future the user is
    // floated to the front of other people's decks.
    boostExpiresAt: { type: Date, default: null }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

module.exports = mongoose.model('User', userSchema);
