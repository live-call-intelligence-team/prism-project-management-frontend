
export const getVelocityData = () => {
    return [
        { sprint: 'Sprint 10', committed: 30, completed: 28 },
        { sprint: 'Sprint 11', committed: 35, completed: 32 },
        { sprint: 'Sprint 12', committed: 40, completed: 42 }, // High velocity
        { sprint: 'Sprint 13', committed: 38, completed: 35 },
    ];
};

export const getBurndownData = (sprintId: string) => {
    return [
        { day: 'Day 1', ideal: 100, actual: 100 },
        { day: 'Day 2', ideal: 90, actual: 95 },
        { day: 'Day 3', ideal: 80, actual: 85 },
        { day: 'Day 4', ideal: 70, actual: 75 },
        { day: 'Day 5', ideal: 60, actual: 55 }, // Better than ideal
        { day: 'Day 6', ideal: 50, actual: 50 },
        { day: 'Day 7', ideal: 40, actual: 45 },
        { day: 'Day 8', ideal: 30, actual: 35 },
        { day: 'Day 9', ideal: 20, actual: 20 },
        { day: 'Day 10', ideal: 10, actual: 5 },
        { day: 'Day 11', ideal: 0, actual: 0 },
    ];
};
