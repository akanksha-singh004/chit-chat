import React, { useEffect, useState } from 'react';
import { watchRequests, acceptFriendRequest, type FriendRequest } from '../lib/chat';
import { useAuth } from '../context/AuthContext';
import { Check, X, Bell, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RequestList: React.FC = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = watchRequests(user.uid, (data) => {
      setRequests(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAccept = async (req: FriendRequest) => {
    try {
      await acceptFriendRequest(
        req.id, 
        req.fromUid, 
        user!.uid, 
        req.fromName, 
        profile!.name
      );
      // Room will be created automatically in acceptFriendRequest
    } catch (err) {
      alert("Failed to accept request.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-4">
            <Bell size={48} strokeWidth={1} />
            <p className="text-sm text-slate-400 font-medium">No new requests yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {requests.map(req => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img src={req.fromPhoto} className="w-12 h-12 rounded-full shadow-sm object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{req.fromName}</h4>
                    <p className="text-xs text-primary font-bold tracking-tight">@{req.fromUsername}</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Sent you a friend request. Accept to start chatting!
                </p>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAccept(req)}
                    className="flex-1 btn bg-primary text-white text-xs py-2 rounded-xl justify-center font-bold shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Check size={16} />
                    Accept
                  </button>
                  <button 
                    className="flex-1 btn bg-white text-slate-400 border border-slate-200 text-xs py-2 rounded-xl justify-center font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                  >
                    <X size={16} />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default RequestList;
