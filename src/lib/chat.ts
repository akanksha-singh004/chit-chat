import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  deleteDoc,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export interface Room {
  id: string;
  name: string;
  type: 'dm' | 'group';
  members: string[];
  description?: string;
  lastMessage?: string;
  lastMessageAt?: any;
  createdAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  url?: string;
  type: 'text' | 'image' | 'file';
  createdAt: any;
  fileName?: string;
  fileSize?: number;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromUsername: string;
  fromPhoto: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export interface CallSession {
  id: string;
  roomId: string;
  callerUid: string;
  callerName: string;
  callerPhoto: string;
  receiverUid: string;
  receiverName: string;
  receiverPhoto: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  createdAt: any;
}

// --- USER QUERIES ---
export const getUserByUsername = async (username: string) => {
  const q = query(collection(db, 'users'), where('username', '==', username));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

export const isUsernameAvailable = async (username: string) => {
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

// --- ROOMS & MESSAGES ---
export const createRoom = async (name: string, type: 'dm' | 'group', members: string[]) => {
  const roomRef = await addDoc(collection(db, 'rooms'), {
    name,
    type,
    members,
    createdAt: serverTimestamp()
  });
  return roomRef.id;
};

export const createGroupRoom = async (name: string, description: string, creatorUid: string) => {
  const roomRef = await addDoc(collection(db, 'rooms'), {
    name,
    type: 'group',
    description,
    members: [creatorUid],
    createdAt: serverTimestamp()
  });
  return roomRef.id;
};

export const joinPublicRoom = async (roomId: string, userId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    members: arrayUnion(userId)
  });
};

export const watchPublicRooms = (callback: (rooms: Room[]) => void) => {
  const q = query(collection(db, 'rooms'), where('type', '==', 'group'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
  });
};

export const watchRooms = (userId: string, callback: (rooms: Room[]) => void) => {
  const q = query(collection(db, 'rooms'), where('members', 'array-contains', userId));
  return onSnapshot(q, async (snapshot) => {
    // Get user's blocked list first
    const userDoc = await getDoc(doc(db, 'users', userId));
    const blockedList = userDoc.exists() ? (userDoc.data().blocked || []) : [];

    const rooms = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Room))
      .filter(room => {
        if (room.type === 'dm') {
          const otherUid = room.members.find(uid => uid !== userId);
          return !blockedList.includes(otherUid);
        }
        return true;
      });
    callback(rooms);
  });
};

export const watchMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, `rooms/${roomId}/messages`), 
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
  });
};

export const sendMessage = async (roomId: string, sender: any, content: any) => {
  await addDoc(collection(db, `rooms/${roomId}/messages`), {
    senderId: sender.uid,
    senderName: sender.displayName || sender.name || sender.username || 'User',
    ...content,
    createdAt: serverTimestamp()
  });
  await updateDoc(doc(db, 'rooms', roomId), {
    lastMessage: content.text || `Sent a ${content.type}`,
    lastMessageAt: serverTimestamp()
  });
};

// --- FRIEND REQUESTS ---
export const createFriendRequest = async (fromUser: any, toUid: string) => {
  await addDoc(collection(db, 'friendRequests'), {
    fromUid: fromUser.uid,
    fromName: fromUser.name,
    fromUsername: fromUser.username,
    fromPhoto: fromUser.photoURL,
    toUid,
    status: 'pending',
    createdAt: serverTimestamp()
  });
};

export const watchRequests = (userId: string, callback: (requests: FriendRequest[]) => void) => {
  const q = query(
    collection(db, 'friendRequests'), 
    where('toUid', '==', userId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
  });
};

export const acceptFriendRequest = async (requestId: string, fromUid: string, toUid: string, fromName: string, toName: string) => {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
  await createRoom(`${fromName} & ${toName}`, 'dm', [fromUid, toUid]);
};

// --- CALL SIGNALING ---
export const startCall = async (roomId: string, caller: any, receiver: { uid: string, name: string, photo: string }, type: 'voice' | 'video') => {
  const callRef = await addDoc(collection(db, 'calls'), {
    roomId,
    callerUid: caller.uid,
    callerName: caller.displayName,
    callerPhoto: caller.photoURL,
    receiverUid: receiver.uid,
    receiverName: receiver.name,
    receiverPhoto: receiver.photo,
    type,
    status: 'ringing',
    createdAt: serverTimestamp()
  });
  return callRef.id;
};

export const watchIncomingCalls = (userUid: string, callback: (call: CallSession | null) => void) => {
  const q = query(
    collection(db, 'calls'),
    where('receiverUid', '==', userUid),
    where('status', '==', 'ringing'),
    limit(1)
  );
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) callback(null);
    else callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CallSession);
  });
};

export const updateCallStatus = async (callId: string, status: string) => {
  await updateDoc(doc(db, 'calls', callId), { status });
};

export const watchCallSession = (callId: string, callback: (call: CallSession) => void) => {
  return onSnapshot(doc(db, 'calls', callId), (snapshot) => {
    callback({ id: snapshot.id, ...snapshot.data() } as CallSession);
  });
};

export const watchCallLogs = (userUid: string, callback: (calls: CallSession[]) => void) => {
  const q = query(
    collection(db, 'calls'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as CallSession))
      .filter(call => call.callerUid === userUid || call.receiverUid === userUid)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(logs);
  });
};

// --- MODERATION ---
export const unfriend = async (roomId: string) => {
  await deleteDoc(doc(db, 'rooms', roomId));
};

export const blockUser = async (myUid: string, blockUid: string) => {
  const userRef = doc(db, 'users', myUid);
  await updateDoc(userRef, {
    blocked: arrayUnion(blockUid)
  });
};

// --- STORAGE ---
export const uploadFile = (roomId: string, file: File, onProgress: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `rooms/${roomId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => reject(error),
      () => getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject)
    );
  });
};
