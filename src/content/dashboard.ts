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
      statusSummary: 'Storyboard and script sent to client 10 Nov. Chloe reviewing with team, feedback expected. Shoot w/c 16 Nov. Atlanta back in office and re-engaged.',
      nextMilestone: 'Incorporate client storyboard feedback',
      nextMilestoneDate: '2026-11-12',
      health: 'at-risk',
      notes: 'Luxury e-commerce Christmas unboxing. Will producing, Rosie directing. 1 shoot day, 1 camera, 4 crew (Producer, Director, DP, 1st AC) + Account Manager. Hero film (20-30s) in 16x9, 1200x884, 780x376, 9x16. Teaser (10-15s) in 2400x800, 780x780, 1104x712. No VO or subtitles. Social usage, global in perpetuity. 12 products confirmed. Chloe (client) asked if deck options could be combined — yes. Sarah Blake (photographer/art director) and Claudia Saadeh (stylist) on client side. Creative alignment call held 5 Nov. Storyboard + edit references sent 10 Nov, client reviewing.',
      links: [
        { label: 'Timeline', url: 'https://docs.google.com/spreadsheets/d/1_jTkA0Y-ZZJWMG0vUy9NeyhTKgjF0n8H4PV5YNPXsKU/edit?gid=0#gid=0' },
        { label: 'Creative deck', url: 'https://docs.google.com/presentation/d/1oU7OyvTSleP4apz2bAQjEHGBV_28YsoMjq8pKqpEJv4/edit' },
      ],
    },
    {
      name: 'IKTVA 2027 - Off the Scale',
      code: '2491',
      client: 'Aramco',
      status: 'active',
      priority: 'high',
      phase: 'Pre-production',
      statusSummary: 'Active 3D development. Alex rendering photorealistic forced-perspective scenes of Dharan Expo Hall 1. Animation preview V01 landed well. Ryan reviewing shot ideas for AI-enhanced environments.',
      nextMilestone: 'Photorealistic 3D mockups of James Barry shot ideas',
      nextMilestoneDate: '2026-11-14',
      health: 'on-track',
      notes: 'Immersive event film for IKTVA 2027. Forced-perspective animation in Dharan Expo Hall 1. Alex Gorcik on 3D renders (~10m screen based on door scale). Ben Raymond dropped preview_V01.mp4. Ryan wants to mock up James Barry ideas: welding, metalwork, robotic arm assembly, scientist with test tube, crane/shipping container, climbing out of rig/ship hatch. Plan: film in office + AI replace scene with photorealistic environment. Richard Attias Associates confirmed as event agency. Script v03 in progress (James). Company locations TBC from client.',
      links: [
        { label: 'Knowledge base', url: 'https://rd-code-storage.github.io/iktva/' },
        { label: 'Google Drive', url: 'https://drive.google.com/drive/folders/1ztclxJnyhjJi4RaBB8Py_YkhFtGuVGsv' },
        { label: 'Script v03', url: 'https://docs.google.com/document/d/1ayVlX54fqgrrDMdFZ6phFeC24J_4OrpqNm8iCgoWXkE/edit' },
      ],
    },
    {
      name: 'Aramco Prosperity Zone',
      code: '2481',
      client: 'Aramco',
      status: 'active',
      priority: 'high',
      phase: 'Late post-production',
      statusSummary: 'Photo animation tests complete (10 clips). Payment PO-2781 approved (2,800 GBP). Budget tracking at ~32% of ex spend target. Delivery overdue.',
      nextMilestone: 'Final delivery',
      health: 'at-risk',
      notes: 'Hero film "Ground That Built a Nation". Will lead producer/budget holder. Original delivery 29 Oct, still in amends. 10 archive photo animation clips generated (Kling 3.0 Pro + Seedance 2.5). Known issues: p13 car barely moves, p4 archive watermark. Lucas Manley (producer) and Ollie Murray (editor) hired as reinforcements. Eddie Sternberg on script/wardrobe. Najeeb Khalid on AI prep/Beeble. Will Thaxter payment approved.',
    },
    {
      name: 'Ares Women in Wealth',
      code: 'RDC1058a',
      client: 'Ares Management',
      status: 'completed',
      priority: 'low',
      phase: 'Delivered',
      statusSummary: 'Sizzle reel V10 delivered. Client confirmed 11 Nov — videos live on Ares LinkedIn and Instagram. Project complete.',
      health: 'on-track',
      notes: 'Beverly Hills event sizzle reel. V10 (horizontal + vertical) sent 10 Nov. Charlie Sweeney confirmed all set 11 Nov. Retainer runs through Jan 2027 — Nikhil sending 3 content options within 3-4 weeks for H1 2027.',
    },
    {
      name: 'Fora Live Forum Miami',
      code: 'RDNY1082',
      client: 'Fora',
      status: 'active',
      priority: 'medium',
      phase: 'Post-production',
      statusSummary: 'V1 edit in review. Ruby requesting better spatial flow. Audio feeds for Henley and Evan speeches requested by Bridget.',
      nextMilestone: 'V2 edit incorporating Ruby feedback',
      nextMilestoneDate: '2026-11-14',
      health: 'on-track',
      notes: 'Ruby Neave leading, Marco Serra editing. Event wrapped 3-5 Nov. V1 edit delivered 10 Nov — Ruby left comments on Frame link, wants shots grouped by room/space for better flow rather than cutting back and forth. Bridget requested audio feeds from Henley and Evan speeches. Will supporting.',
    },
    {
      name: 'Maudsley Health Abu Dhabi',
      code: 'Q3518',
      client: 'Maudsley',
      status: 'active',
      priority: 'medium',
      phase: 'Creative development',
      statusSummary: 'Deck v01 sent to client 6 Nov. James Barry flagged strategic concerns — needs stronger insight and emotional creative. Mike pushing forward while developing further.',
      nextMilestone: 'Revised creative direction',
      nextMilestoneDate: '2026-11-18',
      health: 'at-risk',
      notes: 'Hero film for private psychiatric hospital launch, premiering 28 Jan 2027. Will producing. Quote v1 at 76,759 GBP. Studio 2 requested for 8-10 Dec. James Barry concerns: no strategic thought behind stigma challenge, creative concept (surprise family reveal) could misfire, needs genuine insight like the Pfizer reference. Mike Scott sent v01 to client as starting point but acknowledges creative needs pushing further. Mia may support. Stigma angle de-prioritised — client wants general brand awareness first. Every bed will be full; Maudsley not financially motivated.',
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
    { title: 'Incorporate Abask storyboard feedback from Chloe', project: 'Abask Q3515', priority: 'high', due: '2026-11-12', completed: false },
    { title: 'Confirm exact shoot day w/c 16 Nov', project: 'Abask Q3515', priority: 'high', due: '2026-11-12', completed: false },
    { title: 'Confirm shoot location', project: 'Abask Q3515', priority: 'high', due: '2026-11-12', completed: false },
    { title: 'Finalise product list with Abask (12 confirmed)', project: 'Abask Q3515', priority: 'medium', due: '2026-11-12', completed: false },
    { title: 'Arrange product shipping from Abask', project: 'Abask Q3515', priority: 'medium', due: '2026-11-13', completed: false },
    { title: 'Book equipment (Alexa Mini + Cooke Speed Panchros TBC)', project: 'Abask Q3515', priority: 'medium', due: '2026-11-13', completed: false },
    { title: 'Build shot list and schedule', project: 'Abask Q3515', priority: 'medium', due: '2026-11-14', completed: false },
    { title: 'Send call sheet', project: 'Abask Q3515', priority: 'medium', due: '2026-11-14', completed: false },
    { title: 'Invoice Abask 50% on confirmation', project: 'Abask Q3515', priority: 'low', due: '2026-11-14', completed: false },
    { title: 'Review Alex photorealistic 3D mockups', project: 'IKTVA 2027', priority: 'high', due: '2026-11-14', completed: false },
    { title: 'Add team members to IKTVA repo', project: 'IKTVA 2027', priority: 'medium', due: '2026-11-14', completed: false },
    { title: 'Upload Slack images to IKTVA assets page', project: 'IKTVA 2027', priority: 'medium', completed: false },
    { title: 'Review Fora V2 edit with Ruby', project: 'Fora RDNY1082', priority: 'medium', due: '2026-11-14', completed: false },
    { title: 'Push Maudsley creative direction further with James', project: 'Maudsley Q3518', priority: 'medium', due: '2026-11-18', completed: false },
    { title: 'Close out Ares retainer admin — Nikhil 3 content options for H1', project: 'Ares RDC1058a', priority: 'low', due: '2026-12-05', completed: false },
    { title: 'Submit milestones by Friday midday', priority: 'high', due: '2026-11-14', completed: false },
    { title: 'Book dentist', project: 'Personal', priority: 'medium', due: '2026-11-14', completed: false },
    { title: 'Join run club', project: 'Personal', priority: 'low', due: '2026-11-17', completed: false },
    { title: 'Get bedsheets', project: 'Shopping', priority: 'low', completed: false },
  ],
  log: [
    { date: '2026-11-11', title: 'Ares sizzle confirmed — live on LinkedIn and Instagram', source: 'email', content: 'Charlie Sweeney (Ares) confirmed both horizontal and vertical sizzle reels are live on Ares LinkedIn and Instagram. Project complete.' },
    { date: '2026-11-11', title: 'Abask client reviewing storyboard — feedback incoming', source: 'email', content: 'Chloe Hill reviewed storyboard and references with Abask team. Feedback expected. Atlanta Anley back in office and re-engaged on the project.' },
    { date: '2026-11-11', title: 'IKTVA 3D renders and AI scene work progressing', source: 'slack', content: 'Ryan and Alex active in IKTVA channel. Alex rendering POV shots of Dharan Expo Hall 1 (~10m screen). Ryan wants to mock up James Barry ideas: welding, metalwork, robotic arm, scientist, crane, climbing shots. Plan: film in office + AI replace scene.' },
    { date: '2026-11-11', title: 'Lloyd sent equipment details for Abask shoot', source: 'email', content: 'Lloyd Barker (RD Rentals) sent attachments to Angus re Q3515 Abask December Unboxing Video equipment. Awaiting confirmation on Alexa Mini package and Cooke Speed Panchros.' },
    { date: '2026-11-11', title: 'Conferma card deployment approved', source: 'email', content: 'Conferma Online card deployment 240927159 approved by Accounts Payable. Isabella asked Will to process first thing.' },
    { date: '2026-11-10', title: 'Abask storyboard and edit references sent to client', source: 'email', content: 'Will sent ABASK_Christmas_Storyboard_RD_Content.pdf with reference GIFs capturing the editing style to Chloe. Team excited about direction. Chloe confirmed receipt, reviewing internally.' },
    { date: '2026-11-10', title: 'Ares V10 sizzle reel sent', source: 'slack', content: 'Will sent horizontal and vertical V10 links to Charlie Sweeney via email. Updated quote removed from both versions per client request.' },
    { date: '2026-11-10', title: 'Fora Miami V1 edit delivered', source: 'slack', content: 'Marco Serra delivered V1 edit. Ruby left comments on Frame link — wants better spatial flow (shots grouped by room instead of cutting back and forth). Bridget requested audio feeds from Henley and Evan speeches.' },
    { date: '2026-11-10', title: 'IKTVA animation preview V01 and 3D renders', source: 'slack', content: 'Benjamin Raymond shared preview_V01.mp4. Rendered animation works well. Alex Gorcik posted 3D renders of Dharan Expo Hall 1. Richard Attias Associates confirmed as event agency.' },
    { date: '2026-11-10', title: 'Prosperity Zone payment approved', source: 'email', content: 'Isabella approved PO-2781 to Will Thaxter for 2,800 GBP (2481 Prosperity Zone). Snehal confirmed expenses processed, payments going out tomorrow.' },
    { date: '2026-11-10', title: 'IKTVA knowledge base live', source: 'manual', content: 'Set up rd-code-storage/iktva repo with Astro site, GitHub Pages deployment, assets catalog, and Google Drive integration. CLAUDE.md added for team onboarding.' },
    { date: '2026-11-09', title: 'Script v03 shared by James', source: 'slack', content: 'James updated the IKTVA script based on the messaging document. Company locations to be populated once shared by client. Storyboard to follow.' },
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
