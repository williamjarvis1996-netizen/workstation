import type { CalendarEvent, CreativeProject, ExerciseSession, LogEntry, MarathonTraining, PersonalGoal, Project, QuickLink, Task } from './model';

type Dashboard = {
  projects: Project[];
  tasks: Task[];
  log: LogEntry[];
  calendarEvents: CalendarEvent[];
  quickLinks: QuickLink[];
  exerciseSessions: ExerciseSession[];
  marathonTraining: MarathonTraining | null;
  creativeProjects: CreativeProject[];
  personalGoals: PersonalGoal[];
  lastUpdated: string;
};

const demo: Dashboard = {
  projects: [
    { name: 'Brand Film', code: 'DEMO-01', client: 'Sample Client', status: 'active', priority: 'high', phase: 'Pre-production', statusSummary: 'Treatment approved. Location options under review.', nextMilestone: 'Confirm shoot plan', health: 'at-risk' },
    { name: 'Social Series', code: 'DEMO-02', client: 'Sample Client', status: 'active', priority: 'medium', phase: 'Post-production', statusSummary: 'First cuts are ready for review.', nextMilestone: 'Collect edit notes', health: 'on-track' },
    { name: 'Studio Launch', code: 'DEMO-03', client: 'Sample Client', status: 'active', priority: 'low', phase: 'Development', statusSummary: 'Concept and budget are in progress.', health: 'on-track' },
  ],
  tasks: [{ title: 'Review the shoot plan', project: 'Brand Film', priority: 'high', completed: false }],
  log: [{ date: '2026-11-11', title: 'Treatment approved', source: 'manual', content: 'Sample activity for the preview.' }],
  calendarEvents: [],
  quickLinks: [
    { label: 'Calendar', url: 'https://calendar.google.com/', category: 'Planning' },
    { label: 'Todoist', url: 'https://app.todoist.com/', category: 'Planning' },
    { label: 'Gmail', url: 'https://mail.google.com/', category: 'Communication' },
  ],
  exerciseSessions: [{ date: '2026-11-11', type: 'run', title: 'Easy run', duration: '35 min', distance: '5 km' }],
  marathonTraining: { raceName: 'Spring Marathon 2027', raceDate: '2027-04-25', targetTime: 'Sub-4 hours',
    currentPhase: 'Base training', weekNumber: 3, lastLongRun: '12 km', lastLongRunDate: '2026-11-08',
    nextLongRunTarget: '14 km', weeksToRace: 24, weeklyStructure: '3 runs and 2 strength sessions' },
  creativeProjects: [{ name: 'Short film', type: 'Film', status: 'Development', summary: 'Outline the next draft.' }],
  personalGoals: [{ name: 'Weekly training', category: 'Fitness', status: 'In progress', detail: 'Build a consistent running routine.' }],
  lastUpdated: '',
};

// Only the local development server can load the ignored personal snapshot.
const local = import.meta.env.DEV
  ? (await import.meta.glob<Dashboard>('./dashboard.local.ts')['./dashboard.local.ts']?.())
  : undefined;

export const dashboard = local ?? demo;
export const isDemo = !local;
