import React, { useEffect, useState } from 'react';
import { watchCallLogs, type CallSession } from '../lib/chat';
import { useAuth } from '../context/AuthContext';
import { Phone, Video, ArrowUpRight, ArrowDownLeft, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CallLogList: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = watchCallLogs(user.uid, (data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Call History</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
            <div className="p-6 bg-slate-50 rounded-[2rem]">
              <Phone size={48} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-slate-400">No recent calls</p>
          </div>
        ) : (
          <AnimatePresence>
            {logs.map((log) => {
              const isOutgoing = log.callerUid === user?.uid;
              const isMissed = log.status === 'rejected' || (log.status === 'ended' && !isOutgoing); // Simplified
              
              const displayName = isOutgoing 
                ? (log.receiverName || `User ${log.receiverUid.substring(0, 5)}...`) 
                : (log.callerName || `User ${log.callerUid.substring(0, 5)}...`);
              
              const displayPhoto = isOutgoing
                ? (log.receiverPhoto || `https://ui-avatars.com/api/?name=${displayName}&background=random`)
                : (log.callerPhoto || `https://ui-avatars.com/api/?name=${displayName}&background=random`);

              return (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100"
                >
                  <div className="relative">
                    <img 
                      src={displayPhoto} 
                      className="w-12 h-12 rounded-full shadow-sm object-cover bg-slate-100" 
                      alt="" 
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${isOutgoing ? 'bg-blue-500' : 'bg-green-500'}`}>
                      {isOutgoing ? <ArrowUpRight size={12} className="text-white" /> : <ArrowDownLeft size={12} className="text-white" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">
                      {displayName}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {log.type === 'video' ? <Video size={12} className="text-slate-400" /> : <Phone size={12} className="text-slate-400" />}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isMissed ? 'text-red-500' : 'text-slate-400'}`}>
                        {log.status === 'rejected' ? 'Missed' : log.type + ' Call'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 mb-1">
                      {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                    </p>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold">
                        {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default CallLogList;
