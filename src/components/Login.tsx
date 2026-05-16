import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Globe, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CAROUSEL_DATA = [
  {
    image: '/mascot1.png',
    title: 'Welcome back!',
    subtitle: 'Sign in to continue your conversations.',
    quote: 'Chat. Connect. Purr.'
  },
  {
    image: '/mascot2.png',
    title: 'Global Connectivity',
    subtitle: 'Your community is just a whiskers away.',
    quote: 'Stay connected, stay pawsitive!'
  },
  {
    image: '/mascot3.png',
    title: 'Chat Smarter',
    subtitle: 'Experience the next generation of messaging.',
    quote: 'Empowering your conversations.'
  }
];

const Login: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FE] overflow-hidden">
      {/* Left Sidebar - Decoration Carousel */}
      <div className="hidden lg:flex w-[40%] bg-[#D7D9FC] p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Chit <span className="text-primary">Chat</span></h1>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-[52px]">
            {CAROUSEL_DATA[currentSlide].quote}
          </p>
        </div>

        {/* Carousel Content */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-12">
                <div className="w-80 h-80 bg-primary/20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse"></div>
                <img 
                  src={CAROUSEL_DATA[currentSlide].image} 
                  alt="Mascot" 
                  className="w-72 h-72 object-contain relative drop-shadow-2xl" 
                />
              </div>

              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-slate-900">{CAROUSEL_DATA[currentSlide].title}</h2>
                <p className="text-slate-500 font-bold text-sm max-w-[280px] leading-relaxed">
                  {CAROUSEL_DATA[currentSlide].subtitle}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        <div className="flex gap-3 justify-center z-10">
          {CAROUSEL_DATA.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 transition-all duration-300 rounded-full ${currentSlide === idx ? 'w-8 bg-primary shadow-lg shadow-primary/30' : 'w-2 bg-primary/20'}`}
            />
          ))}
        </div>

        {/* Background Decorative Element */}
        <div className="absolute top-20 right-10 opacity-10 text-slate-900 rotate-12">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,18C12,19.1 11.1,20 10,20C8.9,20 8,19.1 8,18C8,16.9 8.9,16 10,16C11.1,16 12,16.9 12,18M16,18C16,19.1 15.1,20 14,20C12.9,20 12,19.1 12,18C12,16.9 12.9,16 14,16C15.1,16 16,16.9 16,18M18,14C18,15.1 17.1,16 16,16C14.9,16 14,15.1 14,14C14,12.9 14.9,12 16,12C17.1,12 18,12.9 18,14M6,14C6,15.1 5.1,16 4,16C2.9,16 2,15.1 2,14C2,12.9 2.9,12 4,12C5.1,12 6,12.9 6,14M12,8C12,10.2 10.2,12 8,12C5.8,12 4,10.2 4,8C4,5.8 5.8,4 8,4C10.2,4 12,5.8 12,8Z"/>
          </svg>
        </div>
      </div>

      {/* Right Content - Form */}
      <div className="flex-1 flex flex-col p-8 lg:p-16 relative">
        {/* Language Selector */}
        <div className="absolute top-8 right-12">
          <button className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">
            <Globe size={16} />
            English
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full max-w-[440px] bg-white p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-50"
          >
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome back 👋</h2>
              <p className="text-slate-400 font-bold text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 relative">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Password</label>
                  <button type="button" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Forgot password?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-[11px] font-bold text-center bg-red-50 p-3 rounded-xl">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : isSignUp ? 'Create Account' : 'Login'}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-slate-300 text-[9px] font-black uppercase tracking-[0.2em]">or continue with</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            <div className="mt-8">
              <button 
                onClick={signInWithGoogle}
                className="w-full bg-white border border-slate-100 py-4 rounded-2xl font-bold text-slate-700 flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm"
              >
                <img src="/google.svg" className="w-5 h-5" alt="" />
                Continue with Google
              </button>
            </div>

            <div className="mt-10 text-center">
              <p className="text-slate-400 text-sm font-bold">
                {isSignUp ? "Already a member?" : "New to Chit Chat?"}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary font-black ml-2 hover:underline tracking-tight"
                >
                  {isSignUp ? 'Sign in' : 'Create an account'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
