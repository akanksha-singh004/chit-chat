import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, Hash, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatListProps {
  onAddClick: () => void;
}

// Sub-component for individual Room Items to handle dynamic DM names
const ChatRoomItem: React.FC<{ room: any; active: boolean; onClick: () => void; user: any }> = ({ room, active, onClick, user }) => {
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    if (room.type !== 'dm' || !user) return;
    const otherUid = room.members.find((uid: string) => uid !== user.uid);
    if (!otherUid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', otherUid), (snapshot) => {
      if (snapshot.exists()) {
        setOtherUser(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, [room.id, user]);

  const name = room.type === 'dm' 
    ? (otherUser?.name || otherUser?.username || otherUser?.displayName || room.name || 'Chat')
    : room.name;

  const photo = room.type === 'dm'
    ? (otherUser?.photoURL || otherUser?.photo || otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D7D9FC&color=4F46E5&bold=true`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D7D9FC&color=4F46E5&bold=true`;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${
        active 
          ? 'bg-primary/5 border-l-4 border-primary' 
          : 'hover:bg-slate-50 border-l-4 border-transparent'
      }`}
    >
      <div className="relative">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm overflow-hidden ring-1 ring-slate-100 ${room.type === 'group' ? 'bg-white border border-slate-100 text-primary' : ''}`}>
          {room.type === 'group' ? (
            <Hash size={24} />
          ) : (
            <img 
              src={photo} 
              className="w-full h-full object-cover" 
              alt="" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D7D9FC&color=4F46E5&bold=true`;
              }}
            />
          )}
        </div>
        {room.type === 'dm' && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
        )}
      </div>

      <div className="flex-1 text-left min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className={`font-black truncate text-sm leading-tight ${active ? 'text-primary' : 'text-slate-900'}`}>
            {name}
          </h4>
          {room.lastMessageAt && (
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
              {new Date(room.lastMessageAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 truncate font-bold">
          {room.lastMessage || (room.type === 'group' ? 'Welcome to the community!' : 'Start a conversation')}
        </p>
      </div>
      
      <ChevronRight size={14} className={`text-slate-200 transition-transform ${active ? 'translate-x-1 text-primary' : 'group-hover:translate-x-1'}`} />
    </motion.button>
  );
};

const ChatList: React.FC<ChatListProps> = ({ onAddClick }) => {
  const { user } = useAuth();
  const { rooms, activeRoomId, setActiveRoomId } = useRooms();
  const [activeSubTab, setActiveSubTab] = useState<'direct' | 'groups'>('direct');
  const [searchTerm, setSearchTerm] = useState('');

  const directMessages = rooms.filter(room => room.type === 'dm');
  const groupChats = rooms.filter(room => room.type === 'group');

  const filteredRooms = (activeSubTab === 'direct' ? directMessages : groupChats).filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="p-6 pb-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
          <button 
            onClick={onAddClick}
            className="w-10 h-10 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
          >
            <Plus size={22} />
          </button>
        </div>

        {/* Search */}
        <div className="relative group mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeSubTab === 'direct' ? 'people' : 'groups'}...`} 
            className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold outline-none focus:ring-4 ring-primary/5 transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sub-Tabs */}
        <div className="flex p-1 bg-slate-50 rounded-2xl mb-4">
          <button 
            onClick={() => setActiveSubTab('direct')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeSubTab === 'direct' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MessageCircle size={14} />
            Direct
          </button>
          <button 
            onClick={() => setActiveSubTab('groups')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeSubTab === 'groups' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={14} />
            Groups
          </button>
        </div>
      </header>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
        <AnimatePresence mode="popLayout">
          {filteredRooms.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-12 text-center text-slate-300 space-y-4"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center">
                {activeSubTab === 'direct' ? <MessageCircle size={32} className="opacity-20" /> : <Hash size={32} className="opacity-20" />}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No {activeSubTab} chats</p>
            </motion.div>
          ) : (
            filteredRooms.map((room) => (
              <ChatRoomItem 
                key={room.id} 
                room={room} 
                active={activeRoomId === room.id} 
                onClick={() => setActiveRoomId(room.id)}
                user={user}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatList;
