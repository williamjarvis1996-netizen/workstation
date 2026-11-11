import training2026 from './training-2026.json';
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

const snapshot: Dashboard = {
  projects: [
    {
      name: 'Abask December Unboxing Video',
      code: 'Q3515',
      client: 'Abask',
      status: 'active',
      priority: 'high',
      phase: 'Pre-production',
      statusSummary: 'Shoot w/c 16 Nov. Deck V2 sent, client confirmed 12 products. DP and 1st AC still TBC.',
      nextMilestone: 'Lock shoot day and location',
      nextMilestoneDate: '2026-11-14',
      health: 'at-risk',
      notes: 'Luxury e-commerce Christmas unboxing. Will producing, Rosie directing. 1 shoot day, 4 crew. Hero film (20-30s) + teaser (10-15s). Still to lock: exact day, location, final product list, shipping, kit, shot list, 50% invoice.',
      links: [
        { label: 'Timeline', url: 'https://docs.google.com/spreadsheets/d/1_jTkA0Y-ZZJWMG0vUy9NeyhTKgjF0n8H4PV5YNPXsKU/edit?gid=0#gid=0' },
      ],
    },
    {
      name: 'Aramco Prosperity Zone',
      code: 'Q3409',
      client: 'Aramco',
      status: 'active',
      priority: 'high',
      phase: 'Late post-production',
      statusSummary: 'Client amends round 2. Most notes resolved, a few editorial decisions still with Eddie.',
      nextMilestone: 'Final delivery',
      health: 'at-risk',
      notes: 'Hero film "Ground That Built a Nation". Will lead producer/budget holder. Delivery date passed (was 29 Oct), still in amends. Open: new VO (Eddie), Dhahran naming scene, global-impact ending (VFX), credits sequence.',
    },
    {
      name: 'Ares Women in Wealth',
      code: 'RDC1058a',
      client: 'Ares Management',
      status: 'active',
      priority: 'high',
      phase: 'Post-production',
      statusSummary: 'V6 sizzle reel sent 3 Nov. Client pushing on pacing, panel soundbites, lower thirds.',
      nextMilestone: 'Final sizzle reel approval',
      health: 'on-track',
      notes: 'Beverly Hills event. Retainer runs through Jan 2027. Laguna event cancelled for RD. Retainer pivot: Nikhil sending 3 content options within 3-4 weeks for H1 2027.',
    },
    {
      name: 'Fora Live Forum Miami',
      code: 'RDNY1082',
      client: 'Fora',
      status: 'active',
      priority: 'medium',
      phase: 'Post-production',
      statusSummary: 'Event wrapped 3-5 Nov. Sizzle delivered. Product Update video and 60s recap due.',
      nextMilestone: 'Product Update + 60s recap delivery',
      health: 'on-track',
      notes: 'Ruby Neave leading, Marco Serra editing. Will supporting the edit.',
    },
    {
      name: 'Maudsley Health Abu Dhabi',
      code: 'Q3518',
      client: 'Maudsley',
      status: 'active',
      priority: 'medium',
      phase: 'Pitch',
      statusSummary: 'Hero film for private psychiatric hospital launch. Deck v01 sent 6 Nov. Creative to be pushed further.',
      nextMilestone: 'Creative direction locked',
      nextMilestoneDate: '2026-11-15',
      health: 'on-track',
      notes: 'Premiering at launch 28 Jan 2027. Will producing. Quote v1 at 76,759 GBP. Studio 2 requested for 8-10 Dec.',
    },
    {
      name: 'IKTVA 2027 - Off the Scale',
      code: '2491',
      client: 'Aramco',
      status: 'active',
      priority: 'high',
      phase: 'Pre-production',
      statusSummary: 'Immersive event film. 3D hall renders in, animation preview V01 working. Script v03 in progress.',
      nextMilestone: 'Script v03 + storyboard locked',
      health: 'on-track',
      notes: 'Forced-perspective animation. Alex rendering 3D scenes. Ben dropped preview_V01. James updating script. Richard Attias Associates confirmed as event agency.',
      links: [
        { label: 'Knowledge base', url: 'https://rd-code-storage.github.io/iktva/' },
        { label: 'Google Drive', url: 'https://drive.google.com/drive/folders/1ztclxJnyhjJi4RaBB8Py_YkhFtGuVGsv' },
        { label: 'Script v03', url: 'https://docs.google.com/document/d/1ayVlX54fqgrrDMdFZ6phFeC24J_4OrpqNm8iCgoWXkE/edit' },
      ],
    },
    {
      name: 'Hamilton Solar "Chase the Sun"',
      code: 'Q3326',
      client: 'Hamilton Watches',
      status: 'paused',
      priority: 'low',
      phase: 'Parked',
      statusSummary: 'Launch pushed to summer 2027. No active work.',
      health: 'on-track',
    },
  ],
  tasks: [
    { title: 'Confirm exact shoot day w/c 16 Nov', project: 'Abask Q3515', priority: 'high', due: '2026-11-07', completed: false },
    { title: 'Confirm shoot location', project: 'Abask Q3515', priority: 'high', due: '2026-11-07', completed: false },
    { title: 'Invoice Abask 50% on confirmation', project: 'Abask Q3515', priority: 'low', due: '2026-11-07', completed: false },
    { title: 'Finalise product list with Abask', project: 'Abask Q3515', priority: 'medium', due: '2026-11-10', completed: false },
    { title: 'Arrange product shipping from Abask', project: 'Abask Q3515', priority: 'medium', due: '2026-11-12', completed: false },
    { title: 'Book equipment', project: 'Abask Q3515', priority: 'low', due: '2026-11-12', completed: false },
    { title: 'Build shot list and schedule', project: 'Abask Q3515', priority: 'medium', due: '2026-11-13', completed: false },
    { title: 'Send call sheet', project: 'Abask Q3515', priority: 'medium', due: '2026-11-14', completed: false },
    { title: 'Add team members to IKTVA repo', project: 'IKTVA 2027', priority: 'high', due: '2026-11-12', completed: false },
    { title: 'Upload Slack images to IKTVA assets page', project: 'IKTVA 2027', priority: 'medium', completed: false },
    { title: 'Book dentist', project: 'Personal', priority: 'medium', due: '2026-10-28', completed: false },
    { title: 'Painting for room', project: 'Shopping', priority: 'low', due: '2026-10-28', completed: false },
    { title: 'Frame Charlotte\'s Picture', project: 'Shopping', priority: 'low', due: '2026-10-28', completed: false },
    { title: 'Get bedsheets', project: 'Shopping', priority: 'low', completed: false },
    { title: 'Join run club', project: 'Personal', priority: 'low', due: '2026-11-07', completed: false },
  ],
  log: [
    { date: '2026-11-11', title: 'Lloyd sent equipment details for Abask shoot', source: 'email', content: 'Lloyd Barker (RD Rentals) sent attachments to Angus re Q3515 Abask December Unboxing Video equipment. Awaiting confirmation on Alexa Mini package and Cooke Speed Panchros.' },
    { date: '2026-11-11', title: 'Conferma card deployment approved', source: 'email', content: 'Conferma Online card deployment 240927159 approved by Accounts Payable. Isabella asked Will to process first thing.' },
    { date: '2026-11-10', title: 'Ben dropped preview_V01 animation render', source: 'slack', content: 'Benjamin Raymond shared preview_V01.mp4 in the IKTVA channel. Rendered animation works well, much better than the stills. Ryan reviewing placement on hall walls.' },
    { date: '2026-11-10', title: 'Alex rendered forced-perspective scenes for IKTVA hall', source: 'slack', content: 'Alex Gorcik posted 3D renders of Dharan Expo Hall 1 with adjustable screen length. Animation placement test successful using Claude-generated scene layouts. Ryan requested swapping green box for seats and people, and using pitch film imagery.' },
    { date: '2026-11-10', title: 'Richard Attias Associates confirmed as event agency', source: 'slack', content: 'Ben shared richardattiasassociates.com as the agency from the morning call. Floor plan and reference images shared by Ryan.' },
    { date: '2026-11-10', title: 'Abask storyboard and shoot spec shared', source: 'slack', content: 'Will shared ABASK_Christmas_Storyboard_RD_Content.pdf and 3 video references in the Q3515 channel. Shoot spec: 1 camera, 4 crew, hero film (20-30s) + teaser (10-15s), multiple formats, global social usage in perpetuity.' },
    { date: '2026-11-10', title: 'Abask client reviewing creative', source: 'email', content: 'Chloe Hill (Abask) confirmed receipt of storyboard and references. Team reviewing internally, feedback expected same afternoon.' },
    { date: '2026-11-10', title: 'Prosperity Zone payment approved', source: 'email', content: 'Isabella approved PO-2781 to Will Thaxter for 2,800 GBP (2481 Prosperity Zone). Snehal confirmed expenses processed, payments going out tomorrow.' },
    { date: '2026-11-10', title: 'IKTVA knowledge base live', source: 'manual', content: 'Set up rd-code-storage/iktva repo with Astro site, GitHub Pages deployment, assets catalog, and Google Drive integration. CLAUDE.md added for team onboarding.' },
    { date: '2026-11-09', title: 'Script v03 shared by James', source: 'slack', content: 'James updated the script based on the messaging document. Company locations to be populated once shared by client. Storyboard to follow.' },
    { date: '2026-11-06', title: 'Updated milestones breakdown shared', source: 'email', content: 'Isabella shared the updated 2026 milestones breakdown. Tracy and Isabella tracking milestone emails to producers on Fridays.' },
    { date: '2026-11-06', title: 'Zayed NYC footage downloaded', source: 'email', content: 'WeTransfer notification: Zayed day 1 footage (234 GB) has been downloaded. Link expires 4 December 2026.' },
    { date: '2026-11-04', title: 'Project milestone update sent', source: 'email', content: 'Will submitted milestone updates: Zayed NYC (RDAD1048) at M11 complete, Prosperity Zone (2481) budget tracking at ~32% of ex spend target.' },
  ],
  calendarEvents: [
    {
      title: 'Gym - Back',
      date: '2026-11-11',
      startTime: '18:30',
      endTime: '20:00',
      calendar: 'fitness',
    },
    {
      title: 'Weekly Production Scheduling Meeting',
      date: '2026-11-12',
      startTime: '10:30',
      endTime: '11:30',
      location: 'Meeting Room 2 / Google Meet',
      calendar: 'work',
    },
    {
      title: 'Spotify — £12.99',
      date: '2026-11-13',
      calendar: 'personal',
    },
    {
      title: 'Gym - Chest',
      date: '2026-11-14',
      startTime: '11:30',
      endTime: '13:00',
      calendar: 'fitness',
    },
    {
      title: 'Apple subscription — £8.99',
      date: '2026-11-16',
      calendar: 'personal',
    },
    {
      title: 'Run',
      date: '2026-11-17',
      startTime: '18:30',
      endTime: '20:00',
      calendar: 'fitness',
    },
  ],
  quickLinks: [
    { label: 'Portfolio', url: 'https://willjarvis.co', category: 'Personal' },
    { label: 'Claude Code', url: 'https://claude.ai/code', category: 'Tools' },
    { label: 'GitHub', url: 'https://github.com/williamjarvis1996-netizen', category: 'Tools' },
    { label: 'RD Slack', url: 'https://wearerd.slack.com', category: 'Work' },
    { label: 'Gmail', url: 'https://mail.google.com', category: 'Work' },
    { label: 'Todoist', url: 'https://todoist.com', category: 'Tools' },
    { label: 'IKTVA Site', url: 'https://rd-code-storage.github.io/iktva/', category: 'Projects' },
  ],
  exerciseSessions: training2026 as ExerciseSession[],
  marathonTraining: {
    raceName: 'TCS London Marathon 2027',
    raceDate: '2027-04-25',
    targetTime: 'Sub-4 hours',
    currentPhase: 'Base phase',
    weekNumber: 3,
    lastLongRun: '14.01 km (avg HR 180)',
    lastLongRunDate: '2026-11-07',
    nextLongRunTarget: '15 km',
    weeksToRace: 24,
    weeklyStructure: '2 runs + 2 gym (2+2)',
  },
  creativeProjects: [
    { name: 'Dinner, Diamonds and Death', type: 'Short film', status: 'Post-production', summary: 'Picture lock achieved. Sound design, colouring, composing, IMDb credits, festival strategy in progress. Targeting Sundance London.' },
    { name: 'Break A Leg', type: 'TV series (6x30)', status: 'Development', summary: 'Dark comedy thriller. In development with Netflix, ITV, Hager Moss. Pilot rewrite next.' },
    { name: 'Brain Drain', type: 'TV series (6x25)', status: 'Optioned', summary: 'Apocalyptic adventure comedy. Optioned by Fandango Productions.' },
    { name: 'Aortic', type: 'Short film', status: 'Festival circulation', summary: 'Jury Award for Best Performance, Rob Knox London Film Festival 2025.' },
  ],
  personalGoals: [
    { name: 'London Marathon 2027', category: 'Fitness', status: 'On track', detail: 'Sub-4 target. 2+2 plan week 3. Longest run back to 14 km. Z2 running unlocked.' },
    { name: 'Freelance writing', category: 'Career', status: 'Active', detail: 'Applications tracked in Obsidian. Targeting 500 GBP/month via YunoJuno and warm network.' },
    { name: 'London Library', category: 'Creative', status: 'Active', detail: 'Emerging Writer. Reader for 2026/27 programme.' },
    { name: 'Fundraising for Shelter', category: 'Charity', status: 'Active', detail: 'Marathon fundraising on Enthuse. Target 2,500 GBP for Team Shelter.' },
  ],
  lastUpdated: '2026-11-11',
};

// The local development server can optionally load a private snapshot.
const local = import.meta.env.DEV
  ? (await import.meta.glob<Dashboard>('./dashboard.local.ts')['./dashboard.local.ts']?.())
  : undefined;

export const dashboard = local ?? snapshot;
export const isDemo = false;
