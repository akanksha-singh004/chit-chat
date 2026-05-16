import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Camera, 
  X, 
  Check, 
  Loader2, 
  Info,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile as updateAuthProfile } from 'firebase/auth';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { user, profile, logout } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [about, setAbout] = useState(profile?.about || 'Hey there! I\'m using Chit Chat.');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAbout(profile.about || '');
    }
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // 1. Update Firestore Profile (visible to others)
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: url
      });

      // 2. Update Auth Profile (fallback)
      await updateAuthProfile(user, { photoURL: url });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        about
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <header className="p-6 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        </div>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-green-500 font-bold text-sm">
            <Check size={18} /> Saved
          </motion.div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center ring-1 ring-slate-100">
              {uploading ? (
                <Loader2 className="animate-spin text-primary" size={40} />
              ) : (
                <img 
                  src={profile?.photoURL || `https://ui-avatars.com/api/?name=${name || 'User'}&background=D7D9FC&color=4F46E5&bold=true&size=256`} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>
            <label className="absolute bottom-1 right-1 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all ring-4 ring-white">
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              <Camera size={20} />
            </label>
          </div>
          <div className="mt-4 text-center">
            <h3 className="font-black text-slate-900 text-xl">@{profile?.username}</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <User size={12} className="text-primary" /> Display Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-4 ring-primary/5 transition-all"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <Info size={12} className="text-primary" /> About
            </label>
            <textarea 
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-4 ring-primary/5 transition-all min-h-[100px] resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Save Profile Changes</>}
          </button>

          <button 
            onClick={() => { if(confirm('Are you sure?')) logout(); }}
            className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={18} /> Logout Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
