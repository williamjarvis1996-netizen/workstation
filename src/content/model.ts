// ===== INTERFACES =====

export interface Project {
  name: string;
  code: string;
  client: string;
  status: 'active' | 'paused' | 'completed';
  priority: 'high' | 'medium' | 'low';
  phase: string;
  statusSummary: string;
  nextMilestone?: string;
  nextMilestoneDate?: string;
  health: 'on-track' | 'at-risk' | 'blocked';
  deadline?: string;
  notes?: string;
  links?: { label: string; url: string }[];
}

export interface LogEntry {
  date: string;
  title: string;
  source: 'slack' | 'email' | 'todoist' | 'obsidian' | 'manual';
  content: string;
}

export interface Task {
  title: string;
  project?: string;
  priority: 'high' | 'medium' | 'low';
  due?: string;
  completed: boolean;
}

export interface CalendarEvent {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  calendar: 'work' | 'personal';
}

export interface QuickLink {
  label: string;
  url: string;
  category: string;
}

export interface ExerciseSession {
  date: string;
  type: 'run' | 'gym' | 'swim' | 'row' | 'cycle';
  title: string;
  duration?: string;
  distance?: string;
  avgHR?: number;
  volume?: string;
  notes?: string;
}

export interface MarathonTraining {
  raceName: string;
  raceDate: string;
  targetTime: string;
  currentPhase: string;
  weekNumber: number;
  lastLongRun: string;
  lastLongRunDate: string;
  nextLongRunTarget: string;
  weeksToRace: number;
  weeklyStructure: string;
}

export interface CreativeProject {
  name: string;
  type: string;
  status: string;
  summary: string;
}

export interface PersonalGoal {
  name: string;
  category: string;
  status: string;
  detail: string;
}
