'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';

interface FileUploaderProps {
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number; // in bytes
}

export default function FileUploader({ onFilesChange, maxFiles = 5, maxSize = 10485760 }: FileUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => {
            const newFiles = [...prev, ...acceptedFiles].slice(0, maxFiles);
            onFilesChange(newFiles);
            return newFiles;
        });
    }, [maxFiles, onFilesChange]);

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = prev.filter((_, i) => i !== index);
            onFilesChange(newFiles);
            return newFiles;
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize,
        maxFiles: maxFiles - files.length,
        disabled: files.length >= maxFiles
    });

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                    ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <UploadCloud className={`w-6 h-6 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Max size {maxSize / 1024 / 1024}MB per file.
                        </p>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                    {file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-purple-500" /> : <FileText className="w-5 h-5 text-blue-500" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(i)}
                                className="text-gray-400 hover:text-red-500 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
