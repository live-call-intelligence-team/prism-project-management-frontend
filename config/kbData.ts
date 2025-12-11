export interface KBArticle {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    views: number;
    rating: number;
    readTime: string;
    lastUpdated: string;
    tags: string[];
}

export interface KBCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    articleCount: number;
}

export const KB_CATEGORIES: KBCategory[] = [
    { id: '1', name: 'Getting Started', slug: 'getting-started', description: 'Learn the basics and set up your account', icon: 'Rocket', articleCount: 12 },
    { id: '2', name: 'Account & Security', slug: 'account-security', description: 'Manage your profile and password', icon: 'Lock', articleCount: 8 },
    { id: '3', name: 'Billing & Payments', slug: 'billing', description: 'Invoices, plans, and payment methods', icon: 'CreditCard', articleCount: 5 },
    { id: '4', name: 'Technical Support', slug: 'technical', description: 'Troubleshooting and errors', icon: 'Wrench', articleCount: 15 },
];

export const KB_ARTICLES: KBArticle[] = [
    {
        id: '101',
        title: 'How to Reset Your Password',
        slug: 'reset-password',
        category: 'account-security',
        excerpt: 'Step-by-step guide to resetting your forgotten password via email.',
        content: `
            <h2>Introduction</h2>
            <p>If you've forgotten your password, don't worry! You can easily reset it using your registered email address.</p>
            <h3>Steps to Reset</h3>
            <ol>
                <li>Go to the login page.</li>
                <li>Click on "Forgot Password".</li>
                <li>Enter your email address.</li>
                <li>Check your inbox for the reset link.</li>
            </ol>
            <div class="alert alert-info">Note: The link expires in 24 hours.</div>
        `,
        views: 1240,
        rating: 4.8,
        readTime: '2 min',
        lastUpdated: 'Dec 05, 2024',
        tags: ['password', 'login', 'security']
    },
    {
        id: '102',
        title: 'Creating Your First Project',
        slug: 'create-project',
        category: 'getting-started',
        excerpt: 'Learn how to set up a new project workspace and invite members.',
        content: `
            <h2>Overview</h2>
            <p>Projects are the core of PRISM. This guide shows you how to kick off a new initiative.</p>
            <h3>Creating a Project</h3>
            <ol>
                <li>Navigate to the Projects dashboard.</li>
                <li>Click "+ Create Project".</li>
                <li>Choose a template (Scrum or Kanban).</li>
            </ol>
        `,
        views: 890,
        rating: 4.9,
        readTime: '5 min',
        lastUpdated: 'Nov 20, 2024',
        tags: ['project', 'setup']
    },
    // Add more mocks as needed...
];
