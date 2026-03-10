import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Send, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message: string | null;
    last_message_at: string;
    other_user?: { name: string; avatar: string | null; user_id: string };
    unread_count?: number;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
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
    const [newMsg, setNewMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
                    .select('user_id, name, avatar')
                    .eq('user_id', otherId)
                    .single();

                // Count unread
                const { count } = await supabase
                    .from('dm_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', c.id)
                    .eq('is_read', false)
                    .neq('sender_id', user.id);

                return { ...c, other_user: prof || { name: 'User', avatar: null, user_id: otherId }, unread_count: count || 0 };
            })
        );

        setConversations(enriched);
        setLoading(false);
    };

    // Fetch messages for active conversation
    const fetchMessages = async (convoId: string) => {
        const { data } = await supabase
            .from('dm_messages')
            .select('*')
            .eq('conversation_id', convoId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data as Message[]);

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
        await fetchMessages(convo.id);
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
        };
        setMessages(prev => [...prev, tempMsg]);

        const { error } = await supabase
            .from('dm_messages')
            .insert({ conversation_id: activeConvo.id, sender_id: user.id, content });

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

                // Mark as read if from other user
                if (user && newMessage.sender_id !== user.id) {
                    supabase.from('dm_messages').update({ is_read: true }).eq('id', newMessage.id).then(() => { });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeConvo?.id]);

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
                                <Avatar className="w-9 h-9">
                                    <AvatarImage src={activeConvo.other_user?.avatar || undefined} />
                                    <AvatarFallback className="gradient-primary text-sm font-bold text-foreground">
                                        {activeConvo.other_user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{activeConvo.other_user?.name || 'User'}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                {messages.map((msg) => {
                                    const isOwn = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className="flex items-end gap-2 max-w-[75%]">
                                                {!isOwn && (
                                                    <Avatar className="w-6 h-6 flex-shrink-0">
                                                        <AvatarImage src={activeConvo.other_user?.avatar || undefined} />
                                                        <AvatarFallback className="gradient-primary text-[10px] font-bold text-foreground">
                                                            {activeConvo.other_user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div
                                                    className={`px-3.5 py-2 text-sm leading-relaxed ${isOwn
                                                            ? 'bg-[#00FF94] text-black rounded-2xl rounded-br-none'
                                                            : 'bg-[#1a1a2e] text-white rounded-2xl rounded-bl-none'
                                                        }`}
                                                >
                                                    {msg.content}
                                                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-black/40' : 'text-white/40'}`}>
                                                        {formatTime(msg.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-border">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        ref={inputRef}
                                        value={newMsg}
                                        onChange={(e) => setNewMsg(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 glass border-border"
                                        autoFocus
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={sending || !newMsg.trim()}
                                        className="gradient-primary glow-primary flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                            <MessageSquare className="w-16 h-16 text-muted-foreground/20 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-1">Your Messages</h3>
                            <p className="text-sm text-muted-foreground">Select a conversation or search for a user to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
