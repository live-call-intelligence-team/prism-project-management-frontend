import { Monitor, Key, Shield, HelpCircle, FileText, Wifi, Zap } from 'lucide-react';

export const PORTAL_GROUPS = [
    {
        id: 'common',
        name: 'Common Requests',
        icon: Zap,
        description: 'Most frequent service requests',
        types: ['reset-password', 'new-account', 'vpn-access']
    },
    {
        id: 'hardware',
        name: 'Hardware & Devices',
        icon: Monitor,
        description: 'Laptops, monitors, and peripherals',
        types: ['new-laptop', 'repair-hardware', 'accessories']
    },
    {
        id: 'access',
        name: 'Access & Accounts',
        icon: Key,
        description: 'Login, permissions, and new accounts',
        types: ['new-account', 'reset-password', 'software-license']
    },
    {
        id: 'software',
        name: 'Software & Applications',
        icon: FileText,
        description: 'Installations, upgrades, and troubleshooting',
        types: ['install-software', 'report-bug', 'feature-request']
    },
    {
        id: 'network',
        name: 'Network & Connectivity',
        icon: Wifi,
        description: 'Wi-Fi, VPN, and internet issues',
        types: ['vpn-access', 'wifi-issue']
    },
    {
        id: 'general',
        name: 'General Support',
        icon: HelpCircle,
        description: 'Questions and general inquiries',
        types: ['general-inquiry']
    }
];

export const REQUEST_TYPES: Record<string, { title: string, description: string, issueType: string, priority: string }> = {
    'new-laptop': {
        title: 'Request New Laptop',
        description: 'Request a standard issue laptop or upgrade for an employee.',
        issueType: 'SERVICE_REQUEST',
        priority: 'MEDIUM'
    },
    'repair-hardware': {
        title: 'Report Broken Hardware',
        description: 'Report issues with monitors, keyboards, mice, or other devices.',
        issueType: 'INCIDENT',
        priority: 'MEDIUM'
    },
    'accessories': {
        title: 'Request Accessories',
        description: 'Keyboards, mice, adapters, headers, etc.',
        issueType: 'SERVICE_REQUEST',
        priority: 'LOW'
    },
    'new-account': {
        title: 'New Account Creation',
        description: 'Request access for a new employee or contractor.',
        issueType: 'SERVICE_REQUEST',
        priority: 'HIGH'
    },
    'reset-password': {
        title: 'Password Reset',
        description: 'Unlock account or reset forgotten password.',
        issueType: 'INCIDENT',
        priority: 'HIGH'
    },
    'software-license': {
        title: 'Request Software License',
        description: 'Request access to paid software tools.',
        issueType: 'SERVICE_REQUEST',
        priority: 'MEDIUM'
    },
    'install-software': {
        title: 'Software Installation',
        description: 'Help installing approved software.',
        issueType: 'SERVICE_REQUEST',
        priority: 'MEDIUM'
    },
    'report-bug': {
        title: 'Report a Bug',
        description: 'Something is not working as expected.',
        issueType: 'BUG',
        priority: 'MEDIUM'
    },
    'feature-request': {
        title: 'Suggest a Feature',
        description: 'Ideas to improve our systems.',
        issueType: 'STORY',
        priority: 'LOW'
    },
    'vpn-access': {
        title: 'VPN Access Issue',
        description: 'Trouble connecting to the corporate VPN.',
        issueType: 'INCIDENT',
        priority: 'HIGH'
    },
    'wifi-issue': {
        title: 'Wi-Fi Connectivity',
        description: 'Issues connecting to office Wi-Fi.',
        issueType: 'INCIDENT',
        priority: 'MEDIUM'
    },
    'general-inquiry': {
        title: 'Ask a Question',
        description: 'General support question.',
        issueType: 'TASK',
        priority: 'LOW'
    }
};
