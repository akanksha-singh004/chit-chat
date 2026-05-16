import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useRooms } from './context/RoomContext';
import Login from './components/Login';
import NavigationSidebar from './components/NavigationSidebar';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import Settings from './components/Settings';
import PeopleList from './components/PeopleList';
import RequestList from './components/RequestList';
import PublicRooms from './components/PublicRooms';
import CallLogList from './components/CallLogList';
import Onboarding from './components/Onboarding';
import CallManager from './components/CallManager';

function AppContent() {
  const { user, profile } = useAuth();
  const { activeRoomId } = useRooms();
  const [activeTab, setActiveTab] = useState('chats');

  if (!user) {
    return <Login />;
  }

  if (user && profile && !profile.username) {
    return <Onboarding />;
  }

  return (
    <div className="flex h-[100dvh] bg-white overflow-hidden transition-colors duration-300 relative">
      {/* Hide sidebar and panels on mobile when a chat is active */}
      <div className={`flex-shrink-0 flex h-full ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        <NavigationSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="w-[calc(100vw-80px)] md:w-[320px] flex-shrink-0 relative overflow-hidden border-r border-slate-100">
          {/* Conditional Side Panels - IDs synced with NavigationSidebar */}
          {activeTab === 'chats' && <ChatList onAddClick={() => setActiveTab('people')} />}
          {activeTab === 'people' && <PeopleList />}
          {activeTab === 'calls' && <CallLogList />}
          {activeTab === 'groups' && <PublicRooms />}
          {activeTab === 'requests' && <RequestList />}
          {activeTab === 'settings' && <Settings onClose={() => setActiveTab('chats')} />}
        </div>
      </div>

      {/* Hide ChatWindow on mobile when no chat is active */}
      <div className={`flex-1 min-w-0 flex flex-col h-full ${activeRoomId ? 'flex' : 'hidden md:flex'}`}>
        <ChatWindow />
      </div>

      <CallManager />
    </div>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;
