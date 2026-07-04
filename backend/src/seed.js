/**
 * Dev seed script — populates the database with demo users so the design can be
 * reviewed with real data (swipeable cards, "who likes you" grid, matches).
 *
 * Safe & idempotent: it only clears + reseeds the demo accounts (phones starting
 * with +9100000), never touching any real users you create.
 *
 * Run: npm run seed   (from backend/)  — or it runs automatically via `npm run dev:seeded`.
 */
require('dotenv').config();
const { connectDb } = require('./utils/db');
const { User, Swipe, Match, Reveal } = require('./models');

// The dev-bypass account the app logs in as (see src/constants/config.ts).
const DEV_PHONE = '+910000000000';
const DEV_PROFESSION = 'Software Engineer';

// Stable Unsplash portrait URLs (deterministic, no API key needed).
const photo = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const PORTRAITS = [
  '1500648767791-00dcc994a43e', // m
  '1494790108377-be9c29b29330', // f
  '1507003211169-0a1dd7228f2d', // m
  '1438761681033-6461ffad8d80', // f
  '1472099645785-5658abf4ff4e', // m
  '1517841905240-472988babdf9', // f
  '1519085360753-af0119f7cbe7', // m
  '1534528741775-53994a69daeb', // f
  '1506794778202-cad84cf45f1d', // m
  '1502685104226-ee32379fefbe', // f
  '1500648767791-00dcc994a43e',
  '1488426862026-3ee34a7d66df'
];

const SE_NAMES = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Rohan', 'Meera'];
const OTHER = [
  { profession: 'Doctor', names: ['Ishaan', 'Priya'] },
  { profession: 'Designer', names: ['Vihaan', 'Sana'] },
  { profession: 'Lawyer', names: ['Arjun', 'Naina'] },
  { profession: 'Marketing Specialist', names: ['Dev', 'Riya'] }
];

const HEADLINES = [
  'Building things that matter ✦',
  'Coffee-driven & curious',
  'Weekend hiker, weekday coder',
  'Looking for a co-conspirator',
  'Equal parts logic and chaos',
  'Will debug your heart 💘'
];
const BIOS = [
  'Shipping side projects and chasing good light. Tell me about the last thing that made you curious.',
  'I make playlists for every mood and over-order at restaurants. Foodie partner-in-crime wanted.',
  'Trail runs, board games, and long debates about the best samosa in town.',
  'Reader, builder, occasional poet. I believe the right conversation can change a week.'
];

let pCount = 0;
const nextPhoto = () => photo(PORTRAITS[pCount++ % PORTRAITS.length]);

const GENDERS = ['Man', 'Woman', 'Non-binary'];
const LOOKING_FOR = ['Long-term relationship', 'Short-term dating', 'Life partner', 'Still figuring it out'];
const HEIGHTS = ['5\'6" (168 cm)', '5\'9" (175 cm)', '5\'4" (163 cm)', '6\'0" (183 cm)'];
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Spiritual', 'Agnostic'];

// City centroids as [lng, lat] — SAME order/index basis (idx % 5) as the
// `location` labels below, so each user's geo point matches their city label.
const CITIES = ['Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad'];
const CITY_COORDS = [
  [77.5946, 12.9716], // Bengaluru
  [72.8777, 19.076], // Mumbai
  [73.8567, 18.5204], // Pune
  [77.209, 28.6139], // Delhi
  [78.4867, 17.385] // Hyderabad
];
// Small jitter (±~0.05°, roughly ±5 km) so seeded distances vary within a city.
const jitter = () => (Math.random() - 0.5) * 0.1;

function buildUser(name, profession, idx) {
  const gender = GENDERS[idx % GENDERS.length];
  const [cityLng, cityLat] = CITY_COORDS[idx % 5];
  return {
    name,
    phone: `+9100001${String(1000 + pCount).padStart(5, '0')}`,
    profession,
    age: 24 + (idx % 10),
    location: CITIES[idx % 5] + ', India',
    geo: { type: 'Point', coordinates: [cityLng + jitter(), cityLat + jitter()] },
    headline: HEADLINES[idx % HEADLINES.length],
    bio: BIOS[idx % BIOS.length],
    gender,
    // Open to everyone so they appear regardless of the dev user's gender.
    genderPreference: [],
    jobTitle: profession,
    company: ['Acme', 'Nimbus', 'Vertex', 'Lumen', 'Orbit'][idx % 5],
    photos: [nextPhoto()],
    interests: ['Travel', 'Coffee', 'Music', 'Fitness'].slice(0, 2 + (idx % 3)),
    lookingFor: LOOKING_FOR[idx % LOOKING_FOR.length],
    height: HEIGHTS[idx % HEIGHTS.length],
    religion: RELIGIONS[idx % RELIGIONS.length],
    languages: ['English', 'Hindi'],
    // Verify roughly every other profile so the badge is visible in the deck.
    professionVerified: idx % 2 === 0
  };
}

async function main() {
  await connectDb();

  // Wipe previous demo data (phones in the +9100001 demo range + the dev user),
  // and everything referencing them. Real users (any other phone) are untouched.
  const demoUsers = await User.find({ phone: /^\+9100001/ }).select('_id');
  const demoIds = demoUsers.map((u) => u._id);
  const dev = await User.findOne({ phone: DEV_PHONE });
  const wipeIds = [...demoIds, ...(dev ? [dev._id] : [])];

  if (wipeIds.length) {
    await Swipe.deleteMany({ $or: [{ fromUserId: { $in: wipeIds } }, { toUserId: { $in: wipeIds } }] });
    await Match.deleteMany({ $or: [{ userA: { $in: wipeIds } }, { userB: { $in: wipeIds } }] });
    await Reveal.deleteMany({ $or: [{ userId: { $in: wipeIds } }, { likerId: { $in: wipeIds } }] });
  }
  await User.deleteMany({ phone: /^\+9100001/ });

  // Dev user (upsert so the dev-bypass login finds a profession already set).
  const devUser = await User.findOneAndUpdate(
    { phone: DEV_PHONE },
    {
      phone: DEV_PHONE,
      name: 'Dev Preview',
      profession: DEV_PROFESSION,
      age: 28,
      location: 'Bengaluru, India',
      // Bengaluru centroid, matching the location label — makes the dev deck
      // demonstrate nearest-first ordering (Bengaluru profiles up top).
      geo: { type: 'Point', coordinates: [77.5946, 12.9716] },
      headline: 'Reviewing the PRISM design ✦',
      bio: 'This is the demo account.',
      photos: [nextPhoto()],
      tier: 'free',
      credits: 30, // some credits so you can try the ₹10 reveal
      // Reset weekly cross-profession explores so every seed starts fresh at 2/2.
      professionUnlocks: { weekStart: null, professions: [] }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Same-profession candidates to swipe in Discover.
  const sameProf = [];
  for (let i = 0; i < SE_NAMES.length; i += 1) {
    sameProf.push(await User.create(buildUser(SE_NAMES[i], DEV_PROFESSION, i)));
  }

  // Other-profession users (for cross-profession explore preview).
  const others = [];
  let oi = 0;
  for (const group of OTHER) {
    for (const nm of group.names) {
      others.push(await User.create(buildUser(nm, group.profession, oi)));
      oi += 1;
    }
  }

  // "Who likes you": 4 people like the dev user but dev hasn't acted → pending
  // likes that render as blurred cards (2 same-profession, 2 cross-profession).
  const likers = [sameProf[0], sameProf[1], others[0], others[2]];
  for (const liker of likers) {
    await Swipe.create({
      fromUserId: liker._id,
      toUserId: devUser._id,
      action: 'like',
      crossProfession: liker.profession !== DEV_PROFESSION
    });
  }

  // One ready-made same-profession MATCH so Matches isn't empty:
  // sameProf[2] liked dev, and we make dev like back → mutual.
  await Swipe.create({ fromUserId: sameProf[2]._id, toUserId: devUser._id, action: 'like', crossProfession: false });
  await Swipe.create({ fromUserId: devUser._id, toUserId: sameProf[2]._id, action: 'like', crossProfession: false });
  await Match.create({ userA: devUser._id, userB: sameProf[2]._id, crossProfession: false });

  const total = await User.countDocuments({ phone: /^\+9100001/ });
  console.log('\n✅ Seed complete');
  console.log(`   Dev user: ${DEV_PHONE} (${DEV_PROFESSION}, 30 credits)`);
  console.log(`   ${total} demo profiles  ·  ${sameProf.length} same-profession to swipe`);
  console.log(`   4 people like you (2 same, 2 cross) · 1 ready match`);
  console.log('\n   Log in via the "Skip login (dev)" button in the app.\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
