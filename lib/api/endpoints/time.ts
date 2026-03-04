import apiClient from '../client';

export type TimeSummaryPeriod = 'daily' | 'weekly' | 'monthly';

export interface TimeSummary {
    period: TimeSummaryPeriod;
    totalHours: number;
    raw: unknown;
}

const coerceHoursFromSummary = (summary: unknown): number => {
    if (!summary || typeof summary !== 'object') return 0;
    const normalized = summary as Record<string, unknown>;

    const hourCandidates = [
        normalized.totalHours,
        normalized.hours,
        normalized.durationHours,
        normalized.totalDurationHours,
        normalized.total,
    ];

    for (const value of hourCandidates) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }

    const minuteCandidates = [normalized.totalMinutes, normalized.minutes, normalized.durationMinutes];
    for (const value of minuteCandidates) {
        const n = Number(value);
        if (Number.isFinite(n)) return n / 60;
    }

    const secondCandidates = [normalized.totalSeconds, normalized.seconds, normalized.durationSeconds];
    for (const value of secondCandidates) {
        const n = Number(value);
        if (Number.isFinite(n)) return n / 3600;
    }

    if (normalized.summary && typeof normalized.summary === 'object') {
        return coerceHoursFromSummary(normalized.summary);
    }

    return 0;
};

const PERIODS: TimeSummaryPeriod[] = ['daily', 'weekly', 'monthly'];

export const timeApi = {
    getSummary: async (period: TimeSummaryPeriod): Promise<TimeSummary> => {
        if (!PERIODS.includes(period)) {
            throw new Error('Invalid period. Use daily, weekly, or monthly.');
        }

        const response = await apiClient.get(`/time/time-entries/summary/${period}`);
        const data = response.data?.data ?? response.data;

        return {
            period,
            totalHours: coerceHoursFromSummary(data),
            raw: data,
        };
    },
};
