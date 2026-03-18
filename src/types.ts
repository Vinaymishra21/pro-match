import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthMode = 'login' | 'register';
export type AuthMethod = 'email' | 'phone';
export type SwipeAction = 'like' | 'pass';
export type ProfileScreenMode = 'edit' | 'preview';

export interface User {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  profession?: string;
  age?: number | null;
  bio?: string;
  location?: string;
  lookingFor?: string;
  education?: string;
  company?: string;
  jobTitle?: string;
  headline?: string;
  interests?: string[];
  photos?: string[];
  drinking?: string;
  smoking?: string;
  workout?: string;
  pets?: string;
  professionWhy?: string;
  professionLoveLevel?: string;
  firstDateIdea?: string;
  weekendVibe?: string;
}

export interface ProfileForm {
  name: string;
  age: string;
  bio: string;
  location: string;
  lookingFor: string;
  education: string;
  company: string;
  jobTitle: string;
  headline: string;
  interests: string[];
  photos: string[];
  drinking: string;
  smoking: string;
  workout: string;
  pets: string;
  professionWhy: string;
  professionLoveLevel: string;
  firstDateIdea: string;
  weekendVibe: string;
}

export interface ProfileCompletion {
  completed: number;
  total: number;
  percent: number;
  missing: string[];
}

export interface FilterState {
  ageRange: [number, number];
  distance: string;
  professions: string[];
  lookingFor: string[];
  gender: string;
  activity: string;
  verified: string;
  showProfessionOnly: boolean;
}

export interface DiscoverProfile extends User {
  id: string;
}

export interface MatchRecord {
  id: string;
  user: User;
}

export interface MessageRecord {
  id: string;
  senderId: string;
  text: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DiscoverResponse {
  profiles: DiscoverProfile[];
}

export interface MatchesResponse {
  matches: MatchRecord[];
}

export interface MessagesResponse {
  messages: MessageRecord[];
}

export interface AuthPayload {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface AuthContextValue {
  token: string;
  user: User | null;
  isLoading: boolean;
  signUp: (payload: AuthPayload) => Promise<User>;
  signIn: (payload: AuthPayload) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateLocalUser: (nextUser: User | null) => Promise<void>;
}

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneEntry: undefined;
  OtpVerification: {
    countryCode: string;
    phoneNumber: string;
  };
  Auth: {
    initialMode?: AuthMode;
  } | undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  AuthFlow: NavigatorScreenParams<AuthStackParamList>;
  ProfessionSetup: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Chat: {
    matchId: string;
    matchName: string;
  };
};
