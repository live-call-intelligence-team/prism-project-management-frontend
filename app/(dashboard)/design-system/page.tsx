'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { LoadingSpinner, LoadingState, Skeleton } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import Container from '@/components/ui/Container';
import { Mail, Lock, Plus, Search, Inbox, CheckCircle2 } from 'lucide-react';

export default function DesignSystemPage() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const { toasts, success, error, warning, info, close } = useToast();

    return (
        <div className="min-h-screen bg-background py-12">
            <Container size="2xl">
                <div className="space-y-12">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Design System Showcase
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Professional UI components for the JIRA-like project management system
                        </p>
                    </div>

                    {/* Buttons */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            Buttons
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Variants
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    <Button variant="primary">Primary Button</Button>
                                    <Button variant="secondary">Secondary Button</Button>
                                    <Button variant="danger">Danger Button</Button>
                                    <Button variant="ghost">Ghost Button</Button>
                                    <Button variant="outline">Outline Button</Button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Sizes
                                </h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    <Button size="sm">Small</Button>
                                    <Button size="md">Medium</Button>
                                    <Button size="lg">Large</Button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    With Icons
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    <Button leftIcon={<Plus className="w-4 h-4" />}>Create Project</Button>
                                    <Button variant="secondary" rightIcon={<Search className="w-4 h-4" />}>
                                        Search
                                    </Button>
                                    <Button variant="outline" leftIcon={<Mail className="w-4 h-4" />}>
                                        Send Email
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    States
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    <Button isLoading>Loading</Button>
                                    <Button disabled>Disabled</Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Inputs */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            Input Fields
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                leftIcon={<Mail className="w-5 h-5" />}
                            />
                            <Input
                                label="Password"
                                type="password"
                                placeholder="Enter password"
                                leftIcon={<Lock className="w-5 h-5" />}
                                showPasswordToggle
                            />
                            <Input
                                label="With Error"
                                placeholder="Enter value"
                                error="This field is required"
                            />
                            <Input
                                label="With Success"
                                placeholder="Valid input"
                                success
                                defaultValue="john@example.com"
                            />
                            <Input
                                label="With Helper Text"
                                placeholder="Enter username"
                                helperText="Choose a unique username"
                            />
                            <Input
                                label="Disabled"
                                placeholder="Disabled input"
                                disabled
                            />
                        </div>
                    </section>

                    {/* Cards */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            Cards
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Default Card</CardTitle>
                                    <CardDescription>Standard card with border</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        This is the default card variant with a subtle border.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card variant="elevated">
                                <CardHeader>
                                    <CardTitle>Elevated Card</CardTitle>
                                    <CardDescription>Card with shadow elevation</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        This card uses shadow for elevation effect.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card hover>
                                <CardHeader>
                                    <CardTitle>Hover Card</CardTitle>
                                    <CardDescription>Interactive card with hover effect</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Hover over this card to see the lift effect.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button size="sm">Action</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </section>

                    {/* Modal & Toast */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            Modal & Toast
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                            <Button variant="secondary" onClick={() => success('Success!', 'Operation completed successfully')}>
                                Show Success Toast
                            </Button>
                            <Button variant="danger" onClick={() => error('Error!', 'Something went wrong')}>
                                Show Error Toast
                            </Button>
                            <Button variant="outline" onClick={() => warning('Warning!', 'Please review this action')}>
                                Show Warning Toast
                            </Button>
                            <Button variant="ghost" onClick={() => info('Info', 'Here is some information')}>
                                Show Info Toast
                            </Button>
                        </div>

                        <Modal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            title="Example Modal"
                            description="This is a demonstration of the modal component"
                            footer={
                                <>
                                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => setIsModalOpen(false)}>
                                        Confirm
                                    </Button>
                                </>
                            }
                        >
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-400">
                                    This modal demonstrates the professional design with smooth animations,
                                    backdrop blur, and keyboard support (press Escape to close).
                                </p>
                                <Input label="Example Input" placeholder="Enter something..." />
                            </div>
                        </Modal>
                    </section>

                    {/* Loading States */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            Loading States
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Spinners
                                </h3>
                                <div className="flex items-center gap-6">
                                    <LoadingSpinner size="sm" />
                                    <LoadingSpinner size="md" />
                                    <LoadingSpinner size="lg" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Skeletons
                                </h3>
                                <div className="space-y-3 max-w-md">
                                    <Skeleton variant="text" />
                                    <Skeleton variant="text" width="80%" />
                                    <Skeleton variant="text" width="60%" />
                                    <div className="flex items-center gap-4">
                                        <Skeleton variant="circular" width={48} height={48} />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="text" />
                                            <Skeleton variant="text" width="70%" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Loading Presets
                                </h3>
                                <LoadingState count={2} type="card" />
                            </div>
                        </div>
                    </section>

                    {/* Empty States */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            Empty States
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <EmptyState
                                    icon={Inbox}
                                    title="No messages"
                                    description="You don't have any messages yet. Start a conversation to get started."
                                />
                            </Card>
                            <Card>
                                <EmptyState
                                    icon={CheckCircle2}
                                    title="All caught up!"
                                    description="You've completed all your tasks. Great job!"
                                    action={{
                                        label: 'Create New Task',
                                        onClick: () => success('Task created!'),
                                    }}
                                />
                            </Card>
                        </div>
                    </section>

                    {/* Color Palette */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            Color Palette
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-primary-500" />
                                <p className="text-sm font-medium">Primary</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-secondary-500" />
                                <p className="text-sm font-medium">Secondary</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-success-500" />
                                <p className="text-sm font-medium">Success</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-warning-500" />
                                <p className="text-sm font-medium">Warning</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-danger-500" />
                                <p className="text-sm font-medium">Danger</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-accent-purple" />
                                <p className="text-sm font-medium">Purple</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-accent-teal" />
                                <p className="text-sm font-medium">Teal</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-20 rounded-lg bg-accent-amber" />
                                <p className="text-sm font-medium">Amber</p>
                            </div>
                        </div>
                    </section>
                </div>
            </Container>

            {/* Toast Container */}
            <ToastContainer toasts={toasts} onClose={close} />
        </div>
    );
}
