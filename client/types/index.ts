// ===== USER TYPES =====
export type UserRole = 'member' | 'coach';

export interface IUser {
  _id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== MEMBER PROFILE =====
export interface IMemberProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dob?: Date;
  age: number;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  bodyType?: string;
  goal: 'cut' | 'bulk' | 'maintain';
  experience: 'beginner' | 'intermediate' | 'advanced';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  aiAdaptive: boolean;
  notifications: boolean;
}

// ===== COACH PROFILE =====
export interface ICoachProfile {
  _id: string;
  userId: string;
  name: string;
  avatar?: string;
  bio: string;
  experience: string;
  certification: string;
  specialties: string[];
  primaryFocus: string;
  coachingStyle: string;
  clientVolume: string;
  workspaceName: string;
  location?: string;
  defaultProgramStyle: string;
  checkInFrequency: string;
  notificationPrefs: {
    onMealLog: boolean;
    onWorkoutComplete: boolean;
    onMissedCheckin: boolean;
    weeklyDigest: boolean;
  };
}

// ===== MEAL LOG =====
export interface IMealItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_g: number;
  confidence: number;
}

export interface IMealLog {
  _id: string;
  userId: string;
  date: string;
  food_name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  items: IMealItem[];
  suggestions: string[];
  imageUrl?: string;
  createdAt: Date;
}

// ===== WORKOUT PLAN =====
export interface IExercise {
  name: string;
  sets: number;
  reps: string;
  rest_s: number;
}

export interface IWorkoutDay {
  day: number;
  title: string;
  exercises: IExercise[];
}

export interface IWorkoutPlan {
  _id: string;
  userId: string;
  title: string;
  weeks: number;
  days: IWorkoutDay[];
  notes: string;
  createdAt: Date;
}

// ===== PHYSIQUE LOG =====
export interface IPhysiqueLog {
  _id: string;
  userId: string;
  imageUrl: string;
  goal: string;
  timeframe: string;
  analysis: {
    assessment: string;
    strengths: string[];
    focus_areas: string[];
    recommendations: Array<{ category: string; tip: string }>;
    projected_progress: string;
  };
  createdAt: Date;
}

// ===== CLIENT RELATIONSHIP =====
export interface IClientRelationship {
  _id: string;
  coachId: string;
  memberId: string;
  memberProfile?: IMemberProfile;
  status: 'pending' | 'active' | 'inactive';
  connectedAt: Date;
  goal?: string;
  adherencePercent: number;
  lastActive?: Date;
}

// ===== API RESPONSE =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===== NEXT AUTH AUGMENTATION =====
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      onboardingComplete: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    role: string;
    onboardingComplete: boolean;
  }
}
