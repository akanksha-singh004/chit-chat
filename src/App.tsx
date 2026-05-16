import { useState } from 'react';
import { useAuth } from './context/AuthContext';
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
  const [activeTab, setActiveTab] = useState('chats');

  if (!user) {
    return <Login />;
  }

  if (user && profile && !profile.username) {
    return <Onboarding />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden transition-colors duration-300">
      {/* Prop name fixed to onTabChange to match NavigationSidebar component */}
      <NavigationSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="w-[320px] flex-shrink-0 relative overflow-hidden border-r border-slate-100">
        {/* Conditional Side Panels - IDs synced with NavigationSidebar */}
        {activeTab === 'chats' && <ChatList onAddClick={() => setActiveTab('people')} />}
        {activeTab === 'people' && <PeopleList />}
        {activeTab === 'calls' && <CallLogList />}
        {activeTab === 'groups' && <PublicRooms />}
        {activeTab === 'requests' && <RequestList />}
        {activeTab === 'settings' && <Settings onClose={() => setActiveTab('chats')} />}
      </div>

      <ChatWindow />
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
