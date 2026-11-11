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

export const projects: Project[] = [
  {
    name: 'IKTVA 2027 - Off the Scale',
    code: '2491',
    client: 'Aramco',
    status: 'active',
    priority: 'high',
    notes: 'Immersive event film with forced-perspective animation. Pre-production phase. Alex rendering 3D hall scenes with adjustable screen placement. Ben dropped preview_V01 animation render. James updating script v03 with company locations. Richard Attias Associates confirmed as event agency. RD Content producing.',
    links: [
      { label: 'Knowledge base', url: 'https://rd-code-storage.github.io/iktva/' },
      { label: 'Google Drive', url: 'https://drive.google.com/drive/folders/1ztclxJnyhjJi4RaBB8Py_YkhFtGuVGsv' },
      { label: 'Script v03', url: 'https://docs.google.com/document/d/1ayVlX54fqgrrDMdFZ6phFeC24J_4OrpqNm8iCgoWXkE/edit' },
    ],
  },
  {
    name: 'Abask December Unboxing Video',
    code: 'Q3515',
    client: 'Abask',
    status: 'active',
    priority: 'high',
    notes: 'Branded unboxing video for December campaign. 1 shoot day, 1 camera, 4 crew (Producer, Director, DP, 1st AC) + Account Manager. Hero film (20-30s) and teaser (10-15s) in multiple formats. Storyboard and references shared with client. Chloe Hill reviewing creative. RD Content producing.',
    links: [
      { label: 'Timeline', url: 'https://docs.google.com/spreadsheets/d/1_jTkA0Y-ZZJWMG0vUy9NeyhTKgjF0n8H4PV5YNPXsKU/edit?gid=0#gid=0' },
    ],
  },
];

export const tasks: Task[] = [
  {
    title: 'Finalise product list with Abask',
    project: 'Abask Q3515',
    priority: 'medium',
    due: '2026-11-10',
    completed: false,
  },
  {
    title: 'Invoice Abask 50% on confirmation',
    project: 'Abask Q3515',
    priority: 'low',
    due: '2026-11-11',
    completed: false,
  },
  {
    title: 'Arrange product shipping from Abask',
    project: 'Abask Q3515',
    priority: 'medium',
    due: '2026-11-12',
    completed: false,
  },
  {
    title: 'Book equipment: Alexa Mini, lenses, slider, monitor, lighting',
    project: 'Abask Q3515',
    priority: 'low',
    due: '2026-11-12',
    completed: false,
  },
  {
    title: 'Send call sheet',
    project: 'Abask Q3515',
    priority: 'medium',
    due: '2026-11-14',
    completed: false,
  },
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
    date: '2026-11-11',
    title: 'Lloyd sent equipment details for Abask shoot',
    source: 'email',
    content: 'Lloyd Barker (RD Rentals) sent attachments to Angus re Q3515 Abask December Unboxing Video equipment. Awaiting confirmation on Alexa Mini package and Cooke Speed Panchros.',
  },
  {
    date: '2026-11-11',
    title: 'Conferma card deployment approved',
    source: 'email',
    content: 'Conferma Online card deployment 240927159 approved by Accounts Payable. Isabella asked Will to process first thing.',
  },
  {
    date: '2026-11-10',
    title: 'Ben dropped preview_V01 animation render',
    source: 'slack',
    content: 'Benjamin Raymond shared preview_V01.mp4 in the IKTVA channel. Rendered animation works well, much better than the stills. Ryan reviewing placement on hall walls.',
  },
  {
    date: '2026-11-10',
    title: 'Alex rendered forced-perspective scenes for IKTVA hall',
    source: 'slack',
    content: 'Alex Gorcik posted 3D renders of Dharan Expo Hall 1 with adjustable screen length. Animation placement test successful using Claude-generated scene layouts. Ryan requested swapping green box for seats and people, and using pitch film imagery.',
  },
  {
    date: '2026-11-10',
    title: 'Richard Attias Associates confirmed as event agency',
    source: 'slack',
    content: 'Ben shared richardattiasassociates.com as the agency from the morning call. Floor plan and reference images shared by Ryan.',
  },
  {
    date: '2026-11-10',
    title: 'Abask storyboard and shoot spec shared',
    source: 'slack',
    content: 'Will shared ABASK_Christmas_Storyboard_RD_Content.pdf and 3 video references in the Q3515 channel. Shoot spec: 1 camera, 4 crew, hero film (20-30s) + teaser (10-15s), multiple formats, global social usage in perpetuity.',
  },
  {
    date: '2026-11-10',
    title: 'Abask client reviewing creative',
    source: 'email',
    content: 'Chloe Hill (Abask) confirmed receipt of storyboard and references. Team reviewing internally, feedback expected same afternoon.',
  },
  {
    date: '2026-11-10',
    title: 'Prosperity Zone payment approved',
    source: 'email',
    content: 'Isabella approved PO-2781 to Will Thaxter for 2,800 GBP (2481 Prosperity Zone). Snehal confirmed expenses processed, payments going out tomorrow.',
  },
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
    content: 'James updated the script based on the messaging document. Company locations to be populated once shared by client. Storyboard to follow.',
  },
  {
    date: '2026-11-06',
    title: 'Updated milestones breakdown shared',
    source: 'email',
    content: 'Isabella shared the updated 2026 milestones breakdown. Tracy and Isabella tracking milestone emails to producers on Fridays.',
  },
  {
    date: '2026-11-06',
    title: 'Zayed NYC footage downloaded',
    source: 'email',
    content: 'WeTransfer notification: Zayed day 1 footage (234 GB) has been downloaded. Link expires 4 December 2026.',
  },
  {
    date: '2026-11-04',
    title: 'Project milestone update sent',
    source: 'email',
    content: 'Will submitted milestone updates: Zayed NYC (RDAD1048) at M11 complete, Prosperity Zone (2481) budget tracking at ~32% of ex spend target.',
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    title: 'Weekly Production Scheduling Meeting',
    date: '2026-11-12',
    startTime: '10:30',
    endTime: '11:30',
    location: 'Meeting Room 2 / Google Meet',
    calendar: 'work',
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
