import React, { useState } from 'react';
import { getUserByUsername, createFriendRequest } from '../lib/chat';
import { UserPlus, AtSign, Loader2, Check, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const PeopleList: React.FC = () => {
  const { user, profile: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize input: only allow alphanumeric, underscore, dash
    const cleanSearch = searchTerm.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '');
    if (!cleanSearch || cleanSearch.length < 2) {
      setError('Enter at least 2 valid characters (letters, numbers, _)');
      return;
    }

    setLoading(true);
    setError('');
    setRequestSent(false);
    
    try {
      const foundProfile = await getUserByUsername(cleanSearch);
      if (foundProfile) {
        // Check: don't show yourself
        if (foundProfile.uid === currentUser?.uid) {
          setError("That's you! Try searching for someone else.");
          setFoundUser(null);
        } 
        // Check: don't show blocked users
        else {
          const myDoc = await getDoc(doc(db, 'users', user!.uid));
          const myBlocked = myDoc.exists() ? (myDoc.data().blocked || []) : [];
          const theirDoc = await getDoc(doc(db, 'users', foundProfile.uid as string));
          const theirBlocked = theirDoc.exists() ? (theirDoc.data().blocked || []) : [];

          if (myBlocked.includes(foundProfile.uid) || theirBlocked.includes(user!.uid)) {
            setError("No user found with that ID.");
            setFoundUser(null);
          } else {
            setFoundUser(foundProfile);
            // Check if request already sent
            const existingReq = query(
              collection(db, 'friendRequests'),
              where('fromUid', '==', user!.uid),
              where('toUid', '==', foundProfile.uid),
              where('status', '==', 'pending')
            );
            const reqSnap = await getDocs(existingReq);
            if (!reqSnap.empty) setRequestSent(true);
          }
        }
      } else {
        setFoundUser(null);
        setError("No user found with that ID.");
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!foundUser || !currentUser) return;
    setLoading(true);
    try {
      await createFriendRequest(currentUser, foundUser.uid);
      setRequestSent(true);
    } catch (err) {
      alert("Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Connect</h1>
        <form onSubmit={handleSearch} className="relative group">
          <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Enter User ID..." 
            className="input pl-11 pr-24"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            Search
          </button>
        </form>
      </header>

      <div className="flex-1 px-6 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Searching...</p>
            </motion.div>
          ) : foundUser ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-4 shadow-sm"
            >
              <div className="relative">
                <img 
                  src={foundUser.photoURL || `https://ui-avatars.com/api/?name=${foundUser.name}`} 
                  className="w-24 h-24 rounded-full shadow-md border-4 border-white object-cover" 
                  alt="" 
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-50 shadow-sm"></span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">{foundUser.name}</h3>
                <p className="text-primary font-bold text-sm">@{foundUser.username}</p>
              </div>

              <p className="text-slate-500 text-sm italic">
                "{foundUser.about || 'Available'}"
              </p>

              <button 
                onClick={handleSendRequest}
                disabled={requestSent}
                className={`w-full btn py-3.5 rounded-2xl justify-center font-bold tracking-tight transition-all ${
                  requestSent 
                    ? 'bg-green-100 text-green-600 cursor-default' 
                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                {requestSent ? (
                  <div className="flex items-center gap-2">
                    <Check size={18} />
                    Request Sent
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus size={18} />
                    Send Friend Request
                  </div>
                )}
              </button>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-4"
            >
              <div className="p-4 bg-red-50 text-red-400 rounded-2xl">
                <UserX size={32} />
              </div>
              <p className="text-sm text-slate-500 font-medium px-4">{error}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-4 text-slate-300"
            >
              <AtSign size={48} strokeWidth={1.5} />
              <p className="text-sm text-slate-400 font-medium px-8">
                Search for someone using their unique User ID to connect and start chatting.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PeopleList;
