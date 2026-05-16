import React, { useEffect, useState } from 'react';
import { watchPublicRooms, joinPublicRoom, createGroupRoom, type Room } from '../lib/chat';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomContext';
import { Hash, Plus, Users, Search, Loader2, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PublicRooms: React.FC = () => {
  const { user } = useAuth();
  const { setActiveRoomId } = useRooms();
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    const unsubscribe = watchPublicRooms((data) => {
      setPublicRooms(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = async (room: Room) => {
    if (!user) return;
    const isMember = room.members.includes(user.uid);
    if (!isMember) {
      await joinPublicRoom(room.id, user.uid);
    }
    setActiveRoomId(room.id);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    const roomId = await createGroupRoom(newName, newDesc, user.uid);
    setActiveRoomId(roomId);
    setShowCreate(false);
    setNewName('');
    setNewDesc('');
  };

  const filtered = publicRooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Public Hub</h1>
          <button 
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search communities..." 
            className="input pl-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Hash className="mx-auto mb-4 opacity-20" size={48} />
            <p className="font-medium">No public rooms found.</p>
          </div>
        ) : (
          filtered.map(room => {
            const isMember = room.members.includes(user?.uid || '');
            return (
              <motion.div 
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleJoin(room)}
                className="p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <Hash size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{room.name}</h4>
                    <p className="text-xs text-slate-500 truncate mb-1">{room.description || 'No description provided'}</p>
                    <div className="flex items-center gap-2">
                      <Users size={10} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {room.members.length} active members
                      </span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-xl transition-all ${isMember ? 'text-green-500 bg-green-50' : 'text-primary bg-white shadow-sm group-hover:bg-primary group-hover:text-white'}`}>
                    {isMember ? <Check size={18} /> : <ArrowRight size={18} />}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative p-8 space-y-6"
            >
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Community</h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-primary uppercase tracking-wider ml-1">Room Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. JavaScript Enthusiasts" 
                    className="input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-primary uppercase tracking-wider ml-1">Description</label>
                  <textarea 
                    placeholder="What is this room about?" 
                    className="input min-h-[100px] resize-none"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full btn btn-primary py-4 rounded-2xl justify-center font-bold text-lg">
                  Launch Room
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicRooms;
