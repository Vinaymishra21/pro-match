import type { ProfileForm, User } from '../../types';

export function buildProfileForm(user: User | null | undefined): ProfileForm {
  return {
    name: user?.name || '',
    age: user?.age ? String(user.age) : '',
    bio: user?.bio || '',
    location: user?.location || '',
    lookingFor: user?.lookingFor || '',
    education: user?.education || '',
    company: user?.company || '',
    jobTitle: user?.jobTitle || '',
    headline: user?.headline || '',
    interests: Array.isArray(user?.interests) ? user.interests : [],
    photos: Array.isArray(user?.photos) ? user.photos.slice(0, 6) : [],
    drinking: user?.drinking || '',
    smoking: user?.smoking || '',
    workout: user?.workout || '',
    pets: user?.pets || '',
    professionWhy: user?.professionWhy || '',
    professionLoveLevel: user?.professionLoveLevel || '',
    firstDateIdea: user?.firstDateIdea || '',
    weekendVibe: user?.weekendVibe || ''
  };
}

export function parseInterestInput(input) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 12);
}
