import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Send, MessageSquare, Loader2, MoreVertical, Check, CheckCheck, Smile, Reply, X, Mic, Square, Play, Pause, Image as ImageIcon } from 'lucide-react';
import { SendIcon } from '@/components/ui/animated-state-icons';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import codereelsLogo from '@/assets/codereels-logo.png';

interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message: string | null;
    last_message_at: string;
    other_user?: { name: string; avatar: string | null; user_id: string; last_seen?: string | null };
    unread_count?: number;
}

interface Reaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    message_reactions?: Reaction[];
    reply_to_message_id?: string | null;
    message_type?: string | null;
    shared_reel_id?: string | null;
    image_url?: string | null;
    is_pinned?: boolean;
    reels?: { title: string; thumbnail_url: string | null; video_url?: string | null } | null;
}

interface SearchUser {
    user_id: string;
    name: string;
    avatar: string | null;
    username: string | null;
}

export default function Messages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Message search state
    const [isSearchingMsg, setIsSearchingMsg] = useState(false);
    const [msgSearchQuery, setMsgSearchQuery] = useState('');
    const [msgSearchMatches, setMsgSearchMatches] = useState<number[]>([]);
    const [msgSearchIndex, setMsgSearchIndex] = useState(0);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await uploadAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("Microphone access denied or unavailable.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    const uploadAudio = async (blob: Blob) => {
        if (!user || !activeConvo) return;
        const fileName = `${user.id}-${Date.now()}.webm`;

        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('dm-audio')
                .upload(fileName, blob, { contentType: 'audio/webm' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('dm-audio')
                .getPublicUrl(fileName);

            const msgPayload = {
                conversation_id: activeConvo.id,
                sender_id: user.id,
                content: 'Voice message',
                message_type: 'voice',
                image_url: publicUrl,
                reply_to_message_id: replyingTo?.id || null,
            };

            const tempId = crypto.randomUUID();
            const tempMsg: Message = { ...msgPayload, id: tempId, created_at: new Date().toISOString(), is_read: false } as Message;
            setMessages(prev => [...prev, tempMsg]);

            const { error: dbError } = await supabase.from('dm_messages').insert(msgPayload);
            if (dbError) throw dbError;

            await supabase.from('conversations').update({ last_message: '🎤 Voice message', last_message_at: new Date().toISOString() }).eq('id', activeConvo.id);
            setReplyingTo(null);

        } catch (err: any) {
            console.error("Upload audio error:", err);
            toast.error("Failed to send voice message");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !activeConvo) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are allowed');
            return;
        }

        const fileName = `${user.id}-${Date.now()}-${file.name}`;
        setSending(true);

        try {
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('dm-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('dm-images')
                .getPublicUrl(fileName);

            const msgPayload = {
                conversation_id: activeConvo.id,
                sender_id: user.id,
                content: 'Image',
                message_type: 'image',
                image_url: publicUrl,
                reply_to_message_id: replyingTo?.id || null,
            };

            const tempId = crypto.randomUUID();
            const tempMsg: Message = { ...msgPayload, id: tempId, created_at: new Date().toISOString(), is_read: false } as Message;
            setMessages(prev => [...prev, tempMsg]);

            const { error: dbError } = await supabase.from('dm_messages').insert(msgPayload);
            if (dbError) throw dbError;

            await supabase.from('conversations').update({ last_message: '📸 Image', last_message_at: new Date().toISOString() }).eq('id', activeConvo.id);
            setReplyingTo(null);

        } catch (err: any) {
            console.error("Upload image error:", err);
            toast.error("Failed to send image");
        } finally {
            setSending(false);
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    // Fetch conversations
    const fetchConversations = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .order('last_message_at', { ascending: false });

        if (error) { console.error('Error fetching conversations:', error); return; }
        if (!data) { setConversations([]); setLoading(false); return; }

        // Enrich with other user's profile
        const enriched = await Promise.all(
            data.map(async (c: any) => {
                const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('user_id, name, avatar, last_seen')
                    .eq('user_id', otherId)
                    .single();

                // Count unread
                const { count } = await supabase
                    .from('dm_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', c.id)
                    .eq('is_read', false)
                    .neq('sender_id', user.id);

                return { ...c, other_user: prof || { name: 'User', avatar: null, user_id: otherId, last_seen: null }, unread_count: count || 0 };
            })
        );

        setConversations(enriched);
        setLoading(false);
    };

    // Fetch messages for active conversation
    const fetchMessages = async (convoId: string) => {
        setMessagesLoading(true);
        console.log('[DM DEBUG] Fetching messages for conversation:', convoId);
        const { data, error } = await supabase
            .from('dm_messages')
            .select('*, message_reactions(*), reels!dm_messages_shared_reel_id_fkey(*)')
            .eq('conversation_id', convoId)
            .order('created_at', { ascending: true });
        console.log('[DM DEBUG] Query result — data:', data?.length ?? 'null', 'error:', error);
        console.log('[DM DEBUG] fetchMessages returned:', { dataLen: data?.length, error });
        if (error) {
            console.error('[DM DEBUG] ERROR fetching messages:', error);
            setDebugInfo(JSON.stringify(error, null, 2));
        } else {
            setDebugInfo(data?.length === 0 ? "Query successful, but 0 messages returned from backend (Could be RLS policy)." : null);
        }
        if (data && data.length > 0) {
            console.log('[DM DEBUG] First message:', data[0].content, '| Last message:', data[data.length - 1].content);
        }
        setMessages((data as any) || []);
        setMessagesLoading(false);

        // Mark messages as read
        if (user) {
            await supabase
                .from('dm_messages')
                .update({ is_read: true })
                .eq('conversation_id', convoId)
                .neq('sender_id', user.id)
                .eq('is_read', false);
        }
    };

    // Search users
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length < 2) { setSearchResults([]); return; }
        setSearching(true);
        const { data } = await supabase
            .from('profiles')
            .select('user_id, name, avatar, username')
            .neq('user_id', user?.id || '')
            .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
            .limit(10);
        setSearchResults((data as SearchUser[]) || []);
        setSearching(false);
    };

    // Start or open conversation with user
    const startConversation = async (otherUserId: string) => {
        if (!user) return;

        // Check if conversation exists
        const existing = conversations.find(
            c => (c.participant_1 === otherUserId && c.participant_2 === user.id) ||
                (c.participant_1 === user.id && c.participant_2 === otherUserId)
        );

        if (existing) {
            openConversation(existing);
            setSearchQuery('');
            setSearchResults([]);
            return;
        }

        // Create new conversation
        const { data, error } = await supabase
            .from('conversations')
            .insert({ participant_1: user.id, participant_2: otherUserId })
            .select()
            .single();

        if (error) {
            // Might be a duplicate with reversed participants
            const { data: existing2 } = await supabase
                .from('conversations')
                .select('*')
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
                .single();

            if (existing2) {
                await fetchConversations();
                const conv = { ...existing2 } as Conversation;
                openConversation(conv);
            } else {
                toast.error('Could not start conversation');
            }
        } else if (data) {
            await fetchConversations();
            openConversation(data as Conversation);
        }

        setSearchQuery('');
        setSearchResults([]);
    };

    const openConversation = async (convo: Conversation) => {
        setActiveConvo(convo);
        setMobileShowChat(true);
        setMessages([]);
        setMessagesLoading(true);
        await fetchMessages(convo.id);
    };

    const deleteConversation = async (convoId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent clicking the conversation container row

        if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) return;

        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', convoId);

        if (error) {
            toast.error('Failed to delete conversation');
        } else {
            toast.success('Conversation deleted');
            if (activeConvo?.id === convoId) {
                setActiveConvo(null);
                setMobileShowChat(false);
            }
            setConversations(prev => prev.filter(c => c.id !== convoId));
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMsg(e.target.value);
        if (!activeConvo || !user) return;

        // Broadcast typing status
        const channel = supabase.channel(`dm-${activeConvo.id}`);
        channel.track({ typing: true, user_id: user.id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            channel.track({ typing: false, user_id: user.id });
        }, 2000);
    };

    // Send message
    const handleSend = async () => {
        if (!user || !activeConvo || !newMsg.trim()) return;
        setSending(true);
        const content = newMsg.trim();
        setNewMsg('');

        // Optimistic add
        const tempMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: activeConvo.id,
            sender_id: user.id,
            content,
            is_read: false,
            created_at: new Date().toISOString(),
            reply_to_message_id: replyingTo?.id || null,
            message_type: 'text',
        };
        setMessages(prev => [...prev, tempMsg]);
        setReplyingTo(null);

        const { error } = await supabase
            .from('dm_messages')
            .insert({ conversation_id: activeConvo.id, sender_id: user.id, content, reply_to_message_id: replyingTo?.id || null, message_type: 'text' });

        if (error) {
            toast.error('Failed to send message');
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        } else {
            // Update conversation last_message
            await supabase
                .from('conversations')
                .update({ last_message: content, last_message_at: new Date().toISOString() })
                .eq('id', activeConvo.id);
        }

        setSending(false);
        inputRef.current?.focus();
    };

    const toggleReaction = async (messageId: string, emoji: string) => {
        if (!user) return;
        const msg = messages.find(m => m.id === messageId);
        const existing = msg?.message_reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

        if (existing) {
            // Optimistic update
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_reactions: m.message_reactions?.filter(r => r.id !== existing.id) } : m));
            await supabase.from('message_reactions').delete().eq('id', existing.id);
        } else {
            // Optimistic update
            const tempId = crypto.randomUUID();
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_reactions: [...(m.message_reactions || []), { id: tempId, message_id: messageId, user_id: user.id, emoji }] } : m));
            await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
        }
    };

    const togglePin = async (msg: Message) => {
        if (!user) return;
        const newPinnedStatus = !msg.is_pinned;

        // Optimistic update
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: newPinnedStatus } : (newPinnedStatus ? { ...m, is_pinned: false } : m)));

        // If pinning, unpin others in this convo first
        if (newPinnedStatus) {
            await supabase.from('dm_messages')
                .update({ is_pinned: false })
                .eq('conversation_id', activeConvo?.id);
        }

        const { error } = await supabase.from('dm_messages')
            .update({ is_pinned: newPinnedStatus })
            .eq('id', msg.id);

        if (error) {
            console.error("Pin toggle error:", error);
            // Revert on error
            fetchMessages(activeConvo!.id);
        }
    };

    // Message Search Handlers
    useEffect(() => {
        if (!msgSearchQuery.trim()) {
            setMsgSearchMatches([]);
            setMsgSearchIndex(0);
            return;
        }

        const q = msgSearchQuery.toLowerCase();
        const matches: number[] = [];
        messages.forEach((msg, idx) => {
            if (msg.content && msg.content.toLowerCase().includes(q)) {
                matches.push(idx);
            }
        });

        setMsgSearchMatches(matches);
        if (matches.length > 0) {
            setMsgSearchIndex(matches.length - 1); // Start with latest match
            scrollToMatch(matches[matches.length - 1]);
        } else {
            setMsgSearchIndex(0);
        }
    }, [msgSearchQuery, messages]);

    const scrollToMatch = (idx: number) => {
        const msgId = messages[idx]?.id;
        if (msgId) {
            const el = document.getElementById(`msg-${msgId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('bg-primary/20');
                setTimeout(() => el.classList.remove('bg-primary/20'), 1500);
            }
        }
    };

    const nextMatch = () => {
        if (msgSearchMatches.length === 0) return;
        const newIdx = msgSearchIndex < msgSearchMatches.length - 1 ? msgSearchIndex + 1 : 0;
        setMsgSearchIndex(newIdx);
        scrollToMatch(msgSearchMatches[newIdx]);
    };

    const prevMatch = () => {
        if (msgSearchMatches.length === 0) return;
        const newIdx = msgSearchIndex > 0 ? msgSearchIndex - 1 : msgSearchMatches.length - 1;
        setMsgSearchIndex(newIdx);
        scrollToMatch(msgSearchMatches[newIdx]);
    };

    const highlightText = (text: string) => {
        if (!msgSearchQuery.trim()) return text;

        const regex = new RegExp(`(${msgSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-yellow-400/90 text-black px-0.5 rounded-sm">{part}</mark>
            ) : part
        );
    };

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial fetch
    useEffect(() => {
        fetchConversations();
    }, [user]);

    // Realtime subscription for messages
    useEffect(() => {
        if (!activeConvo) return;

        const channel = supabase
            .channel(`dm-${activeConvo.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'dm_messages',
                filter: `conversation_id=eq.${activeConvo.id}`,
            }, (payload) => {
                const newMessage = payload.new as Message;
                // Don't add if it's our own optimistic message
                setMessages(prev => {
                    if (prev.find(m => m.id === newMessage.id)) return prev;
                    // Also remove any temp messages with same content from same sender
                    const filtered = prev.filter(m =>
                        !(m.sender_id === newMessage.sender_id && m.content === newMessage.content && m.id !== newMessage.id)
                    );
                    return [...filtered, newMessage];
                });

                // Mark as read if from other user and chat is active
                if (user && newMessage.sender_id !== user.id) {
                    supabase.from('dm_messages').update({ is_read: true }).eq('id', newMessage.id).then(() => {
                        // Immediately update local state to reflect it's read so it doesn't stay unseen during stream.
                        setMessages(curr => curr.map(m => m.id === newMessage.id ? { ...m, is_read: true } : m));
                    });
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'dm_messages',
                filter: `conversation_id=eq.${activeConvo.id}`,
            }, (payload) => {
                const updatedFields = payload.new as Partial<Message>;
                setMessages(prev => prev.map(old =>
                    old.id === updatedFields.id
                        ? { ...old, ...updatedFields, message_reactions: old.message_reactions, reels: old.reels }
                        : old
                ));
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'message_reactions',
            }, () => {
                fetchMessages(activeConvo.id);
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const typing = new Set<string>();
                for (const key in state) {
                    // check if the state is true for typing event
                    if ((state[key][0] as any)?.typing && (state[key][0] as any)?.user_id) {
                        typing.add((state[key][0] as any).user_id);
                    }
                }
                setTypingUsers(typing);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && user) {
                    await channel.track({ typing: false, user_id: user.id });
                }
            });

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            supabase.removeChannel(channel);
        };
    }, [activeConvo?.id, user]);

    // Realtime for conversation list updates
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('dm-convos')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
            }, () => {
                fetchConversations();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d`;
        return d.toLocaleDateString();
    };

    const formatMessageTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const groupMessagesByDate = (msgs: Message[]) => {
        const groups: { date: string, messages: Message[] }[] = [];
        let currentDate = '';

        msgs.forEach(msg => {
            const date = new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            if (date !== currentDate) {
                currentDate = date;
                groups.push({ date, messages: [] });
            }
            groups[groups.length - 1].messages.push(msg);
        });

        return groups;
    };

    const formatLastSeen = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Offline';
        const d = new Date(dateStr);
        const diffMins = Math.floor((new Date().getTime() - d.getTime()) / 60000);
        if (diffMins < 2) return 'Online';
        if (diffMins < 60) return `Active ${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Active ${diffHours}h ago`;
        return `Active ${Math.floor(diffHours / 24)}d ago`;
    };

    if (!user) return <div className="flex items-center justify-center min-h-screen pt-16 text-muted-foreground">Login to view messages</div>;

    return (
        <div className="min-h-screen pt-16 pb-20 md:pb-0">
            <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex border-x border-border">

                {/* ── LEFT PANEL: Conversation list ── */}
                <div className={`w-full md:w-[360px] md:min-w-[360px] border-r border-border flex flex-col bg-background ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" /> Messages
                        </h2>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search users to message..."
                                className="pl-9 glass border-border text-sm"
                            />
                        </div>

                        {/* Search results dropdown */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 glass border border-border rounded-lg max-h-48 overflow-y-auto">
                                {searchResults.map((u) => (
                                    <button
                                        key={u.user_id}
                                        onClick={() => startConversation(u.user_id)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                                    >
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={u.avatar || undefined} />
                                            <AvatarFallback className="gradient-primary text-xs font-bold text-foreground">
                                                {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                                            {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {searching && <p className="text-xs text-muted-foreground mt-2">Searching...</p>}
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">No conversations yet</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Search for a user above to start chatting</p>
                            </div>
                        ) : (
                            conversations.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => openConversation(c)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-border/50 ${activeConvo?.id === c.id ? 'bg-primary/10' : 'hover:bg-muted/30'
                                        }`}
                                >
                                    <div className="relative">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={c.other_user?.avatar || undefined} />
                                            <AvatarFallback className="gradient-primary text-sm font-bold text-foreground">
                                                {c.other_user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {formatLastSeen(c.other_user?.last_seen) === 'Online' && (
                                            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        )}
                                        {(c.unread_count || 0) > 0 && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-foreground truncate">{c.other_user?.name || 'User'}</p>
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                                                {c.last_message_at ? formatTime(c.last_message_at) : ''}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate mt-0.5 ${(c.unread_count || 0) > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                            {c.last_message || 'Start chatting...'}
                                        </p>

                                        {/* Inline Sent/Seen tag beneath the last message preview, checking if unread is 0 means it's considered seen by them if we were the last ones adding... actually simpler to just display general UI seen status */}
                                    </div>

                                    <div className="ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-[#1a1a2e] border-border text-foreground">
                                                <DropdownMenuItem
                                                    onClick={(e) => deleteConversation(c.id, e as unknown as React.MouseEvent)}
                                                    className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
                                                >
                                                    Delete Conversation
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL: Chat view ── */}
                <div className={`flex-1 flex flex-col bg-background ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                    {activeConvo ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                <button
                                    onClick={() => { setMobileShowChat(false); setActiveConvo(null); }}
                                    className="md:hidden p-1 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-foreground" />
                                </button>
                                <Link to={`/profile/${activeConvo.other_user?.user_id}`} className="hover:opacity-80 transition-opacity">
                                    <Avatar className="w-9 h-9">
                                        <AvatarImage src={activeConvo.other_user?.avatar || undefined} />
                                        <AvatarFallback className="gradient-primary text-sm font-bold text-foreground">
                                            {activeConvo.other_user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div>
                                    <Link to={`/profile/${activeConvo.other_user?.user_id}`} className="hover:underline">
                                        <p className="text-sm font-semibold text-foreground">{activeConvo.other_user?.name || 'User'}</p>
                                    </Link>
                                    {typingUsers.has(activeConvo.other_user?.user_id || '') ? (
                                        <p className="text-xs text-primary animate-pulse">typing...</p>
                                    ) : (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {formatLastSeen(activeConvo.other_user?.last_seen) === 'Online' && (
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                            )}
                                            <p className="text-xs text-muted-foreground">{formatLastSeen(activeConvo.other_user?.last_seen)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {debugInfo && (
                                <div className="bg-red-900/50 border border-red-500 m-4 p-3 rounded text-xs text-red-200 font-mono whitespace-pre-wrap overflow-x-auto">
                                    <strong>Debug Info:</strong> {debugInfo}
                                </div>
                            )}

                            {/* Pinned Message Banner */}
                            {(() => {
                                const pinnedMsg = messages.find(m => m.is_pinned);
                                if (!pinnedMsg) return null;
                                return (
                                    <div
                                        className="bg-muted/40 border-b border-border/50 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors"
                                        onClick={() => {
                                            const el = document.getElementById(`msg-${pinnedMsg.id}`);
                                            if (el) {
                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                el.classList.add('bg-primary/20');
                                                setTimeout(() => el.classList.remove('bg-primary/20'), 1500);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-primary mt-0.5">📌</span>
                                            <div>
                                                <p className="text-[10px] font-bold text-primary uppercase tracker-wider">Pinned Message</p>
                                                <p className="text-xs text-muted-foreground truncate w-[250px] md:w-[400px]">
                                                    {pinnedMsg.message_type === 'voice' ? '🎤 Voice message' :
                                                        pinnedMsg.message_type === 'image' ? '📸 Image' :
                                                            pinnedMsg.message_type === 'reel' ? '🎬 Reel' :
                                                                pinnedMsg.content}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); togglePin(pinnedMsg); }}
                                            className="p-1 hover:bg-muted text-muted-foreground rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm text-muted-foreground">No messages yet. Say hi! 👋</p>
                                    </div>
                                ) : (
                                    <>
                                        {groupMessagesByDate(messages).map((group) => (
                                            <div key={group.date} className="space-y-3">
                                                <div className="flex justify-center my-4">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 bg-muted/20 px-3 py-1 rounded-full">{group.date}</span>
                                                </div>
                                                {group.messages.map((msg) => {
                                                    const isOwn = msg.sender_id === user?.id;
                                                    const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

                                                    return (
                                                        <div key={msg.id} id={`msg-${msg.id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative transition-all duration-500`}>
                                                            <div className="flex items-end gap-2 max-w-[75%] relative">
                                                                {!isOwn && (
                                                                    <Link to={`/profile/${activeConvo.other_user?.user_id}`}>
                                                                        <Avatar className="w-6 h-6 flex-shrink-0 hover:opacity-80 transition-opacity">
                                                                            <AvatarImage src={activeConvo.other_user?.avatar || undefined} />
                                                                            <AvatarFallback className="gradient-primary text-[10px] font-bold text-foreground">
                                                                                {activeConvo.other_user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    </Link>
                                                                )}
                                                                <div
                                                                    className={`px-3.5 py-2 text-sm leading-relaxed relative ${isOwn
                                                                        ? 'bg-[#00FF94] text-black rounded-2xl rounded-br-none'
                                                                        : 'bg-[#1a1a2e] text-white rounded-2xl rounded-bl-none'
                                                                        }`}
                                                                >
                                                                    {msg.reply_to_message_id && (
                                                                        <div className="mb-1 text-xs opacity-75 border-l-2 border-current pl-2 pb-1">
                                                                            <p className="font-semibold truncate max-w-[200px]">
                                                                                {messages.find(m => m.id === msg.reply_to_message_id)?.sender_id === user?.id ? 'You' : activeConvo.other_user?.name}
                                                                            </p>
                                                                            <p className="truncate max-w-[200px]">{messages.find(m => m.id === msg.reply_to_message_id)?.content || 'Message'}</p>
                                                                        </div>
                                                                    )}
                                                                    {msg.message_type === 'reel' && msg.reels ? (
                                                                        <Link to={`/reel/${msg.shared_reel_id}`} className="block w-40 h-56 rounded-lg overflow-hidden relative mb-1 border border-border/50 shadow-sm group/reel">
                                                                            {msg.reels.thumbnail_url ? (
                                                                                <img src={msg.reels.thumbnail_url} alt={msg.reels.title} className="w-full h-full object-cover opacity-90 group-hover/reel:opacity-100 transition-opacity" />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-muted/40 flex items-center justify-center">
                                                                                    <span className="text-xs text-muted-foreground font-semibold">Reel Video</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                                                                                <p className="text-white text-xs font-bold truncate">{msg.reels.title}</p>
                                                                            </div>
                                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                                <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center scale-90 group-hover/reel:scale-100 transition-transform shadow-lg">
                                                                                    <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-1"></div>
                                                                                </div>
                                                                            </div>
                                                                        </Link>
                                                                    ) : msg.message_type === 'voice' && msg.image_url ? (
                                                                        <div className="flex flex-col gap-1 min-w-[200px]">
                                                                            <audio src={msg.image_url} controls className="w-full h-10 opacity-90 invert hue-rotate-180 brightness-75 contrast-200" />
                                                                        </div>
                                                                    ) : msg.message_type === 'image' && msg.image_url ? (
                                                                        <img
                                                                            src={msg.image_url}
                                                                            alt="Shared image"
                                                                            className="max-w-[200px] md:max-w-[300px] rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                                            onClick={() => window.open(msg.image_url!, '_blank')}
                                                                        />
                                                                    ) : (
                                                                        <span className="whitespace-pre-wrap word-break">{highlightText(msg.content)}</span>
                                                                    )}
                                                                    <div className={`flex items-center gap-1 mt-1 justify-end ${isOwn ? 'text-black/60' : 'text-white/40'}`}>
                                                                        <p className="text-[10px]">{formatMessageTime(msg.created_at)}</p>
                                                                        {isOwn && (
                                                                            <span className="ml-1">
                                                                                {msg.is_read ? <CheckCheck className="w-3 h-3 text-emerald-700" /> : <Check className="w-3 h-3" />}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Reactions Display */}
                                                                    {(msg.message_reactions && msg.message_reactions.length > 0) && (
                                                                        <div className={`absolute -bottom-3 ${isOwn ? 'right-2' : 'left-2'} flex items-center gap-1 z-10`}>
                                                                            {Object.entries(
                                                                                msg.message_reactions.reduce((acc, r) => {
                                                                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                                    return acc;
                                                                                }, {} as Record<string, number>)
                                                                            ).map(([emoji, count]) => (
                                                                                <button
                                                                                    key={emoji}
                                                                                    onClick={() => toggleReaction(msg.id, emoji)}
                                                                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border border-border/50 shadow-sm ${msg.message_reactions?.some(r => r.user_id === user?.id && r.emoji === emoji) ? 'bg-primary/20 text-primary-foreground' : 'bg-background text-foreground'}`}
                                                                                >
                                                                                    <span>{emoji}</span>
                                                                                    {count > 1 && <span>{count}</span>}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Emoji & More options (appears on hover) */}
                                                                <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-24' : '-right-24'} opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1`}>
                                                                    <button
                                                                        onClick={() => setReplyingTo(msg)}
                                                                        className="p-1.5 rounded-full bg-background border border-border hover:bg-muted text-muted-foreground transition-colors"
                                                                    >
                                                                        <Reply className="w-4 h-4" />
                                                                    </button>

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="p-1.5 rounded-full bg-background border border-border hover:bg-muted text-muted-foreground transition-colors">
                                                                                <MoreVertical className="w-4 h-4" />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent side="top" align="center" className="bg-[#1a1a2e] border-border shrink-0 min-w-[120px]">
                                                                            <DropdownMenuItem onClick={() => togglePin(msg)} className="cursor-pointer">
                                                                                {msg.is_pinned ? 'Unpin Message' : 'Pin Message'}
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>

                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="p-1.5 rounded-full bg-background border border-border hover:bg-muted text-muted-foreground transition-colors">
                                                                                <Smile className="w-4 h-4" />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent side="top" align="center" className="flex items-center gap-1 p-1 min-w-0 bg-[#1a1a2e] border-border shrink-0">
                                                                            {quickEmojis.map(e => (
                                                                                <button
                                                                                    key={e}
                                                                                    onClick={() => toggleReaction(msg.id, e)}
                                                                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-lg"
                                                                                >
                                                                                    {e}
                                                                                </button>
                                                                            ))}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Input */}
                            <div className="flex flex-col border-t border-border mt-auto">
                                {replyingTo && (
                                    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 text-sm border-b border-border/50">
                                        <div className="border-l-2 border-primary pl-2 overflow-hidden">
                                            <p className="text-primary text-xs font-semibold">{replyingTo.sender_id === user?.id ? 'You' : activeConvo?.other_user?.name}</p>
                                            <p className="text-muted-foreground truncate text-xs">{replyingTo.content}</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <div className="p-3">
                                    <form
                                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                        className="flex items-center gap-2"
                                    >
                                        {isRecording ? (
                                            <div className="flex-1 flex items-center gap-4 px-4 py-2 glass border-border rounded-md text-red-500 font-semibold animate-pulse">
                                                <Mic className="w-4 h-4" />
                                                <span>Recording {formatDuration(recordingDuration)}</span>
                                                <div className="flex gap-1 h-3 ml-auto items-center">
                                                    <span className="w-1 h-full bg-red-500 animate-[bounce_1s_infinite]"></span>
                                                    <span className="w-1 h-full bg-red-500 animate-[bounce_1.2s_infinite]"></span>
                                                    <span className="w-1 h-full bg-red-500 animate-[bounce_0.8s_infinite]"></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <Input
                                                ref={inputRef}
                                                value={newMsg}
                                                onChange={(e) => setNewMsg(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 glass border-border"
                                                autoFocus
                                            />
                                        )}
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="rounded-full flex-shrink-0 hover:bg-muted text-muted-foreground transition-colors"
                                            onClick={() => imageInputRef.current?.click()}
                                        >
                                            <ImageIcon className="w-5 h-5 text-current" />
                                        </Button>
                                        <input
                                            type="file"
                                            ref={imageInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className={`rounded-full flex-shrink-0 transition-colors ${isRecording ? 'text-red-500 bg-red-500/20' : 'hover:bg-muted text-muted-foreground'}`}
                                            onPointerDown={startRecording}
                                            onPointerUp={stopRecording}
                                            onPointerLeave={stopRecording}
                                        >
                                            {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5 text-current" />}
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={sending || (!newMsg.trim() && !isRecording)}
                                            className="bg-white text-black hover:bg-white/90 flex-shrink-0 rounded-full w-9 h-9 flex items-center justify-center"
                                        >
                                            <SendIcon size={22} color="black" sending={sending} />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-24 h-24 mb-6 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden border-2 border-border/50">
                                <img src={codereelsLogo} alt="CodeReels Logo" className="w-16 h-16 opacity-50 grayscale object-contain" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Your Messages</h3>
                            <p className="text-sm text-muted-foreground max-w-[250px]">Select an existing conversation or search for a user to start a new chat seamlessly.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
