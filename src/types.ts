export interface MoodEntry {
  id: string;
  timestamp: number;
  level: number; // 1-5
  note: string;
}

export interface MemoryEntry {
  id: string;
  timestamp: number;
  category: 'location' | 'task' | 'milestone' | 'other';
  content: string;
}

export interface UserProfile {
  name: string;
  babyName?: string;
  birthDate?: string;
  avatarColor?: string;
}
