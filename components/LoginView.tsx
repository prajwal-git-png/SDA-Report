
import React, { useState } from 'react';
import { UserProfile, BRANDS, PRODUCT_CATEGORIES } from '../types';

interface LoginProps {
  onComplete: (profile: UserProfile) => void;
}

const LoginView: React.FC<LoginProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    storeName: '',
    empId: '',
    brand: BRANDS[0],
    brandPortfolio: [],
    department: 'SDA',
    weekTarget: 50000,
    monthTarget: 200000
  });

  const togglePortfolio = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      brandPortfolio: prev.brandPortfolio.includes(cat)
        ? prev.brandPortfolio.filter(c => c !== cat)
        : [...prev.brandPortfolio, cat]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.brandPortfolio.length === 0) {
      alert("Please select at least one product family your brand covers.");
      return;
    }
    onComplete(formData);
  };

  return (
    <div className="h-screen bg-black flex flex-col px-8 pt-10 pb-24 overflow-y-auto max-w-md mx-auto animate-in fade-in duration-1000 scrollbar-hide">
      <div className="mb-8">
        <h1 className="text-4xl font-black shiny-text mb-2 tracking-tight">SDA PRO</h1>
        <p className="text-gray-400 font-medium">Configure your executive workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase ml-4">Full Name</label>
          <input 
            type="text" 
            placeholder="Executive Name"
            className="w-full bg-[#1c1c1e] border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 outline-none"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-4">Store</label>
            <input 
              type="text" 
              placeholder="Store Name"
              className="w-full bg-[#1c1c1e] border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.storeName}
              onChange={e => setFormData({...formData, storeName: e.target.value})}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-4">Emp ID</label>
            <input 
              type="text" 
              placeholder="ID"
              className="w-full bg-[#1c1c1e] border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 outline-none"
              value={formData.empId}
              onChange={e => setFormData({...formData, empId: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase ml-4">Assigned Brand</label>
          <select 
            className="w-full bg-[#1c1c1e] border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
            value={formData.brand}
            onChange={e => setFormData({...formData, brand: e.target.value})}
          >
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-blue-500 uppercase ml-4 tracking-widest">Brand Product Portfolio</label>
          <p className="text-[10px] text-gray-500 ml-4 -mt-2">Select families your brand manufactures</p>
          <div className="flex flex-wrap gap-2 px-2">
            {PRODUCT_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => togglePortfolio(cat)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                  formData.brandPortfolio.includes(cat)
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                    : 'bg-[#1c1c1e] border-white/5 text-gray-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-500 uppercase ml-4">Weekly Target (₹)</label>
              <input 
                type="number" 
                className="w-full bg-[#1c1c1e] border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.weekTarget}
                onChange={e => setFormData({...formData, weekTarget: Number(e.target.value)})}
              />
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-bold text-green-500 uppercase ml-4">Monthly Target (₹)</label>
              <input 
                type="number" 
                className="w-full bg-[#1c1c1e] border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.monthTarget}
                onChange={e => setFormData({...formData, monthTarget: Number(e.target.value)})}
              />
           </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-3xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-blue-600/30"
        >
          Initialize Workspace
        </button>
      </form>
    </div>
  );
};

export default LoginView;
