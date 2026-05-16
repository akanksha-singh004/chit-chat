import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  watchIncomingCalls, 
  updateCallStatus, 
  watchCallSession, 
  type CallSession,
} from '../lib/chat';
import { db } from '../lib/firebase';
import { collection, query, where, limit, onSnapshot, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AgoraRTC, { 
  AgoraRTCProvider, 
  LocalVideoTrack, 
  RemoteUser, 
  useLocalMicrophoneTrack, 
  useLocalCameraTrack, 
  useRemoteUsers, 
  useJoin,
  usePublish
} from 'agora-rtc-react';
import { AGORA_CONFIG } from '../config';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const CallUI: React.FC<{ session: CallSession; onEnd: () => void }> = ({ session, onEnd }) => {
  const [joined, setJoined] = useState(false);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);
  const { localCameraTrack } = useLocalCameraTrack(session.type === 'video');
  const remoteUsers = useRemoteUsers();

  useJoin({
    appid: AGORA_CONFIG.appId,
    channel: session.roomId,
    token: AGORA_CONFIG.token,
    uid: null,
  }, joined);

  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Join Agora immediately when CallUI renders
  useEffect(() => {
    setJoined(true);
  }, []);

  // Handle Agora connection errors
  useEffect(() => {
    const handleConnectionError = (err: any) => {
      if (err.message?.includes('GATEWAY_SERVER')) {
        console.error("AGORA CONFIG ERROR: Your Agora project likely has 'App Certificate' enabled. Please disable it in the Agora Console to use testing mode.");
      }
    };
    client.on('exception', handleConnectionError);
    return () => client.off('exception', handleConnectionError);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center p-4 gap-4">
        {session.type === 'video' ? (
          <>
            <div className="flex-1 h-full bg-slate-900 rounded-[3rem] overflow-hidden relative shadow-2xl border border-white/5">
              {remoteUsers.length > 0 ? (
                <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <img src={session.callerPhoto} className="w-32 h-32 rounded-full border-4 border-primary/20" alt="" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white text-xl font-black">{session.status === 'ringing' ? 'Ringing...' : 'Connecting...'}</p>
                    <p className="text-primary font-bold animate-pulse text-xs uppercase tracking-[0.2em]">Please wait</p>
                  </div>
                </div>
              )}
            </div>

            {localCameraTrack && (
              <motion.div 
                drag
                dragConstraints={{ left: -300, right: 300, top: -400, bottom: 400 }}
                className="absolute top-10 right-10 w-44 h-64 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 z-50 cursor-move"
              >
                <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
              </motion.div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-10">
            <div className="relative">
              <div className="w-56 h-56 rounded-full border-8 border-primary/10 flex items-center justify-center bg-slate-900 shadow-2xl overflow-hidden">
                <img src={session.callerPhoto} className="w-full h-full object-cover" alt="" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/40"
              >
                <Mic className="text-white" size={32} />
              </motion.div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-white">{session.callerName}</h2>
              <p className="text-primary font-bold tracking-[0.3em] uppercase text-xs">
                {session.status === 'ringing' ? 'Ringing...' : 'Connected'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-6 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-2xl z-[100]">
        <button className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
          <Mic size={24} />
        </button>
        <button 
          onClick={onEnd}
          className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all ring-8 ring-red-500/10"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
};

const CallManager: React.FC = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // Listen for INCOMING calls (with block check)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = watchIncomingCalls(user.uid, async (call) => {
      if (call) {
        // Security: check if caller is blocked
        const myDoc = await getDoc(firestoreDoc(db, 'users', user.uid));
        const blockedList = myDoc.exists() ? (myDoc.data().blocked || []) : [];
        
        if (blockedList.includes(call.callerUid)) {
          // Auto-reject calls from blocked users
          await updateCallStatus(call.id, 'rejected');
          return;
        }
        setIncomingCall(call);
      } else {
        setIncomingCall(null);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Listen for OUTGOING calls (so caller sees ringing UI)
  useEffect(() => {
    if (!user || activeCall) return;
    const q = query(
      collection(db, 'calls'),
      where('callerUid', '==', user.uid),
      where('status', '==', 'ringing'),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveCall({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CallSession);
      }
    });
    return () => unsubscribe();
  }, [user, activeCall]);

  // Sync active call session status
  useEffect(() => {
    if (!activeCall) return;
    const unsubscribe = watchCallSession(activeCall.id, (session) => {
      if (!session || session.status === 'ended' || session.status === 'rejected') {
        setActiveCall(null);
      } else {
        setActiveCall(session);
      }
    });
    return () => unsubscribe();
  }, [activeCall?.id]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    await updateCallStatus(incomingCall.id, 'connected');
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const handleReject = async () => {
    if (!incomingCall) return;
    await updateCallStatus(incomingCall.id, 'rejected');
    setIncomingCall(null);
  };

  const handleEnd = async () => {
    if (!activeCall) return;
    const callId = activeCall.id;
    setActiveCall(null); // Instantly close UI
    try {
      await updateCallStatus(callId, 'ended');
    } catch (e) {
      console.error(e);
    }
  };

  if (activeCall) {
    return (
      <AgoraRTCProvider client={client}>
        <CallUI session={activeCall} onEnd={handleEnd} />
      </AgoraRTCProvider>
    );
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-10 z-[400] w-[400px] bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-6 border border-slate-100 flex items-center gap-5"
        >
          <div className="relative">
            <img src={incomingCall.callerPhoto} className="w-20 h-20 rounded-full shadow-lg" alt="" />
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center animate-bounce shadow-xl ring-4 ring-white">
              {incomingCall.type === 'video' ? <Video size={18} /> : <Phone size={18} />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-900 text-lg truncate">{incomingCall.callerName}</h4>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Incoming {incomingCall.type} call...</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReject}
              className="w-14 h-14 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              <PhoneOff size={24} />
            </button>
            <button 
              onClick={handleAccept}
              className="w-14 h-14 bg-green-500 text-white rounded-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-green-500/20"
            >
              {incomingCall.type === 'video' ? <Video size={24} /> : <Phone size={24} />}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallManager;
