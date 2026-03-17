import { useEffect, useRef } from 'react';
import { UserPlus, Repeat2 } from 'lucide-react';
import { HeartIcon } from '@/components/ui/animated-state-icons';
import { motion } from 'framer-motion';
import AnimatedList from './effects/AnimatedList';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationPanelProps {
    notifications: Notification[];
    onClose: () => void;
    onOpen: () => void;
}

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getIcon(type: string) {
    switch (type) {
        case 'like':
            return <HeartIcon size={16} color="rgb(248 113 113)" filled={true} className="flex-shrink-0" />;
        case 'follow':
            return <UserPlus className="w-4 h-4 text-blue-400 flex-shrink-0" />;
        case 'repost':
            return <Repeat2 className="w-4 h-4 text-green-400 flex-shrink-0" />;
        default:
            return <HeartIcon size={16} color="hsl(var(--muted-foreground))" className="flex-shrink-0" />;
    }
}

export default function NotificationPanel({ notifications, onClose, onOpen }: NotificationPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    // Mark all read when panel opens
    useEffect(() => {
        onOpen();
    }, []);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Delay to avoid the bell click itself triggering close
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [onClose]);

    return (
        <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                zIndex: 1000,
            }}
        >
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>Notifications</p>
            </div>

            {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <p style={{ color: '#AAAAAA', fontSize: '13px' }}>No notifications yet</p>
                </div>
            ) : (
                <AnimatedList>
                    {notifications.map(n => (
                        <div
                            key={n.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                backgroundColor: !n.is_read ? 'rgba(255,255,255,0.04)' : 'transparent',
                            }}
                        >
                            <div style={{ marginTop: '2px' }}>
                                {getIcon(n.type)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: '#fff', fontSize: '13px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                    {n.message}
                                </p>
                                <p style={{ color: '#AAAAAA', fontSize: '11px', marginTop: '4px' }}>
                                    {timeAgo(n.created_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                </AnimatedList>
            )}
        </motion.div>
    );
}
