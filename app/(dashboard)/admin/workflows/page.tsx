'use client';

import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function WorkflowsPage() {
    const workflows = [
        { id: '1', name: 'Bug Workflow', statuses: ['New', 'In Progress', 'Testing', 'Closed'], color: 'red', isDefault: true },
        { id: '2', name: 'Feature Workflow', statuses: ['Backlog', 'In Progress', 'Review', 'Done'], color: 'blue', isDefault: false },
        { id: '3', name: 'Task Workflow', statuses: ['To Do', 'In Progress', 'Done'], color: 'green', isDefault: false },
    ];

    return (
        <Container size="2xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Workflow Configuration
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Manage custom workflows and statuses
                        </p>
                    </div>
                    <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                        New Workflow
                    </Button>
                </div>

                {/* Workflows Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.map((workflow) => (
                        <Card key={workflow.id} className="hover-lift">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {workflow.name}
                                            {workflow.isDefault && (
                                                <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription>{workflow.statuses.length} statuses</CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {workflow.statuses.map((status, index) => (
                                        <div key={status} className="flex items-center gap-2">
                                            <span className={cn(
                                                'px-3 py-1 rounded-full text-xs font-medium',
                                                workflow.color === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                                                workflow.color === 'blue' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                                workflow.color === 'green' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            )}>
                                                {status}
                                            </span>
                                            {index < workflow.statuses.length - 1 && (
                                                <span className="text-gray-400">→</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Coming Soon */}
                <Card>
                    <CardHeader>
                        <CardTitle>Advanced Features</CardTitle>
                        <CardDescription>Additional workflow capabilities coming soon</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p>✓ Drag-and-drop status management</p>
                            <p>✓ Custom transition rules</p>
                            <p>✓ Automation triggers</p>
                            <p>✓ Visual workflow builder</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}
