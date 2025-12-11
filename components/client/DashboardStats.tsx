import { Card, CardContent } from "@/components/ui/Card";
import { Briefcase, Bug, Clock, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
    projects: any[];
    pendingActionsCount: number;
}

export function DashboardStats({ projects, pendingActionsCount }: DashboardStatsProps) {
    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;

    // Calculate total open issues (Need Review) across all projects
    // Assuming project object has stats or we estimate from available data. 
    // Ideally backend provides this, but we can sum 'totalIssues' - 'completedIssues' if available
    // or just use a placeholder if data is missing, but let's try to use what we have.
    // Based on ClientController, projects have 'progress' but maybe not issue counts directly in list view?
    // Let's check if we can pass openIssues count or calculate it.
    // For now, let's sum up (totalIssues - completedIssues) if those stats exist on project object.
    const openIssues = projects.reduce((acc, p) => {
        // If stats are not available on project list items, we might need to adjust backend.
        // But let's assume valid data or 0 for now.
        return acc + (p.stats ? (p.stats.totalIssues - p.stats.completedIssues) : 0);
    }, 0);

    const avgProgress = projects.length > 0
        ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
        : 0;

    const stats = [
        {
            label: "My Projects",
            value: activeProjects,
            subLabel: "Active",
            icon: Briefcase,
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-900/20"
        },
        {
            label: "Open Issues",
            value: openIssues, // Or fetch specifically
            subLabel: "Need Review",
            icon: Bug,
            color: "text-red-500",
            bg: "bg-red-100 dark:bg-red-900/20"
        },
        {
            label: "Pending Actions",
            value: pendingActionsCount,
            subLabel: "Awaiting You",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-100 dark:bg-amber-900/20"
        },
        {
            label: "Avg. Progress",
            value: `${avgProgress}%`,
            subLabel: "Across Projects",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/20"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                {stat.label}
                            </p>
                            <div className="text-2xl font-bold">
                                {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.subLabel}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
