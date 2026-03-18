import type { ProfileCompletion, ProfileForm } from '../../types';

function isFilled(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return Boolean(value && String(value).trim());
}

const fieldChecks = [
  { key: 'name', label: 'Add your name', value: (form) => form.name, priority: 1 },
  { key: 'photos', label: 'Add at least 2 photos', value: (form) => (form.photos || []).length >= 2, priority: 1 },
  { key: 'bio', label: 'Write your bio', value: (form) => form.bio, priority: 2 },
  { key: 'professionWhy', label: 'Answer profession why', value: (form) => form.professionWhy, priority: 1 },
  { key: 'professionLoveLevel', label: 'Set profession love level', value: (form) => form.professionLoveLevel, priority: 2 },
  { key: 'lookingFor', label: 'Choose dating goal', value: (form) => form.lookingFor, priority: 2 },
  { key: 'interests', label: 'Add interests', value: (form) => (form.interests || []).length > 0, priority: 2 },
  { key: 'location', label: 'Add location', value: (form) => form.location, priority: 3 }
];

export function getProfileCompletion(form: ProfileForm): ProfileCompletion {
  const checks = [
    form.name,
    form.age,
    form.bio,
    form.location,
    form.lookingFor,
    form.jobTitle,
    form.company,
    form.education,
    form.interests,
    form.photos,
    form.professionWhy,
    form.professionLoveLevel,
    form.firstDateIdea,
    form.weekendVibe
  ];

  const completed = checks.filter(isFilled).length;
  const total = checks.length;
  const percent = Math.round((completed / total) * 100);
  const missing = fieldChecks
    .filter((item) => {
      const result = item.value(form);
      return typeof result === 'boolean' ? !result : !isFilled(result);
    })
    .sort((a, b) => a.priority - b.priority)
    .map((item) => item.label);

  return {
    completed,
    total,
    percent,
    missing
  };
}
