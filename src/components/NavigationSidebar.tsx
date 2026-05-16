import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Settings as SettingsIcon, 
  Bell, 
  Phone,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { watchRequests } from '../lib/chat';

interface NavigationSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, profile } = useAuth();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = watchRequests(user.uid, (requests) => {
      setRequestCount(requests.length);
    });
    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'people', icon: Users, label: 'People' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'groups', icon: Hash, label: 'Public' },
    { id: 'requests', icon: Bell, label: 'Notifications', badge: requestCount },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside className="w-[80px] h-screen border-r border-slate-100 flex flex-col items-center py-6 gap-8 bg-white z-[100] relative">
      <div className="text-primary z-10">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer overflow-hidden ring-1 ring-slate-100">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`relative p-3.5 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            
            {/* Notification Badge - Now showing a number! */}
            {item.badge !== undefined && item.badge > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white px-1 shadow-sm"
              >
                {item.badge > 9 ? '9+' : item.badge}
              </motion.span>
            )}

            {/* Hover Tooltip */}
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 uppercase tracking-widest">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      {/* User Mini Avatar at bottom */}
      <button 
        onClick={() => onTabChange('settings')}
        className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-transparent hover:ring-primary/20 transition-all"
      >
        <img 
          src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random`} 
          className="w-full h-full object-cover" 
          alt="Profile" 
        />
      </button>
    </aside>
  );
};

export default NavigationSidebar;
