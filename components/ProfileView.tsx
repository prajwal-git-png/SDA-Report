
import React, { useState } from 'react';
import { UserProfile, PRODUCT_CATEGORIES } from '../types';
import { storage } from '../services/storage';

interface ProfileProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onImport: (data: any) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ProfileView: React.FC<ProfileProps> = ({ profile, onUpdate, onImport, theme, toggleTheme }) => {
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [tempTargets, setTempTargets] = useState({ week: profile.weekTarget, month: profile.monthTarget });
  const [isEditingPortfolio, setIsEditingPortfolio] = useState(false);
  const [tempPortfolio, setTempPortfolio] = useState<string[]>(profile.brandPortfolio || []);

  const handleSaveTargets = () => {
    onUpdate({ ...profile, weekTarget: tempTargets.week, monthTarget: tempTargets.month });
    setIsEditingTargets(false);
  };

  const togglePortfolioItem = (cat: string) => {
    setTempPortfolio(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSavePortfolio = () => {
    onUpdate({ ...profile, brandPortfolio: tempPortfolio });
    setIsEditingPortfolio(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ ...profile, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
      <header className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-3xl font-black shiny-text">Settings</h2>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Manage your workspace</p>
        </div>
        <button onClick={toggleTheme} className="p-3 glass rounded-2xl active:scale-90 transition-all border-none">
          {theme === 'dark' ? (
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
          ) : (
            <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          )}
        </button>
      </header>

      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-32 h-32 rounded-[40px] bg-gray-800 flex items-center justify-center font-black text-3xl overflow-hidden border-4 border-[var(--accent)]/20 shadow-2xl relative">
            {profile.photo ? <img src={profile.photo} className="w-full h-full object-cover" /> : <span className="text-white">{profile.name[0]}</span>}
          </div>
          <label className="absolute bottom-[-8px] right-[-8px] bg-[var(--accent)] text-white p-3 rounded-2xl cursor-pointer shadow-lg active:scale-90 transition-all border-4 border-[var(--bg)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
        <h3 className="mt-8 text-2xl font-black tracking-tight">{profile.name}</h3>
        <p className="text-[var(--accent)] font-black text-[10px] tracking-[0.3em] uppercase mt-1">{profile.brand} Specialist</p>
      </div>

      {/* Brand Portfolio Editor */}
      <div className="ios-card space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Brand Portfolio</h4>
          <button 
            onClick={() => isEditingPortfolio ? handleSavePortfolio() : setIsEditingPortfolio(true)}
            className="text-xs font-black text-[var(--accent)]"
          >
            {isEditingPortfolio ? 'Save' : 'Edit Families'}
          </button>
        </div>
        {isEditingPortfolio ? (
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => togglePortfolioItem(cat)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                  tempPortfolio.includes(cat)
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                    : 'bg-gray-500/5 border-white/5 text-gray-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(profile.brandPortfolio || []).map(cat => (
              <span key={cat} className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/10">
                {cat}
              </span>
            ))}
            {(!profile.brandPortfolio || profile.brandPortfolio.length === 0) && <p className="text-xs opacity-30 italic">No families assigned</p>}
          </div>
        )}
      </div>

      {/* Target Management */}
      <div className="ios-card space-y-5">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Targets</h4>
          <button onClick={() => isEditingTargets ? handleSaveTargets() : setIsEditingTargets(true)} className="text-xs font-black text-[var(--accent)]">
            {isEditingTargets ? 'Save' : 'Adjust'}
          </button>
        </div>
        <div className="space-y-4">
           <div className="bg-gray-500/5 p-4 rounded-2xl border border-[var(--border)]">
              <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Weekly Goal</p>
              {isEditingTargets ? (
                <input type="number" value={tempTargets.week} onChange={e => setTempTargets({...tempTargets, week: Number(e.target.value)})} className="w-full bg-transparent border-none text-[var(--text)] font-black text-xl outline-none" />
              ) : (
                <p className="text-xl font-black">₹{profile.weekTarget.toLocaleString()}</p>
              )}
           </div>
           <div className="bg-gray-500/5 p-4 rounded-2xl border border-[var(--border)]">
              <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Monthly Goal</p>
              {isEditingTargets ? (
                <input type="number" value={tempTargets.month} onChange={e => setTempTargets({...tempTargets, month: Number(e.target.value)})} className="w-full bg-transparent border-none text-[var(--text)] font-black text-xl outline-none" />
              ) : (
                <p className="text-xl font-black">₹{profile.monthTarget.toLocaleString()}</p>
              )}
           </div>
        </div>
      </div>

      {/* Data Operations */}
      <div className="ios-card space-y-4">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Maintenance</h4>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={storage.exportData} className="flex flex-col items-center justify-center space-y-3 py-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 active:scale-95">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4 4m4 4V4" /></svg>
            <span className="text-[9px] font-black uppercase text-blue-500">Export</span>
          </button>
          
          <label className="flex flex-col items-center justify-center space-y-3 py-6 bg-green-500/5 rounded-3xl border border-green-500/10 active:scale-95 cursor-pointer">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[9px] font-black uppercase text-green-500">Restore</span>
            <input type="file" accept=".json" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const success = storage.importData(ev.target?.result as string);
                  if (success) { onImport(storage.get()); alert("Restore Successful."); }
                };
                reader.readAsText(file);
              }
            }} className="hidden" />
          </label>
        </div>
      </div>

      <div className="pt-6">
        {/* Fix: Avoid testing void values in logical AND expression by using a proper function block */}
        <button onClick={() => {
          if (confirm("Erase all data?")) {
            localStorage.clear();
            window.location.reload();
          }
        }} className="w-full py-5 text-red-500 font-black text-xs uppercase tracking-[0.2em] bg-red-500/5 rounded-3xl border border-red-500/10 active:scale-95">
          Factory Reset
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
