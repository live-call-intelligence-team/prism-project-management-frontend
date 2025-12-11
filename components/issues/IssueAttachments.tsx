'use client';

import { useState, useRef } from 'react';
import { issuesApi, IssueAttachment } from '@/lib/api/endpoints/issues';
import { Paperclip, X, File, FileText, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface IssueAttachmentsProps {
    issueId: string;
    initialAttachments?: IssueAttachment[];
}

export default function IssueAttachments({ issueId, initialAttachments = [] }: IssueAttachmentsProps) {
    const [attachments, setAttachments] = useState<IssueAttachment[]>(initialAttachments);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { success, error: toastError } = useToast();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        try {
            const newAttachment = await issuesApi.uploadAttachment(issueId, file);
            setAttachments(prev => [...prev, newAttachment]);
            success(`Uploaded ${file.name}`);
        } catch (error) {
            console.error(error);
            toastError('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;
        try {
            await issuesApi.deleteAttachment(id);
            setAttachments(prev => prev.filter(a => a.id !== id));
            success('Attachment deleted');
        } catch (error) {
            console.error(error);
            toastError('Failed to delete attachment');
        }
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.startsWith('image/')) return ImageIcon;
        if (mimetype === 'application/pdf') return FileText;
        return File;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                        {attachments.length}
                    </span>
                </h3>
            </div>

            <div className="p-6">
                {/* Upload Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-6",
                        isDragging
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                    )}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                        <UploadCloud className="w-8 h-8" />
                        <span className="text-sm font-medium">
                            {isUploading ? 'Uploading...' : 'Click or drag file to upload'}
                        </span>
                        <span className="text-xs">
                            (Images, PDF, Docx supported)
                        </span>
                    </div>
                </div>

                {/* Attachment List */}
                <div className="space-y-3">
                    {attachments.map((attachment) => {
                        const Icon = getFileIcon(attachment.mimetype);
                        return (
                            <div key={attachment.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {attachment.originalName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatSize(attachment.size)} • {new Date(attachment.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(attachment.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
