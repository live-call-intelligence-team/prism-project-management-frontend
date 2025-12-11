'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { projectsApi } from '@/lib/api/endpoints/projects';
import {
    FileText,
    Upload,
    Download,
    File as FileIcon,
    Image as ImageIcon,
    Loader2,
    FolderOpen,
    User,
    Shield,
    LayoutGrid,
    List
} from 'lucide-react';
import { format } from 'date-fns';

interface ProjectFileBrowserProps {
    projectId: string;
    attachments: any[];
    onUploadSuccess: (newAttachment: any) => void;
}

export function ProjectFileBrowser({ projectId, attachments, onUploadSuccess }: ProjectFileBrowserProps) {
    const [uploading, setUploading] = useState(false);
    const [activeSection, setActiveSection] = useState<'all' | 'client' | 'project'>('all');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        // Upload files sequentially
        for (const file of acceptedFiles) {
            try {
                const attachment = await projectsApi.uploadAttachment(projectId, file);
                onUploadSuccess(attachment);
            } catch (error) {
                console.error(`Failed to upload ${file.name}`, error);
                // Ideally add toast notification here
            }
        }
        setUploading(false);
    }, [projectId, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const getIcon = (mimetype: string) => {
        if (mimetype.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (mimetype.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        return <FileIcon className="w-8 h-8 text-blue-500" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Filter attachments
    const clientFiles = attachments.filter(a => a.uploader?.role === 'CLIENT');
    const projectFiles = attachments.filter(a => a.uploader?.role !== 'CLIENT');

    const displayedFiles = activeSection === 'all' ? attachments
        : activeSection === 'client' ? clientFiles
            : projectFiles;

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // ... (rest of logic) ...

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
                <div>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        Files & Documents
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage project files and client uploads
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Upload Button */}
                    <div>
                        <input {...getInputProps()} />
                        <Button
                            onClick={() => document.getElementById('dropzone-input')?.click()}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            Upload
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Drag & Drop Zone */}
                <div
                    {...getRootProps()}
                    className={`
                        mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}
                    `}
                >
                    <input {...getInputProps()} id="dropzone-input" />
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className={`p-3 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Upload className={`w-6 h-6 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <p className="font-medium">
                                {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Support for images, PDF, and documents (Max 10MB)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-4 border-b mb-6 overflow-x-auto">
                    {/* ... existing tabs logic ... */}
                    <button
                        onClick={() => setActiveSection('all')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === 'all'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        All Files ({attachments.length})
                    </button>
                    <button
                        onClick={() => setActiveSection('project')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === 'project'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Project Deliverables ({projectFiles.length})
                    </button>
                    <button
                        onClick={() => setActiveSection('client')}
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === 'client'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Client Uploads ({clientFiles.length})
                    </button>
                </div>

                {/* Files Display */}
                {displayedFiles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No files found in this section</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedFiles.map((file) => (
                            <div
                                key={file.id}
                                className="group relative flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-all bg-white dark:bg-gray-800"
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {getIcon(file.mimetype)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate" title={file.originalName}>
                                        {file.originalName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                            {file.uploader?.role === 'CLIENT' ? (
                                                <User className="h-3 w-3" />
                                            ) : (
                                                <Shield className="h-3 w-3" />
                                            )}
                                            {file.uploader ? `${file.uploader.firstName}` : 'Unknown'}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatSize(file.size)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(file.createdAt), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-gray-800 shadow-sm rounded-md p-1 border">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-primary">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // List View
                    <div className="border rounded-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-muted-foreground border-b uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Size</th>
                                        <th className="px-4 py-3 font-medium">Uploaded By</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {displayedFiles.map((file) => (
                                        <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {getIcon(file.mimetype)}
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]" title={file.originalName}>
                                                        {file.originalName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                {formatSize(file.size)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                                                    {file.uploader?.role === 'CLIENT' ? <User className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                                    {file.uploader ? file.uploader.firstName : 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                {format(new Date(file.createdAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
