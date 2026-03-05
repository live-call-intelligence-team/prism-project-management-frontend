'use client';

import { useSearchParams } from 'next/navigation';
import TeamPerformanceView from '@/components/client/TeamPerformanceView';
import { Users } from 'lucide-react';

export default function TeamPerformancePage() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId') || '';

    if (!projectId) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-lg font-semibold mb-2">No Project Selected</h2>
                <p className="text-sm">Select a project from your dashboard to view team performance.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Users className="w-7 h-7 text-primary-500" />
                    Team Performance
                </h1>
                <p className="text-sm text-gray-500 mt-1">Track individual employee work and team productivity</p>
            </div>
            <TeamPerformanceView projectId={projectId} />
        </div>
    );
}
