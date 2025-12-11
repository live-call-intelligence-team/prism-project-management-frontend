'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Archive, ArrowRight, XCircle } from 'lucide-react';
import { Epic, epicsApi } from '@/lib/api/endpoints/epics';
import Button from '@/components/ui/Button';

interface CloseEpicModalProps {
    isOpen: boolean;
    onClose: () => void;
    epic: Epic;
    onSuccess: () => void;
    projectId: string;
}

export function CloseEpicModal({ isOpen, onClose, epic, onSuccess, projectId }: CloseEpicModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [resolution, setResolution] = useState<'KEEP' | 'MOVE' | 'BACKLOG' | 'CANCEL'>('KEEP');
    const [targetEpicId, setTargetEpicId] = useState('');
    const [notes, setNotes] = useState('');
    const [epics, setEpics] = useState<Epic[]>([]);

    useEffect(() => {
        if (isOpen && resolution === 'MOVE') {
            loadEpics();
        }
    }, [isOpen, resolution]);

    const loadEpics = async () => {
        try {
            const data = await epicsApi.getAll(projectId);
            setEpics(data.filter(e => e.id !== epic.id && e.status !== 'CLOSED'));
        } catch (err) {
            console.error('Failed to load epics', err);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await epicsApi.close(epic.id, {
                resolution,
                targetEpicId: resolution === 'MOVE' ? targetEpicId : undefined,
                notes
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to close epic', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 rounded-t-xl">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="w-6 h-6" />
                                        Close Epic: {epic.key}
                                    </h2>
                                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <p className="text-gray-600 dark:text-gray-300">
                                    You are about to close <strong>{epic.name}</strong>. This will mark the epic as completed.
                                    What should happen to its incomplete features?
                                </p>

                                <div className="space-y-3">
                                    <label
                                        className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${resolution === 'KEEP' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <input type="radio" className="mt-1" checked={resolution === 'KEEP'} onChange={() => setResolution('KEEP')} />
                                        <div className="ml-3">
                                            <span className="font-semibold block text-gray-900 dark:text-white">Keep features active</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Features stay linked to this closed epic.</span>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${resolution === 'MOVE' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <input type="radio" className="mt-1" checked={resolution === 'MOVE'} onChange={() => setResolution('MOVE')} />
                                        <div className="ml-3 w-full">
                                            <span className="font-semibold block text-gray-900 dark:text-white">Move to another Epic</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Select a target epic for incomplete features.</span>
                                            {resolution === 'MOVE' && (
                                                <select
                                                    value={targetEpicId}
                                                    onChange={(e) => setTargetEpicId(e.target.value)}
                                                    className="mt-2 w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="">Select Epic...</option>
                                                    {epics.map(e => (
                                                        <option key={e.id} value={e.id}>{e.key} - {e.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${resolution === 'BACKLOG' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <input type="radio" className="mt-1" checked={resolution === 'BACKLOG'} onChange={() => setResolution('BACKLOG')} />
                                        <div className="ml-3">
                                            <span className="font-semibold block text-gray-900 dark:text-white">Move to Backlog (Standalone)</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Remove epic link, keep items active.</span>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${resolution === 'CANCEL' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <input type="radio" className="mt-1" checked={resolution === 'CANCEL'} onChange={() => setResolution('CANCEL')} />
                                        <div className="ml-3">
                                            <span className="font-semibold block text-gray-900 dark:text-white">Cancel Features</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Mark all incomplete features as Closed.</span>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Completion Notes
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-sans"
                                        placeholder="Summary of what was achieved..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                                <Button
                                    variant="danger"
                                    onClick={handleSubmit}
                                    isLoading={isLoading}
                                    disabled={resolution === 'MOVE' && !targetEpicId}
                                >
                                    Confirm Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
