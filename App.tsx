
import React, { useState, useEffect } from 'react';
import { UserProfile, SaleEntry } from './types.ts';
import { storage } from './services/storage.ts';
import LoginView from './components/LoginView.tsx';
import Dashboard from './components/Dashboard.tsx';
import EntryForm from './components/EntryForm.tsx';
import ProfileView from './components/ProfileView.tsx';
import HistoryView from './components/HistoryView.tsx';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'history' | 'profile'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const data = storage.get();
      setProfile(data.profile);
      setSales(data.sales);
      
      const savedTheme = localStorage.getItem('SDA_THEME') as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      } else {
        document.body.setAttribute('data-theme', 'dark');
      }
    } catch (err) {
      console.error("Initialization error:", err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('SDA_THEME', nextTheme);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    storage.save({ profile: newProfile, sales });
  };

  const handleAddSale = (entry: SaleEntry) => {
    const newSales = [entry, ...sales];
    setSales(newSales);
    storage.save({ profile, sales: newSales });
    setActiveTab('dashboard');
  };

  const handleDeleteSale = (id: string) => {
    const newSales = sales.filter(s => s.id !== id);
    setSales(newSales);
    storage.save({ profile, sales: newSales });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black">
        <div className="loader-ring"><div></div><div></div><div></div><div></div></div>
        <h1 className="mt-8 text-2xl font-bold shiny-text">SDA PRO</h1>
      </div>
    );
  }

  if (!profile) {
    return <LoginView onComplete={handleUpdateProfile} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-32 px-5 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            profile={profile} 
            sales={sales} 
            onViewHistory={() => setActiveTab('history')}
          />
        )}
        {activeTab === 'add' && (
          <EntryForm 
            profile={profile} 
            onSave={handleAddSale} 
          />
        )}
        {activeTab === 'history' && (
          <HistoryView 
            sales={sales} 
            profile={profile} 
            onDelete={handleDeleteSale}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView 
            profile={profile} 
            onUpdate={handleUpdateProfile} 
            theme={theme}
            toggleTheme={toggleTheme}
            onImport={(data) => {
              setProfile(data.profile);
              setSales(data.sales);
            }}
          />
        )}
      </main>

      <nav className="dock glass">
        <TabItem icon="dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <TabItem icon="add" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
        <TabItem icon="history" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <TabItem icon="profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </nav>
    </div>
  );
};

const TabItem = ({ icon, active, onClick }: any) => {
  const icons: any = {
    dashboard: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    add: <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-blue-600 scale-110' : 'bg-gray-800'}`}><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>,
    history: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    profile: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  };

  return (
    <button onClick={onClick} className={`transition-all duration-300 ${active ? 'text-blue-500 transform scale-110' : 'text-gray-500'}`}>
      {icons[icon]}
    </button>
  );
};

export default App;
