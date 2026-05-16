import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomContext';
import { watchMessages, sendMessage, uploadFile, startCall, unfriend, blockUser } from '../lib/chat';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  File as FileIcon, 
  X,
  Camera,
  Download,
  Loader2,
  UserMinus,
  Ban,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '👣', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'
];

const ChatWindow: React.FC = () => {
  const { user, profile } = useAuth();
  const { activeRoomId, rooms, setActiveRoomId } = useRooms();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic DM Name logic
  useEffect(() => {
    if (!activeRoom || activeRoom.type !== 'dm' || !user) {
      setOtherUser(null);
      return;
    }
    const otherUid = activeRoom.members.find(uid => uid !== user.uid);
    if (!otherUid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', otherUid), (snapshot) => {
      if (snapshot.exists()) {
        setOtherUser(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, [activeRoomId, user]);

  useEffect(() => {
    if (!activeRoomId) return;
    const unsubscribe = watchMessages(activeRoomId, setMessages);
    return () => unsubscribe();
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeRoomId || !profile) return;
    const content = { text: newMessage, type: 'text' };
    const senderName = profile.name || profile.username || user?.displayName || 'User';
    setNewMessage('');
    setShowEmojiPicker(false);
    await sendMessage(activeRoomId, { ...user, displayName: senderName }, content);
  };

  const handleCall = async (type: 'voice' | 'video') => {
    if (!activeRoom || !user || activeRoom.type !== 'dm') return;
    
    const otherUid = activeRoom.members.find(uid => uid !== user.uid);
    if (!otherUid) return;

    await startCall(activeRoom.id, user, {
      uid: otherUid,
      name: otherUser?.name || otherUser?.username || activeRoom.name || 'User',
      photo: otherUser?.photoURL || otherUser?.photo || `https://ui-avatars.com/api/?name=${activeRoom.name}&background=random`
    }, type);
  };

  const handleUnfriend = async () => {
    if (!activeRoomId || !confirm('Are you sure you want to unfriend this person? This will delete the chat history.')) return;
    await unfriend(activeRoomId);
    setActiveRoomId(null);
    setShowOptions(false);
  };

  const handleBlock = async () => {
    if (!otherUser || !user || !confirm('Block this user? They will no longer be able to contact you.')) return;
    await blockUser(user.uid, otherUser.uid || activeRoom?.members.find(u => u !== user.uid));
    if (activeRoomId) await unfriend(activeRoomId);
    setActiveRoomId(null);
    setShowOptions(false);
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;

    setUploading(true);
    try {
      const url = await uploadFile(activeRoomId, file, setProgress);
      const content = { 
        url, 
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileName: file.name,
        fileSize: file.size
      };
      await sendMessage(activeRoomId, { ...user, displayName: profile?.name || 'User' }, content);
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Could not access camera.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!canvasRef.current || !videoRef.current || !activeRoomId) return;
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      stopCamera();
      setUploading(true);
      try {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = await uploadFile(activeRoomId, file, setProgress);
        await sendMessage(activeRoomId, { ...user, displayName: profile?.name || 'User' }, { url, type: 'image' });
      } catch (err) {
        alert("Photo upload failed.");
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg');
  };

  if (!activeRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 p-12">
        <div className="w-24 h-24 mb-6 opacity-20 grayscale">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Select a Conversation</h3>
        <p className="text-sm font-medium max-w-xs text-center leading-relaxed">
          Choose a friend or join a community to start chatting and purring.
        </p>
      </div>
    );
  }

  const roomName = otherUser 
    ? (otherUser.name || otherUser.username || otherUser.displayName || activeRoom.name || 'Chat') 
    : (activeRoom.name || 'Chat');
    
  const roomPhoto = (otherUser?.photoURL || otherUser?.photo) 
    ? (otherUser.photoURL || otherUser.photo) 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(roomName)}&background=random&color=fff&bold=true`;

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <header className="h-[80px] shrink-0 px-4 md:px-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => setActiveRoomId(null)}
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full overflow-hidden shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
            <img 
              src={roomPhoto} 
              alt="" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(roomName)}&background=D7D9FC&color=4F46E5&bold=true`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 truncate max-w-[200px] leading-tight">{roomName}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Active Now</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleCall('voice')} className="btn-icon p-3 text-slate-400 hover:text-primary transition-colors"><Phone size={20} /></button>
          <button onClick={() => handleCall('video')} className="btn-icon p-3 text-slate-400 hover:text-primary transition-colors"><Video size={20} /></button>
          <div className="relative">
            <button onClick={() => setShowOptions(!showOptions)} className="btn-icon p-3 text-slate-400 hover:bg-slate-50 transition-all"><MoreVertical size={20} /></button>
            <AnimatePresence>
              {showOptions && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100]"
                >
                  <button 
                    onClick={handleUnfriend}
                    className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <UserMinus size={18} /> Unfriend
                  </button>
                  <button 
                    onClick={handleBlock}
                    className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <Ban size={18} /> Block User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative group/msgs">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.62 10.11a3.5 3.5 0 0 1 1.48 2.34c.16.85.1 1.73-.18 2.54-.42 1.2-1.34 2.15-2.54 2.57a3.5 3.5 0 0 1-2.54-.18 3.5 3.5 0 0 1-1.48-2.34 3.5 3.5 0 0 1 .18-2.54 3.5 3.5 0 0 1 2.54-2.57 3.5 3.5 0 0 1 2.54.18zM10.11 5.38a3.5 3.5 0 0 1 2.34-1.48 3.5 3.5 0 0 1 2.54.18 3.5 3.5 0 0 1 2.57 2.54 3.5 3.5 0 0 1-.18 2.54 3.5 3.5 0 0 1-2.34 1.48 3.5 3.5 0 0 1-2.54-.18 3.5 3.5 0 0 1-2.57-2.54 3.5 3.5 0 0 1 .18-2.54z' fill='%23000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize: '100px 100px' }}></div>
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          
          // Regex to detect if message is ONLY emojis (up to 3 emojis for big size)
          const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/g;
          const isEmojiOnly = msg.type === 'text' && msg.text.match(emojiRegex);

          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 relative z-10`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-2">
                {isMe ? 'You' : msg.senderName}
              </span>
              <div className={`max-w-[70%] group ${isMe ? 'items-end' : 'items-start'}`}>
                {msg.type === 'text' ? (
                  isEmojiOnly ? (
                    <div className="text-5xl py-2 drop-shadow-sm select-none">
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-[2rem] shadow-sm text-sm font-medium ${
                      isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  )
                ) : msg.type === 'image' ? (
                  <div className="relative group rounded-3xl overflow-hidden shadow-lg bg-white p-2 border border-slate-100">
                    <img src={msg.url} className="max-w-full rounded-2xl cursor-zoom-in" alt="Media" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center"><FileIcon size={24} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{msg.fileName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{(msg.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <a href={msg.url} download className="btn-icon bg-slate-50"><Download size={18} /></a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {uploading && (
        <div className="px-6 py-2 bg-primary/5 flex items-center gap-4 border-t border-primary/10">
          <Loader2 className="animate-spin text-primary" size={16} />
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary" />
          </div>
          <span className="text-[10px] font-black text-primary">{Math.round(progress)}%</span>
        </div>
      )}

      <footer className="p-6 bg-white border-t border-slate-50 relative">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-full left-6 mb-4 w-[320px] h-[300px] bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-100 p-6 overflow-y-auto z-50 grid grid-cols-6 gap-2 no-scrollbar"
            >
              {EMOJIS.map((emoji, i) => (
                <button 
                  key={i} 
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-center gap-4 p-2 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner group focus-within:ring-4 ring-primary/5 transition-all">
          <div className="flex items-center gap-1 pl-2">
            <label className="btn-icon p-2 cursor-pointer hover:bg-white hover:shadow-sm">
              <input type="file" className="hidden" onChange={handleFileUpload} />
              <Paperclip size={20} className="text-slate-400 group-focus-within:text-primary transition-colors" />
            </label>
            <button type="button" onClick={startCamera} className="btn-icon p-2 hover:bg-white hover:shadow-sm">
              <Camera size={20} className="text-slate-400 group-focus-within:text-primary" />
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-medium text-slate-700 placeholder:text-slate-300" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
          />
          <div className="flex items-center gap-2 pr-2">
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`btn-icon p-2 hover:bg-white hover:shadow-sm transition-colors ${showEmojiPicker ? 'text-primary' : 'text-slate-400'}`}
            >
              <Smile size={20} />
            </button>
            <button type="submit" className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"><Send size={20} /></button>
          </div>
        </form>
      </footer>

      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={stopCamera} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-4 rounded-[3rem] shadow-2xl relative w-full max-w-2xl overflow-hidden">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-6">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex items-center justify-center gap-6">
                <button onClick={stopCamera} className="w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all"><X size={24} /></button>
                <button onClick={capturePhoto} className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all ring-8 ring-primary/10"><Camera size={32} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;
