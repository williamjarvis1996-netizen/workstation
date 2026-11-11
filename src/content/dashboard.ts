export interface Project {
  name: string;
  code: string;
  client: string;
  status: 'active' | 'paused' | 'completed';
  priority: 'high' | 'medium' | 'low';
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

export interface QuickLink {
  label: string;
  url: string;
  category: string;
}

export const projects: Project[] = [
  {
    name: 'IKTVA 2027 - Off the Scale',
    code: '2491',
    client: 'Aramco',
    status: 'active',
    priority: 'high',
    notes: 'Immersive event film with forced-perspective animation. Pre-production phase.',
    links: [
      { label: 'Knowledge base', url: 'https://rd-code-storage.github.io/iktva/' },
      { label: 'Google Drive', url: 'https://drive.google.com/drive/folders/1ztclxJnyhjJi4RaBB8Py_YkhFtGuVGsv' },
      { label: 'Script v03', url: 'https://docs.google.com/document/d/1ayVlX54fqgrrDMdFZ6phFeC24J_4OrpqNm8iCgoWXkE/edit' },
    ],
  },
];

export const tasks: Task[] = [
  {
    title: 'Add team members to IKTVA repo',
    project: 'IKTVA 2027',
    priority: 'high',
    due: '2026-11-12',
    completed: false,
  },
  {
    title: 'Upload Slack images to IKTVA assets page',
    project: 'IKTVA 2027',
    priority: 'medium',
    completed: false,
  },
];

export const log: LogEntry[] = [
  {
    date: '2026-11-10',
    title: 'IKTVA knowledge base live',
    source: 'manual',
    content: 'Set up rd-code-storage/iktva repo with Astro site, GitHub Pages deployment, assets catalog, and Google Drive integration. CLAUDE.md added for team onboarding.',
  },
  {
    date: '2026-11-10',
    title: 'Alex shared Hall 1 mock-up renders',
    source: 'slack',
    content: 'Alex posted 3D renders of Dharan Expo Hall 1 with adjustable screen length. Animation placement test successful.',
  },
  {
    date: '2026-11-09',
    title: 'Script v03 shared by James',
    source: 'slack',
    content: 'James updated the script based on the messaging document. Storyboard to follow.',
  },
];

export const quickLinks: QuickLink[] = [
  { label: 'Portfolio', url: 'https://willjarvis.co', category: 'Personal' },
  { label: 'Claude Code', url: 'https://claude.ai/code', category: 'Tools' },
  { label: 'GitHub', url: 'https://github.com/williamjarvis1996-netizen', category: 'Tools' },
  { label: 'RD Slack', url: 'https://wearerd.slack.com', category: 'Work' },
  { label: 'Gmail', url: 'https://mail.google.com', category: 'Work' },
  { label: 'Todoist', url: 'https://todoist.com', category: 'Tools' },
  { label: 'IKTVA Site', url: 'https://rd-code-storage.github.io/iktva/', category: 'Projects' },
];

export const lastUpdated = '2026-11-11';
