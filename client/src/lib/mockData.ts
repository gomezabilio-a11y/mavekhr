// Mock data for HR Employee Portal - Mavek

// Team/Entity-based org hierarchy (not person-based)
export interface TeamNode {
  id: string;
  name: string;          // Team or legal entity name
  type: "entity" | "division" | "department" | "team";
  headCount?: number;
  isMyTeam?: boolean;    // Highlight the current user's team
  isMyPath?: boolean;    // On the path from root to my team
  children: TeamNode[];
}

export const teamHierarchy: TeamNode = {
  id: "entity-mavek",
  name: "Mavek Group",
  type: "entity",
  headCount: 42,
  children: [
    {
      id: "entity-mavekbcs",
      name: "Mavek BCS",
      type: "entity",
      headCount: 30,
      isMyPath: true,
      children: [
        {
          id: "div-consulting",
          name: "Consulting",
          type: "division",
          headCount: 18,
          isMyPath: true,
          children: [
            {
              id: "team-consulting-sg",
              name: "Consulting SG",
              type: "team",
              headCount: 10,
              isMyTeam: true,
              children: [],
            },
            {
              id: "team-consulting-hk",
              name: "Consulting HK",
              type: "team",
              headCount: 8,
              children: [],
            },
          ],
        },
        {
          id: "div-strategy",
          name: "Strategy",
          type: "division",
          headCount: 8,
          children: [
            {
              id: "team-strategy-sg",
              name: "Strategy SG",
              type: "team",
              headCount: 8,
              children: [],
            },
          ],
        },
        {
          id: "div-finance",
          name: "Finance & Admin",
          type: "division",
          headCount: 4,
          children: [],
        },
      ],
    },
    {
      id: "entity-mavekadvisory",
      name: "Mavek Advisory",
      type: "entity",
      headCount: 12,
      children: [
        {
          id: "div-advisory-sg",
          name: "Advisory SG",
          type: "division",
          headCount: 7,
          children: [],
        },
        {
          id: "div-advisory-jp",
          name: "Advisory Japan",
          type: "division",
          headCount: 5,
          children: [],
        },
      ],
    },
  ],
};

// My team members (same team as current user)
export interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  photo: string;
  isManager?: boolean;
  isCurrentUser?: boolean;
}

export const myTeamMembers: TeamMember[] = [
  {
    id: "EMP-0001",
    name: "David Chen",
    position: "CEO",
    email: "david.chen@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
    isManager: true,
  },
  {
    id: "EMP-0042",
    name: "James Park",
    position: "Managing Director",
    email: "james.park@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    isCurrentUser: true,
  },
  {
    id: "EMP-0010",
    name: "Sarah Kim",
    position: "Consulting Manager",
    email: "sarah.kim@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: "EMP-0021",
    name: "Michael Lee",
    position: "Senior Consultant",
    email: "michael.lee@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: "EMP-0022",
    name: "Emily Wong",
    position: "Consultant",
    email: "emily.wong@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: "EMP-0023",
    name: "Ryan Tan",
    position: "Consultant",
    email: "ryan.tan@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  },
];

export const currentUser = {
  id: "EMP-0042",
  name: "James Park",
  firstName: "James",
  position: "Managing Director",
  department: "Consulting",
  manager: null,
  managerName: "N/A",
  email: "james.park@mavekbcs.com",
  phone: "+65 9123 4567",
  nationality: "Korean",
  employmentType: "Full-Time",
  startDate: "2019-03-15",
  contractEndDate: null,
  role: "Director",
  workLocation: "Singapore HQ",
  emergencyContact: "Jane Park (+65 9876 5432)",
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  nextSalaryDate: "31 July",
  evaluationOpensIn: 12,
  pendingTasks: ["Complete Self Evaluation", "Approve Leave"],
};

export const orgHierarchy = {
  id: "EMP-0001",
  name: "David Chen",
  position: "CEO",
  department: "Executive",
  email: "david.chen@mavekbcs.com",
  photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
  children: [
    {
      id: "EMP-0042",
      name: "James Park",
      position: "Managing Director",
      department: "Consulting",
      email: "james.park@mavekbcs.com",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      isCurrentUser: true,
      children: [
        {
          id: "EMP-0010",
          name: "Sarah Kim",
          position: "Consulting Manager",
          department: "Consulting",
          email: "sarah.kim@mavekbcs.com",
          photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
          children: [
            {
              id: "EMP-0021",
              name: "Michael Lee",
              position: "Senior Consultant",
              department: "Consulting",
              email: "michael.lee@mavekbcs.com",
              photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
              children: [],
            },
            {
              id: "EMP-0022",
              name: "Emily Wong",
              position: "Consultant",
              department: "Consulting",
              email: "emily.wong@mavekbcs.com",
              photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
              children: [],
            },
            {
              id: "EMP-0023",
              name: "Ryan Tan",
              position: "Consultant",
              department: "Consulting",
              email: "ryan.tan@mavekbcs.com",
              photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
              children: [],
            },
          ],
        },
        {
          id: "EMP-0011",
          name: "Alex Nguyen",
          position: "Strategy Manager",
          department: "Strategy",
          email: "alex.nguyen@mavekbcs.com",
          photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
          children: [
            {
              id: "EMP-0031",
              name: "Priya Sharma",
              position: "Strategy Analyst",
              department: "Strategy",
              email: "priya.sharma@mavekbcs.com",
              photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
              children: [],
            },
            {
              id: "EMP-0032",
              name: "Tom Bradley",
              position: "Strategy Analyst",
              department: "Strategy",
              email: "tom.bradley@mavekbcs.com",
              photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face",
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: "EMP-0002",
      name: "Lisa Huang",
      position: "CFO",
      department: "Finance",
      email: "lisa.huang@mavekbcs.com",
      photo: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=200&fit=crop&crop=face",
      children: [],
    },
  ],
};

// My team (direct reports to James Park)
export const myTeam = [
  {
    id: "EMP-0010",
    name: "Sarah Kim",
    position: "Consulting Manager",
    department: "Consulting",
    email: "sarah.kim@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    role: "Direct Report",
  },
  {
    id: "EMP-0011",
    name: "Alex Nguyen",
    position: "Strategy Manager",
    department: "Strategy",
    email: "alex.nguyen@mavekbcs.com",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
    role: "Direct Report",
  },
];

export const financialHistory = [
  { month: "June 2026", paymentDate: "30 Jun 2026", amount: "SGD 18,500", status: "Paid", payslip: true },
  { month: "May 2026", paymentDate: "31 May 2026", amount: "SGD 18,500", status: "Paid", payslip: true },
  { month: "April 2026", paymentDate: "30 Apr 2026", amount: "SGD 18,500", status: "Paid", payslip: true },
  { month: "March 2026", paymentDate: "31 Mar 2026", amount: "SGD 18,500", status: "Paid", payslip: true },
  { month: "February 2026", paymentDate: "28 Feb 2026", amount: "SGD 18,500", status: "Paid", payslip: true },
  { month: "January 2026", paymentDate: "31 Jan 2026", amount: "SGD 18,500", status: "Paid", payslip: true },
];

export const performanceData = {
  overallScore: 91.4,
  grade: "Outstanding",
  radarData: [
    { subject: "Integrity", score: 92, fullMark: 100 },
    { subject: "Expertise", score: 94, fullMark: 100 },
    { subject: "Ownership", score: 88, fullMark: 100 },
    { subject: "Collaboration", score: 92, fullMark: 100 },
    { subject: "Communication", score: 90, fullMark: 100 },
  ],
  breakdown: [
    { category: "Integrity", weight: 15, score: 92 },
    { category: "Professional Expertise", weight: 25, score: 94 },
    { category: "Service Excellence", weight: 20, score: 90 },
    { category: "Ownership", weight: 20, score: 88 },
    { category: "Self Management", weight: 5, score: 95 },
    { category: "Communication", weight: 5, score: 90 },
    { category: "Collaboration", weight: 5, score: 92 },
    { category: "Overall Impact", weight: 5, score: 93 },
  ],
  sources: [
    { label: "Manager", weight: 40, score: 92.1 },
    { label: "Peer Average", weight: 40, score: 91.2 },
    { label: "Self", weight: 20, score: 90.8 },
  ],
  comments: {
    manager: "James has demonstrated exceptional leadership throughout this evaluation period. His ability to manage complex client relationships while developing his team is commendable.",
    peer: "Consistently collaborative and supportive. James always makes time to share knowledge and mentor junior team members.",
    self: "I focused on strengthening cross-functional collaboration and improving project delivery timelines. I believe there is still room to grow in stakeholder management.",
  },
  history: ["July 2025", "December 2025", "July 2026"],
};

export const evaluationData = {
  period: "July 2026",
  status: "Open",
  opensIn: 0,
  tasks: [
    { type: "Self Evaluation", status: "Pending", target: null },
    { type: "Peer Evaluation", status: "Mixed", peers: [
      { name: "Sarah Kim", status: "Pending" },
      { name: "Alex Nguyen", status: "Completed" },
      { name: "Michael Lee", status: "Pending" },
    ]},
    { type: "Manager Evaluation", status: "Pending", target: "Team" },
  ],
};

export const announcements = [
  {
    id: 1,
    title: "Public Holiday Notice — National Day",
    category: "Holiday",
    date: "2026-07-01",
    content: "The office will be closed on August 9th in observance of National Day. Please plan your work accordingly.",
  },
  {
    id: 2,
    title: "Congratulations — Sarah Kim Promoted to Consulting Manager",
    category: "Promotion",
    date: "2026-06-15",
    content: "We are pleased to announce the promotion of Sarah Kim to Consulting Manager, effective July 1, 2026.",
  },
  {
    id: 3,
    title: "Welcome — New Joiner Ryan Tan",
    category: "New Joiner",
    date: "2026-06-01",
    content: "Please join us in welcoming Ryan Tan who has joined the Consulting team as a Consultant.",
  },
];

export const documents = [
  { name: "Employment Contract", date: "2019-03-15", type: "PDF" },
  { name: "NDA", date: "2019-03-15", type: "PDF" },
  { name: "Promotion Letter", date: "2023-01-01", type: "PDF" },
  { name: "Salary Adjustment Letter", date: "2025-01-01", type: "PDF" },
];

export const loginHistory = [
  { device: "MacBook Pro", location: "Singapore", time: "2026-07-09 09:12", status: "Current" },
  { device: "iPhone 15", location: "Singapore", time: "2026-07-08 18:45", status: "Success" },
  { device: "MacBook Pro", location: "Singapore", time: "2026-07-07 08:30", status: "Success" },
  { device: "Windows PC", location: "Kuala Lumpur", time: "2026-07-05 14:20", status: "Success" },
];
