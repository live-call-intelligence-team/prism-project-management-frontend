export const mockTimeEntries = [
    { id: '1', date: new Date(), taskKey: 'MAR-101', taskTitle: 'Implement Login', duration: 7200, description: 'Worked on auth flow' },
    { id: '2', date: new Date(Date.now() - 86400000), taskKey: 'MAR-102', taskTitle: 'Setup Database', duration: 3600, description: 'Schema design' },
    { id: '3', date: new Date(Date.now() - 172800000), taskKey: 'MAR-103', taskTitle: 'API Routes', duration: 5400, description: 'Created endpoints' },
];

export const getTotalHoursToday = () => 2.5;
export const getTotalHoursThisWeek = () => 12.5;
export const getTotalHoursThisMonth = () => 45.0;
