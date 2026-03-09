import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, Video, Heart, UserPlus, Search,
  Trash2, ShieldCheck, Ban, Radio, LayoutDashboard,
  CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

type Tab = 'dashboard' | 'users' | 'reels' | 'broadcast';

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Stats
  const [stats, setStats] = useState({ users: 0, reels: 0, likes: 0, follows: 0 });

  // Users Tab
  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');

  // Reels Tab
  const [reels, setReels] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterReported, setFilterReported] = useState('all'); // 'all' | 'true' | 'false'

  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      // Allow access if role is admin. For users seeing this commit before the migration, 
      // check if profile has it.
      if (!user) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (data?.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await fetchDashboardStats();
      setLoading(false);
    };
    checkAdminAndFetch();
  }, [user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'reels') fetchReels();
  }, [activeTab, isAdmin]);

  // --- Fetching Logic ---
  const fetchDashboardStats = async () => {
    const pCount = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const rCount = await supabase.from('reels').select('*', { count: 'exact', head: true });
    const lCount = await supabase.from('reel_likes').select('*', { count: 'exact', head: true });
    const fCount = await supabase.from('follows').select('*', { count: 'exact', head: true });

    setStats({
      users: pCount.count || 0,
      reels: rCount.count || 0,
      likes: lCount.count || 0,
      follows: fCount.count || 0
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const fetchReels = async () => {
    const { data } = await supabase
      .from('reels')
      .select(`
        *,
        uploader:profiles!reels_uploaded_by_fkey ( username )
      `)
      .order('created_at', { ascending: false });
    if (data) setReels(data);
  };

  // --- Users Actions ---
  const toggleVerify = async (userId: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_verified_creator: !current }).eq('user_id', userId);
    if (!error) {
      toast.success(`User ${!current ? 'verified' : 'unverified'}`);
      fetchUsers();
    } else {
      toast.error('Failed to update verification status');
    }
  };

  const toggleBlock = async (userId: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !current }).eq('user_id', userId);
    if (!error) {
      toast.success(`User ${!current ? 'blocked' : 'unblocked'}`);
      fetchUsers();
    } else {
      toast.error('Failed to update block status');
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user @${username}? This deletes all their data and reels.`)) return;

    // Deleting from profiles will cascade delete reels if DB is configured that way,
    // otherwise we manually delete reels first to save storage.
    const { data: userReels } = await supabase.from('reels').select('id, video_url, thumbnail_url').eq('uploaded_by', userId);

    if (userReels && userReels.length > 0) {
      for (const r of userReels) {
        await deleteReelAssets(r);
      }
      await supabase.from('reels').delete().eq('uploaded_by', userId);
    }

    const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
    if (error) {
      toast.error('Failed to delete profile: ' + error.message);
    } else {
      toast.success('User and data deleted');
      fetchUsers();
      fetchDashboardStats();
    }
  };

  // --- Reels Actions ---
  const deleteReelAssets = async (r: any) => {
    const filesToRemove = [];
    if (r.video_url?.includes('supabase.co')) {
      const vName = r.video_url.split('/').pop();
      if (vName) filesToRemove.push(vName);
    }
    if (r.thumbnail_url?.includes('supabase.co')) {
      const tName = r.thumbnail_url.split('/').pop();
      if (tName) filesToRemove.push(tName);
    }
    if (filesToRemove.length > 0) {
      await supabase.storage.from('reels').remove(filesToRemove);
    }
  };

  const deleteReel = async (r: any) => {
    if (!window.confirm(`Delete reel "${r.title}" permanently?`)) return;
    await deleteReelAssets(r);
    const { error } = await supabase.from('reels').delete().eq('id', r.id);
    if (error) {
      toast.error('Failed to delete reel');
    } else {
      toast.success('Reel deleted');
      fetchReels();
      fetchDashboardStats();
    }
  };

  const toggleFeature = async (id: string, current: boolean) => {
    const { error } = await supabase.from('reels').update({ is_featured: !current }).eq('id', id);
    if (!error) {
      toast.success(`Reel ${!current ? 'featured' : 'un-featured'}`);
      fetchReels();
    } else {
      toast.error('Failed to update feature status');
    }
  };

  // --- Broadcast ---
  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    if (!window.confirm('Send this notification to ALL users?')) return;
    setBroadcasting(true);

    try {
      const { data: allUsers, error: usersErr } = await supabase.from('profiles').select('user_id');
      if (usersErr) throw usersErr;

      if (allUsers && allUsers.length > 0) {
        const notifications = allUsers.map(u => ({
          user_id: u.user_id,
          type: 'admin_broadcast',
          message: broadcastMsg,
          is_read: false
        }));

        // BATCH INSERT
        const { error: notifErr } = await supabase.from('notifications').insert(notifications);
        if (notifErr) throw notifErr;

        toast.success(`Broadcast sent to ${allUsers.length} users!`);
        setBroadcastMsg('');
      } else {
        toast.error('No users found to broadcast to');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Broadcast failed: ' + err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-16 bg-[#0A0A0A]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const filteredUsers = users.filter(u =>
    (u.username?.toLowerCase() || '').includes(searchUser.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchUser.toLowerCase())
  );

  const filteredReels = reels.filter(r => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterReported === 'true' && !r.is_reported) return false;
    if (filterReported === 'false' && r.is_reported) return false;
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A] pt-[60px]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-white/5 hidden md:flex flex-col z-10">
        <div className="p-6">
          <h2 className="text-xl font-bold gradient-text tracking-tight">Admin<span className="text-white">Panel</span></h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Users} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <SidebarItem icon={Video} label="Reels" active={activeTab === 'reels'} onClick={() => setActiveTab('reels')} />
          <SidebarItem icon={Radio} label="Broadcast" active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} />
        </nav>
      </aside>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-white/5 flex justify-around p-2 z-50">
        <MobileNavItem icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={Users} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <MobileNavItem icon={Video} active={activeTab === 'reels'} onClick={() => setActiveTab('reels')} />
        <MobileNavItem icon={Radio} active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Users} title="Total Users" value={stats.users} color="text-blue-400" bg="bg-blue-400/10" />
                  <StatCard icon={Video} title="Total Reels" value={stats.reels} color="text-purple-400" bg="bg-purple-400/10" />
                  <StatCard icon={Heart} title="Total Likes" value={stats.likes} color="text-red-400" bg="bg-red-400/10" />
                  <StatCard icon={UserPlus} title="Total Follows" value={stats.follows} color="text-green-400" bg="bg-green-400/10" />
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-white">Manage Users</h2>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or email..."
                      className="pl-9 bg-[#1A1A1A] border-white/10"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Level / XP</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="avatar" className="w-8 h-8 rounded-full border border-white/10" />
                              <div>
                                <p className="font-semibold text-white">@{u.username}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">Lv. {u.level}</p>
                            <p className="text-xs text-muted-foreground">{u.xp} XP</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {u.is_verified_creator && <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full w-max"><CheckCircle className="w-3 h-3" /> Verified</span>}
                              {u.is_blocked && <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full w-max"><Ban className="w-3 h-3" /> Blocked</span>}
                              {!u.is_verified_creator && !u.is_blocked && <span className="text-xs text-muted-foreground">Normal</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${u.is_verified_creator ? 'text-gray-400 hover:text-white' : 'text-blue-400 hover:text-blue-300'}`}
                              onClick={() => toggleVerify(u.user_id, !!u.is_verified_creator)}
                              title={u.is_verified_creator ? "Remove verification" : "Verify Creator"}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${u.is_blocked ? 'text-gray-400 hover:text-white' : 'text-orange-400 hover:text-orange-300'}`}
                              onClick={() => toggleBlock(u.user_id, !!u.is_blocked)}
                              title={u.is_blocked ? "Unblock user" : "Block user"}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => deleteUser(u.user_id, u.username)}
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REELS TAB */}
            {activeTab === 'reels' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-white">Manage Reels</h2>
                  <div className="flex gap-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-white/10"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="DSA">DSA</SelectItem>
                        <SelectItem value="Web Dev">Web Dev</SelectItem>
                        <SelectItem value="AI-ML">AI-ML</SelectItem>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterReported} onValueChange={setFilterReported}>
                      <SelectTrigger className="w-[140px] bg-[#1A1A1A] border-white/10"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Reported Only</SelectItem>
                        <SelectItem value="false">Clean Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3">Thumbnail</th>
                        <th className="px-4 py-3">Title & Creator</th>
                        <th className="px-4 py-3">Stats</th>
                        <th className="px-4 py-3">Flags</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredReels.map(r => (
                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 w-16">
                            <div className="w-12 h-16 bg-muted/20 rounded object-cover overflow-hidden">
                              <video src={r.video_url} className="w-full h-full object-cover opacity-50" />
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="font-semibold text-white truncate" title={r.title}>{r.title}</p>
                            <p className="text-xs text-muted-foreground">@{r.uploader?.username || 'unknown'}</p>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <p className="text-muted-foreground"><span className="text-red-400">❤</span> {r.likes_count}</p>
                            <p className="text-muted-foreground"><span className="text-blue-400">👁</span> {r.total_views}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {r.is_reported && <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full w-max"><XCircle className="w-3 h-3" /> Reported</span>}
                              {r.is_featured && <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full w-max"><Video className="w-3 h-3" /> Featured</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${r.is_featured ? 'text-gray-400 hover:text-white' : 'text-purple-400 hover:text-purple-300'}`}
                              onClick={() => toggleFeature(r.id, !!r.is_featured)}
                              title={r.is_featured ? "Remove from featured" : "Feature Reel"}
                            >
                              <Video className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => deleteReel(r)}
                              title="Delete Reel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredReels.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No reels found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BROADCAST TAB */}
            {activeTab === 'broadcast' && (
              <div className="space-y-6 max-w-2xl mx-auto mt-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Radio className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">System Broadcast</h2>
                  <p className="text-muted-foreground text-sm">Send a direct notification to every registered user on CodeReels.</p>
                </div>

                <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5 shadow-xl">
                  <Textarea
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Enter broadcast message here... (e.g. CodeReels v2.0 is live! Check out the new challenges! 🎉)"
                    className="min-h-[150px] bg-black/20 border-white/10 text-white resize-none mb-6 focus-visible:ring-primary/50"
                  />
                  <Button
                    onClick={sendBroadcast}
                    disabled={broadcasting || !broadcastMsg.trim()}
                    className="w-full gradient-primary py-6 text-sm font-bold tracking-wide"
                  >
                    {broadcasting ? (
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</div>
                    ) : (
                      "Send to All Users"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// Subcomponents
function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
        }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function MobileNavItem({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all duration-200 ${active ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
        }`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}

function StatCard({ icon: Icon, title, value, color, bg }: { icon: any, title: string, value: number, color: string, bg: string }) {
  return (
    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 flex flex-col items-start gap-4">
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </div>
    </div>
  );
}
