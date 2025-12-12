'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
    ArrowLeft,
    Users,
    CheckCircle2,
    FileText,
    MessageSquare,
    Briefcase,
    Download,
    Battery,
    BatteryWarning,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api/endpoints/projects';
import { ProjectOverviewTab } from '@/components/client/ProjectOverviewTab';
import { ClientIssueList } from '@/components/client/ClientIssueList';
import { ProjectFileBrowser } from '@/components/projects/ProjectFileBrowser';
import { ClientTeamList } from '@/components/client/ClientTeamList';
import { ProjectActivityTab } from '@/components/client/ProjectActivityTab';
import { ClientRaiseIssueModal } from '@/components/client/ClientRaiseIssueModal';

type TabType = 'overview' | 'tasks' | 'files' | 'team' | 'activity';

export default function ClientProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRaiseIssueModalOpen, setIsRaiseIssueModalOpen] = useState(false);

    useEffect(() => {
        const fetchProjectDetail = async () => {
            try {
                const projectData = await projectsApi.getClientProjectDetail(projectId);
                setProject(projectData);
            } catch (error) {
                console.error('Failed to fetch project details', error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProjectDetail();
        }
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
                        <p className="text-muted-foreground mb-4">
                            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                        </p>
                        <Link href="/client/dashboard">
                            <Button>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Briefcase },
        { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
        { id: 'files', label: 'Files', icon: FileText },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'activity', label: 'Activity', icon: MessageSquare },
    ];

    const getBatteryHealth = () => {
        // Calculate Battery Health
        if (!project) return null;

        // Critical: Overdue or Budget Exceeded (if we had actuals)
        const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'COMPLETED';
        const hasManyPending = project.stats?.pendingApprovals > 5;

        if (isOverdue) {
            return {
                status: 'Critical',
                icon: BatteryWarning,
                color: 'text-red-500',
                bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
            };
        }

        if (hasManyPending) {
            return {
                status: 'At Risk',
                icon: Battery,
                color: 'text-amber-500',
                bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30'
            };
        }

        return {
            status: 'Healthy',
            icon: Zap, // Zap looks more "energetic" than BatteryCharging sometimes, or use BatteryCharging
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
        };
    };

    const battery = getBatteryHealth();




    // ... (rest of logic) ...

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            {/* Back Button */}
            <Link
                href="/client/dashboard"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>

            {/* Project Header */}
            <Card className="border-l-4 border-l-primary overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {project.status.replace('_', ' ')}
                                </Badge>
                                <span className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-1 rounded border">
                                    {project.key}
                                </span>
                                {battery && (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded border ${battery.bg}`}>
                                        <battery.icon className={`h-4 w-4 ${battery.color}`} />
                                        <span className={`text-sm font-medium ${battery.color}`}>
                                            {battery.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                            {project.description && (
                                <p className="text-muted-foreground text-lg">{project.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105" onClick={() => setIsRaiseIssueModalOpen(true)}>
                                <Zap className="mr-2 h-4 w-4" />
                                Raise Issue
                            </Button>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Report
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {project.stats?.progress || 0}%
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Overall Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {project.stats?.inProgressIssues || 0}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">In Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {project.stats?.completedIssues || 0}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600">
                                {project.stats?.pendingApprovals || 0}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Pending Review</div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Tab Navigation */}
            <div className="border-b">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all
                                    border-b-2 whitespace-nowrap
                                    ${isActive
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && <ProjectOverviewTab project={project} />}
                {activeTab === 'tasks' && <ClientIssueList projectId={projectId} />}
                {activeTab === 'files' && (
                    <ProjectFileBrowser
                        projectId={projectId}
                        attachments={project.attachments || []}
                        onUploadSuccess={(newFile) => {
                            setProject({
                                ...project,
                                attachments: [...(project.attachments || []), newFile]
                            });
                        }}
                    />
                )}
                {activeTab === 'team' && <ClientTeamList projectId={projectId} />}
                {activeTab === 'activity' && <ProjectActivityTab projectId={projectId} />}
            </div>

            <ClientRaiseIssueModal
                isOpen={isRaiseIssueModalOpen}
                onClose={() => setIsRaiseIssueModalOpen(false)}
                projectId={projectId}
                onSuccess={(newIssueId) => {
                    // Switch to tasks tab to show the new issue
                    setActiveTab('tasks');

                    // Refresh project data to update stats
                    const fetchProjectDetail = async () => {
                        try {
                            const projectData = await projectsApi.getClientProjectDetail(projectId);
                            setProject(projectData);
                        } catch (error) {
                            console.error('Failed to refresh project details', error);
                        }
                    };
                    fetchProjectDetail();
                }}
            />
        </div>
    );
}
