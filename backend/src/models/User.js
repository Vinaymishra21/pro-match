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

    // Profession verification (Phase 1.2/2)
    professionVerified: { type: Boolean, default: false },

    // Monetization (Phase 2)
    tier: { type: String, enum: ['free', 'pro'], default: 'free' },
    proExpiresAt: { type: Date, default: null },
    credits: { type: Number, default: 0, min: 0 },

    // Weekly cross-profession discovery tracker. `weekStart` is the Monday of the
    // week these unlocks belong to; it auto-resets when a new week begins.
    professionUnlocks: {
      weekStart: { type: Date, default: null },
      professions: { type: [String], default: [] }
    }
  },
  { timestamps: true, toJSON, toObject: toJSON }
);

module.exports = mongoose.model('User', userSchema);
