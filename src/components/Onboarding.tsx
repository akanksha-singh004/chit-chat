import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isUsernameAvailable } from '../lib/chat';
import { AtSign, Check, Loader2, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

const Onboarding: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize: only allow lowercase alphanumeric, underscore, dash
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '');
    
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (cleanUsername.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    if (!/^[a-z][a-z0-9_\-]*$/.test(cleanUsername)) {
      setError('Username must start with a letter');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const available = await isUsernameAvailable(cleanUsername);
      if (!available) {
        setError('This username is already taken');
        setLoading(false);
        return;
      }

      await updateProfile({ username: cleanUsername, name: profile?.name || 'User' });
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div className="inline-flex w-24 h-24 bg-primary/10 rounded-[2rem] items-center justify-center text-primary mb-2">
          <Rocket size={48} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Claim Your Identity</h1>
          <p className="text-slate-500 font-medium px-4">
            Welcome to Chit Chat, <span className="text-primary font-bold">{profile?.name}</span>! 
            Choose a unique username so people can find and connect with you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              <AtSign size={20} />
            </div>
            <input 
              type="text" 
              placeholder="username"
              className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-4 text-lg font-bold outline-none transition-all ${
                error ? 'border-red-100 ring-4 ring-red-50' : 'border-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/10'
              }`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              disabled={loading || success}
            />
            {error && <p className="text-red-500 text-xs font-bold mt-2 text-left ml-4">{error}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading || success || !username}
            className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : success ? (
              <Check />
            ) : (
              'Get Started'
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          You can't change this later, so choose wisely!
        </p>
      </motion.div>
    </div>
  );
};

export default Onboarding;
