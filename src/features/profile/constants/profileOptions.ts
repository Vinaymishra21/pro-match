export const lookingForOptions = [
  'Long-term relationship',
  'Short-term dating',
  'Life partner',
  'Still figuring it out'
];

// Inclusive identity options used for the profile gender dropdown and the
// "interested in" match preference.
export const genderOptions = [
  'Man',
  'Woman',
  'Non-binary',
  'Transgender',
  'Genderfluid',
  'Other'
];

export const professionLoveOptions = ['It pays the bills', 'I like it', 'I love it', "It's my calling"];

export const drinkingOptions = ['Never', 'Sometimes', 'Socially', 'Often'];
export const smokingOptions = ['Never', 'Sometimes', 'Socially', 'Often'];
export const workoutOptions = ['Daily', 'Few times/week', 'Sometimes', 'Rarely'];
export const petOptions = ['Dog person', 'Cat person', 'Both', 'No pets'];

export const religionOptions = [
  'Hindu',
  'Muslim',
  'Christian',
  'Sikh',
  'Buddhist',
  'Jain',
  'Jewish',
  'Spiritual',
  'Atheist',
  'Agnostic',
  'Prefer not to say'
];

export const languageOptions = [
  'English',
  'Hindi',
  'Bengali',
  'Marathi',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Urdu',
  'Other'
];

// Height options from 4'10" (58") to 6'6" (78") with cm equivalents.
export const heightOptions = (() => {
  const list = [];
  for (let totalInches = 58; totalInches <= 78; totalInches += 1) {
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    const cm = Math.round(totalInches * 2.54);
    list.push(`${ft}'${inch}" (${cm} cm)`);
  }
  return list;
})();

// Pool of prompt questions users can pick from to show personality.
export const promptPool = [
  'Why did you choose your profession?',
  'A skill from my job that helps in dating…',
  'The most interesting part of my work is…',
  'My ideal first date',
  'My weekend vibe',
  'The way to win me over is…',
  'A cause I care about',
  'My most controversial (light) opinion',
  'Two truths and a lie',
  'I geek out about…',
  'My simple pleasures',
  'A life goal of mine'
];

export const interestSuggestions = [
  'Travel',
  'Gym',
  'Music',
  'Food',
  'Reading',
  'Gaming',
  'Photography',
  'Movies',
  'Cycling',
  'Cricket',
  'Football',
  'Startups'
];
