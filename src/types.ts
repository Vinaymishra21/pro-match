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
  tier?: 'free' | 'pro';
  proExpiresAt?: string | null;
  credits?: number;
  age?: number | null;
  bio?: string;
  location?: string;
  gender?: string;
  genderPreference?: string[];
  agePreference?: number[];
  lookingFor?: string;
  maxDistance?: string;
  height?: string;
  languages?: string[];
  religion?: string;
  professionVerified?: boolean;
  customPrompts?: { prompt: string; answer: string }[];
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
  gender: string;
  genderPreference: string[];
  agePreference: number[];
  lookingFor: string;
  height: string;
  languages: string[];
  religion: string;
  education: string;
  company: string;
  jobTitle: string;
  headline: string;
  interests: string[];
  photos: string[];
  customPrompts: { prompt: string; answer: string }[];
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
  heightRange: [number, number]; // in cm
  distance: string;
  lookingFor: string[];
  gender: string[];
  religions: string[];
  languages: string[];
  activity: string;
  verifiedOnly: boolean;
}

export interface DiscoverProfile extends User {
  id: string;
}

export interface MatchRecord {
  id: string;
  user: User;
  crossProfession?: boolean;
}

export interface MessageRecord {
  id: string;
  matchId?: string;
  senderId: string;
  text: string;
  createdAt?: string;
  readAt?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OtpRequestResponse {
  sent: boolean;
  devCode?: string;
}

export interface OtpVerifyResponse {
  token: string;
  user: User;
  isNewUser: boolean;
}

export interface UnlockState {
  weekStart: string | null;
  professions: string[];
  used: number;
  limit: number;
  remaining: number;
}

export interface DiscoverResponse {
  profiles: DiscoverProfile[];
  profession?: string;
  isOwnProfession?: boolean;
  unlock?: UnlockState;
  isPro?: boolean;
}

export interface DiscoverAccessResponse {
  profession: string;
  unlock: UnlockState;
  isPro: boolean;
}

export interface IncomingLike extends Partial<User> {
  likerId: string;
  blurred: boolean;
  profession?: string;
  crossProfession?: boolean;
  teaser?: string;
}

export interface IncomingLikesResponse {
  likes: IncomingLike[];
  count: number;
  isPro: boolean;
  revealCost: number;
  credits: number;
}

export interface RevealResponse {
  liker: IncomingLike;
  charged: number;
  credits: number;
}

export interface CreditPack {
  id: string;
  priceInr: number;
  credits: number;
}

export interface BillingCatalog {
  pro: { priceInr: number; periodDays: number };
  creditPacks: CreditPack[];
  creditValueInr: number;
  devMode: boolean;
  keyId: string | null;
}

export interface GrantResponse {
  ok: boolean;
  granted: 'pro' | 'credits';
  credits?: number;
  user: User;
  isPro: boolean;
  dev?: boolean;
}

export interface CreateOrderResponse {
  order: { id: string; amount: number; currency: string; stub?: boolean };
  keyId: string | null;
  devMode: boolean;
  purchase: { type: string; packId: string | null; amountInr: number; label: string };
}

export interface SwipeResponse {
  matched: boolean;
  match: { id: string; crossProfession?: boolean } | null;
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
  requestOtp: (phone: string) => Promise<OtpRequestResponse>;
  verifyOtp: (phone: string, code: string) => Promise<User>;
  devBypass: () => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateLocalUser: (nextUser: User | null) => Promise<void>;
  deactivateAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export type AuthStackParamList = {
  Welcome: undefined;
  SignUpMethod: undefined;
  LoginMethod: undefined;
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
  Likes: undefined;
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
    matchUserId?: string;
  };
  Paywall:
    | {
        focus?: 'pro' | 'credits';
      }
    | undefined;
  Settings: undefined;
};
