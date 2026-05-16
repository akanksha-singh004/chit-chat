import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Room, watchRooms } from '../lib/chat';
import { useAuth } from './AuthContext';

interface RoomContextType {
  rooms: Room[];
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  loading: boolean;
}

const RoomContext = createContext<RoomContextType | null>(null);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }

    const unsubscribe = watchRooms(user.uid, (data) => {
      setRooms(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <RoomContext.Provider value={{ rooms, activeRoomId, setActiveRoomId, loading }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error("useRooms must be used within a RoomProvider");
  return context;
};
