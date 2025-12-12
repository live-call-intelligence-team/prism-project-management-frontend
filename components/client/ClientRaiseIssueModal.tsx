'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { issuesApi } from '@/lib/api/endpoints/issues';
import { useAuthStore } from '@/lib/store/authStore';
import {
    Bug,
    Lightbulb,
    HelpCircle,
    Wrench,
    AlertOctagon,
    AlertTriangle,
    AlertCircle,
    Info,
    Upload,
    CheckCircle2,
    X,
    File as FileIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';


interface ClientRaiseIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string; // Required context
    onSuccess: (issueId?: string) => void;
}

export function ClientRaiseIssueModal({ isOpen, onClose, projectId, onSuccess }: ClientRaiseIssueModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('BUG');
    const [priority, setPriority] = useState('MEDIUM');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [issueId, setIssueId] = useState<string | null>(null);

    const { user } = useAuthStore();

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            setAttachments((prev) => [...prev, ...acceptedFiles]);
        },
        maxFiles: 5,
        maxSize: 10485760, // 10MB
    });

    const removeFile = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            // 1. Create Issue
            const issueData = {
                title,
                description, // HTML content (now plain text)
                type: type as any,
                priority: priority as any,
                projectId,
                reporterId: user?.id,
                status: 'TODO' as any,
                isClientVisible: true,
                clientApprovalStatus: 'PENDING' as any
            };

            const createdIssue = await issuesApi.create(issueData);
            setIssueId(createdIssue.key); // Use Key for display like WEZU-13

            // 2. Upload Attachments
            if (attachments.length > 0) {
                await Promise.all(attachments.map(file =>
                    issuesApi.uploadAttachment(createdIssue.id, file)
                ));
            }

            setStep('success');
            setTimeout(() => {
                onClose();
                onSuccess(createdIssue.id);
                // Reset form
                setStep('form');
                setTitle('');
                setDescription('');
                setAttachments([]);
                setType('BUG');
                setPriority('MEDIUM');
            }, 5000);

        } catch (error) {
            console.error("Failed to raise issue", error);
            // In a real app, use a toast library here
            alert("Failed to raise issue. Please check your connection and attachments.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const IssueTypeOption = ({ value, label, icon: Icon, description }: any) => (
        <div
            onClick={() => setType(value)}
            className={`cursor-pointer p-4 rounded-lg border transition-all ${type === value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
        >
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${type === value ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`font-semibold ${type === value ? 'text-blue-700' : 'text-gray-700 dark:text-gray-300'}`}>
                    {label}
                </span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );

    const PriorityOption = ({ value, label, icon: Icon, colorClass, borderClass }: any) => (
        <div
            onClick={() => setPriority(value)}
            className={`cursor-pointer p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${priority === value
                ? `${borderClass} ring-1`
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
        >
            <Icon className={`w-6 h-6 ${colorClass}`} />
            <span className={`text-sm font-medium ${priority === value ? '' : 'text-gray-600'}`}>{label}</span>
        </div>
    );

    if (step === 'success') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Issue Raised">
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Issue Raised Successfully!</h2>
                    <p className="text-muted-foreground text-lg">
                        Your issue ID is: <span className="font-mono font-bold text-gray-900 dark:text-white">{issueId || '...'}</span>
                    </p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Your issue has been submitted to the project team. This window will close automatically.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <Button onClick={() => onSuccess(issueId!)}>View Issue</Button>
                        <Button variant="outline" onClick={() => {
                            setStep('form');
                            setTitle('');
                            setDescription('');
                            setAttachments([]);
                        }}>Raise Another Issue</Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🐛 Raise New Issue">
            <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
                {/* 1. Issue Type */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Issue Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <IssueTypeOption
                            value="BUG"
                            label="Bug"
                            icon={Bug}
                            description="Something isn't working as expected"
                        />
                        <IssueTypeOption
                            value="FEATURE"
                            label="Feature Request"
                            icon={Lightbulb}
                            description="Suggestion for new functionality"
                        />
                        <IssueTypeOption
                            value="SUPPORT"
                            label="Question"
                            icon={HelpCircle}
                            description="Need clarification or assistance"
                        />
                        <IssueTypeOption
                            value="TASK"
                            label="Improvement"
                            icon={Wrench}
                            description="Enhancement to existing feature"
                        />
                    </div>
                </div>

                {/* 2. Priority */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Priority <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                        <PriorityOption
                            value="CRITICAL"
                            label="Critical"
                            icon={AlertOctagon}
                            colorClass="text-red-600"
                            borderClass="border-red-500 bg-red-50"
                        />
                        <PriorityOption
                            value="HIGH"
                            label="High"
                            icon={AlertTriangle}
                            colorClass="text-orange-500"
                            borderClass="border-orange-500 bg-orange-50"
                        />
                        <PriorityOption
                            value="MEDIUM"
                            label="Medium"
                            icon={AlertCircle}
                            colorClass="text-yellow-500"
                            borderClass="border-yellow-500 bg-yellow-50"
                        />
                        <PriorityOption
                            value="LOW"
                            label="Low"
                            icon={Info}
                            colorClass="text-blue-500"
                            borderClass="border-blue-500 bg-blue-50"
                        />
                    </div>
                </div>

                {/* 3. Title */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Issue Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief description of the issue"
                        maxLength={100}
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="text-xs text-right text-gray-400">
                        {title.length} / 100 characters
                    </div>
                </div>

                {/* 4. Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Detailed Description <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 overflow-hidden">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-[200px] p-4 text-sm resize-none focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                            placeholder="Please provide details about the issue..."
                        />
                    </div>
                </div>

                {/* 5. Attachments */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                        Attachments (Optional)
                    </label>
                    <div
                        {...getRootProps()}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800/50"
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Drag & drop files or click to browse</p>
                        <p className="text-xs text-gray-400 mt-1">Screenshots, documents, logs. Max 5 files, 10MB each</p>
                    </div>

                    {/* File List */}
                    {attachments.length > 0 && (
                        <div className="space-y-2 mt-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border rounded-md">
                                    <div className="flex items-center gap-2 truncate">
                                        <FileIcon className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm truncate">{file.name}</span>
                                        <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900 z-10">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={!title.trim() || !description.trim() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                    >
                        Raise Issue
                    </Button>
                </div>
            </div>
        </Modal >
    );
}
