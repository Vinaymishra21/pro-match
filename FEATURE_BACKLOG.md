# Pro Match — Feature & Fix Backlog

Running list of feature ideas and polish items, with exact code locations.
Status legend: ✅ done · 🔍 diagnosed · ⏸️ deferred · 📋 planned.

| # | Item | Status |
|---|------|--------|
| 1 | Welcome value-props read as quotes, not buttons | ✅ done (commit 072840b) |
| 2 | Center directional arrows on Android | ✅ done (commit 072840b) — needs on-device confirm |
| 3 | Settings covers status bar → top safe-area | 🔍 needs a screenshot (code already applies inset) |
| 4 | Speed pass (phone→OTP slow) | 🔍 diagnosed — Render cold start, not app code |
| 5 | Light/dark theme toggle | ✅ done — full conversion (fbb12c1 + 90ffc32); rebuild to see light |
| 6 | Location-based matching (precise GPS) | 📋 planned — needs 3 decisions + native rebuild |
| 7 | "likes you" teaser copy | ✅ done (commit 072840b) |

---

## 1. Welcome value-props read as quotes ✅
`src/screens/auth/WelcomeScreen.tsx` — the three `HIGHLIGHTS` were filled/bordered
rounded chips (`hRow`) that looked tappable. Restyled to quiet centered manifesto
lines separated by tiny dots — no button chrome. **Done, committed.**

## 2. Center directional arrows on Android ✅
Text-glyph arrows (‹ › ← ▾ ⋯) were centered on iOS via `marginTop` hacks that
pushed them off-center on Android. Fixed with `includeFontPadding:false` +
`textAlignVertical:'center'` + matching `lineHeight`, hacks removed. Files:
SettingsScreen, ChatScreen (back + menu dots), MethodScreenBase, OnboardingScaffold,
AuthKit `BackButton`, PhoneEntryScreen. **Done, committed — confirm visually on an Android device.**

## 3. Settings covers the status/notification bar 🔍
Reported: Settings content sits under the status bar on Android.
**BUT the code already applies `paddingTop: insets.top + spacing.md`**
(`SettingsScreen.tsx:102`), root has `SafeAreaProvider` (`App.tsx:48`), and
`react-native-safe-area-context` is installed. So either it's a *different* screen,
or `insets.top` returns 0 on the device. **Blocked on a screenshot + which screen.**

## 4. Speed pass — phone→OTP slow 🔍
**Diagnosed: it's Render free-tier infrastructure, not app code.**
- OTP path is light: 1 bcrypt hash + 1 DB write (~60ms); `Otp` model is indexed (phone + TTL).
- Warm latency measured ~0.4–1.0s/request (Singapore region → India, Atlas M0).
- **Real culprit: cold start** — after ~15 min idle the instance sleeps; next request waits 30–60s.

Fixes (highest impact first):
1. **Keep-warm ping** (free): external pinger (UptimeRobot / cron-job.org / GitHub Actions cron) hits `/health` every ~10 min → cold starts vanish. Self-ping won't work (instance asleep).
2. Upgrade Render (~$7/mo) → always warm; permanent fix for launch.
3. UX: show an immediate "Connecting…" state on the OTP button so a cold start doesn't feel frozen (small code change).
4. Micro-opt: OTP bcrypt cost 10→8 (~30ms; cosmetic vs cold start).

**Decision (2026-07-04):** Not adding a Render-specific keep-warm cron — the app
is migrating to AWS, where cold start disappears. Render cold start is a disposable
stopgap (use UptimeRobot free monitor during testing if needed, delete at AWS
migration). **Real work = portable, backend-agnostic code speed:**
- **Preload next Discover card images** (`Image.prefetch`) so swiping is instant — user's idea, highest value.
- Skeleton loaders so screens never feel frozen.
- Optimistic swipes/likes (update UI immediately, sync in background).
- Immediate "Connecting…" state on the OTP button.
→ Tracked as a dedicated speed pass, to run after point 6.

## 5. Light/dark theme toggle ✅
Full 47→ conversion done. `src/theme/themes.ts` (unified light+dark palettes,
dark values byte-identical to the old constants), `src/theme/ThemeProvider.tsx`
(`useTheme` / `useThemedStyles` / `ThemedStatusBar`, AsyncStorage persistence,
`Appearance` system-follow, default dark), Settings **Appearance** toggle
(Light/Dark/System). All 46 screens/components converted to `useThemedStyles`.
Commits: fbb12c1 (engine + Settings) + 90ffc32 (remaining 40 files).

**⚠️ Needs on-device visual QA in LIGHT mode** (I can't see it here). Rebuild →
Settings → Light. Dark mode is unchanged/verified.

**Follow-ups flagged during conversion (light-mode polish / cleanup):**
- `PromptField` placeholder builds `colors.textMuted + '80'` — appending to an
  rgba() string is invalid (pre-existing bug); kept byte-identical, fix later.
- `MatchCelebration` intentionally stays a dark takeover in both modes — decide
  if a light variant is wanted.
- `VerificationCard` disabled-submit gradient stays dark-grey in light — may want
  a light variant.
- A few invented light equivalents to eyeball: MethodScreenBase glass-over-photo
  rows, DiscoverScreen `boostBtnText` violet, ProfileDetailModal hero fade.
- `src/theme/colorsDark.ts` is now unused (dead code, safe to delete);
  `darkColors.ts` retained only for `darkRadius` tokens.

## 6. Location-based matching (precise GPS distance) 📋
Full scope below. Decision made: **precise GPS**, not city-only.

**Current state — cosmetic only.** Location is a typed text string; the "25 km"
distance filter is a dead label. No GPS, no coordinates. `expo-location` not installed.

Backend
- `models/User.js:29-38` — add GeoJSON `geo:{type:'Point',coordinates:[lng,lat]}` + `2dsphere` index; turn `maxDistance` (dead string) into a real `maxDistanceKm`.
- `controllers/userController.js:197-222` — accept `lat`/`lng` in `updateProfile` (current save loop only handles strings).
- `controllers/discoverController.js` — **the hard part.** Replace `User.find` (line 122) with a `$geoNear` aggregation returning distance, enforce radius, re-layer existing boost-float (153) / mutual-gender (142) / height (128) logic; handle users with no coords. Return `distanceKm`.
- `seed.js` — give demo profiles coordinates near a city.

Frontend
- Install `expo-location`; add permissions to `app.json` (none today): iOS `NSLocationWhenInUseUsageDescription`, Android `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION`.
- New permission + GPS-capture flow; degrade gracefully on denial.
- `services/apiService.ts:181-207` — add `maxDistanceKm` to `DiscoverFilters` + params.
- `components/FilterModal.tsx:33` — `distance:'25 km'` is fully dead; add a real slider.
- `screens/main/DiscoverScreen.tsx:629` — show `📍 Mumbai · 5 km away`.

**Must plan around:** ⚠️ new EAS build mandatory (native module); ⚠️ `ACCESS_FINE_LOCATION`
triggers Play Store data-safety review + privacy-policy line.

**Effort:** ~1.5–2.5 dev-days + a rebuild.

**Decisions (2026-07-04) — location is FOUNDATIONAL, not an optional filter:**
- **Required Location step in onboarding** (after Photos): GPS primer → permission
  → capture coords + reverse-geocode to city. If GPS denied, manual city pick
  fallback (never a hard dead-end). Bumps onboarding Name→Dob→Profession→Photos→
  **Location**→Gender→About→Finish; `TOTAL_STEPS` 7→8.
- Deck **defaults to nearby** (a Delhi user sees Delhi profiles); cards show "5 km away".
- On denial: **show deck, no distance** + soft "enable for accurate distance" banner.
- Max-distance = **persisted filter slider** (the dead "25 km" becomes real & saved).

**Build phases:**
- **Phase A — backend** ✅ done + verified (commit 0efd4cb): User geo field +
  2dsphere index, updateProfile coords, discover `$geoNear` rewrite (nearby-first
  + radius + distance + no-geo fallback), seed coords. Verified end-to-end against
  an in-memory Mongo (10/10: distance sort, accurate km, radius, shape parity, fallback).
- **Phase B — frontend** ⬜ next: expo-location + app.json perms, required onboarding
  Location step, DiscoverScreen "km away", persisted distance slider. Needs EAS rebuild.

**Phase A production notes:**
- The `geo` 2dsphere index auto-builds on Render deploy (Mongoose default
  `autoIndex: true`). First deploy after this may take a few extra seconds to build
  it over existing Atlas users — no manual migration needed. `$geoNear` REQUIRES
  this index (it 500s without it), so don't disable autoIndex without a migration.
- Radius filter currently does NOT hide location-less users (they append as a
  no-distance tail). Intended during transition; becomes moot once Phase B makes
  location required at onboarding. Revisit if it feels wrong.
