'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Clock } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export default function SessionTimeoutModal() {
    const {
        showWarningModal,
        setShowWarningModal,
        timeRemaining,
        extendSession,
        handleLogout,
        formatTime,
    } = useSessionTimeout();

    return (
        <Modal
            isOpen={showWarningModal}
            onClose={() => { }} // Prevent closing by clicking outside
            title="Session Expiring Soon"
            description="Your session is about to expire due to inactivity"
            closeOnOverlayClick={false}
            showCloseButton={false}
            footer={
                <>
                    <Button variant="secondary" onClick={handleLogout}>
                        Logout Now
                    </Button>
                    <Button variant="primary" onClick={extendSession}>
                        Extend Session
                    </Button>
                </>
            }
        >
            <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-warning-600 dark:text-warning-400" />
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your session will expire in
                </p>

                <div className="text-5xl font-bold text-warning-600 dark:text-warning-400 mb-4">
                    {formatTime(timeRemaining)}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click "Extend Session" to stay logged in
                </p>
            </div>
        </Modal>
    );
}
