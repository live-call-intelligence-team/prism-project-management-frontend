export const getUserStats = () => ({
    total: 120,
    active: 98,
    byRole: {
        ADMIN: 5,
        SCRUM_MASTER: 15,
        EMPLOYEE: 80,
        CLIENT: 20
    }
});

export const getUserGrowthData = () => [
    { month: 'Jan', users: 10 },
    { month: 'Feb', users: 20 },
    { month: 'Mar', users: 35 },
    { month: 'Apr', users: 60 },
    { month: 'May', users: 90 },
    { month: 'Jun', users: 120 }
];
