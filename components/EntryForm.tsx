
import React, { useState, useEffect } from 'react';
import { UserProfile, SaleEntry, BRANDS, REASONS, InteractionType, LeaveType, PRODUCT_CATEGORIES, AttendedBy } from '../types';

interface EntryFormProps {
  profile: UserProfile;
  initialEntry?: SaleEntry;
  onSave: (entry: SaleEntry) => void;
  onCancel?: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ profile, initialEntry, onSave, onCancel }) => {
  const [type, setType] = useState<InteractionType>(initialEntry?.interactionType || 'Sale');
  const [attendedBy, setAttendedBy] = useState<AttendedBy>(initialEntry?.attendedBy || 'Me');
  const [date, setDate] = useState(initialEntry?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(initialEntry?.category || PRODUCT_CATEGORIES[0]);
  const [productName, setProductName] = useState(initialEntry?.productName || '');
  const [brand, setBrand] = useState(initialEntry?.brandName || profile.brand);
  const [quantity, setQuantity] = useState(initialEntry?.quantity || 1);
  const [price, setPrice] = useState<number>(initialEntry?.price || 0);
  const [reason, setReason] = useState(initialEntry?.reasonForPurchase || REASONS[0]);
  const [feedback, setFeedback] = useState(initialEntry?.customerFeedback || '');
  const [walkins, setWalkins] = useState<number>(initialEntry?.walkins || 1);
  const [leaveType, setLeaveType] = useState<LeaveType>(initialEntry?.leaveType || 'Week Off');

  // If initialEntry changes, reset state
  useEffect(() => {
    if (initialEntry) {
      setType(initialEntry.interactionType);
      setAttendedBy(initialEntry.attendedBy);
      setDate(initialEntry.date);
      setCategory(initialEntry.category);
      setProductName(initialEntry.productName);
      setBrand(initialEntry.brandName);
      setQuantity(initialEntry.quantity);
      setPrice(initialEntry.price);
      setReason(initialEntry.reasonForPurchase as any);
      setFeedback(initialEntry.customerFeedback);
      setWalkins(initialEntry.walkins || 1);
      setLeaveType(initialEntry.leaveType || 'Week Off');
    }
  }, [initialEntry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: SaleEntry = {
      id: initialEntry?.id || Math.random().toString(36).substr(2, 9),
      date,
      interactionType: type,
      category: type === 'Leave' ? 'Internal' : category,
      productName: type === 'Leave' ? `Leave: ${leaveType}` : (productName || category),
      brandName: type === 'Leave' ? 'Internal' : brand,
      quantity: type === 'Sale' ? quantity : 0,
      price: type === 'Sale' ? price : 0,
      reasonForPurchase: type === 'Leave' ? leaveType : reason,
      customerFeedback: feedback,
      isOwnBrand: brand.toLowerCase() === profile.brand.toLowerCase(),
      attendedBy: type === 'Leave' ? 'Me' : attendedBy,
      walkins: type === 'Enquiry' ? walkins : undefined,
      leaveType: type === 'Leave' ? leaveType : 'None'
    };
    onSave(entry);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold shiny-text">{initialEntry ? 'Edit Log' : 'New Log'}</h2>
        <div className="flex bg-[var(--card-bg)] p-1 rounded-2xl shadow-inner">
          {(['Sale', 'Enquiry', 'Leave'] as InteractionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                type === t ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {type !== 'Leave' && (
          <div className="ios-card shadow-lg">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Attended By</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Me', 'Other Staff'] as AttendedBy[]).map(att => (
                <button
                  key={att}
                  type="button"
                  onClick={() => setAttendedBy(att)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    attendedBy === att 
                      ? 'bg-blue-600/10 text-blue-500 shadow-sm font-black' 
                      : 'bg-transparent text-gray-500 font-bold'
                  }`}
                >
                  {att === 'Me' ? 'Myself (Term)' : 'Other Staff'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ios-card shadow-lg">
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Activity Date</label>
          <input 
            type="date" 
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium"
          />
        </div>

        {type !== 'Leave' && (
          <>
            <div className="ios-card shadow-lg">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Family / Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium appearance-none"
              >
                {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[var(--card-bg)] text-white">{cat}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="ios-card shadow-lg">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Select Brand</label>
                <select 
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold appearance-none"
                >
                  {BRANDS.map(b => <option key={b} value={b} className="bg-[var(--card-bg)] text-white">{b}</option>)}
                </select>
              </div>
              <div className="ios-card shadow-lg">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">
                  {type === 'Sale' ? 'Sales Qty' : 'Enquiry Count'}
                </label>
                <input 
                  type="number" 
                  value={type === 'Sale' ? quantity : walkins}
                  onChange={e => type === 'Sale' ? setQuantity(Number(e.target.value)) : setWalkins(Number(e.target.value))}
                  className="w-full bg-transparent border-none focus:ring-0 text-lg font-black"
                  min="1"
                />
              </div>
            </div>

            <div className="ios-card shadow-lg">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Product / Model Name</label>
              <input 
                type="text" 
                placeholder="e.g. GX-100 750W Mixer"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium"
                required={type === 'Sale'}
              />
            </div>
          </>
        )}

        {type === 'Sale' && (
          <div className="ios-card shadow-lg">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Sale Value (₹)</label>
            <input 
              type="number" 
              placeholder="Total amount"
              value={price || ''}
              onChange={e => setPrice(Number(e.target.value))}
              className="w-full bg-transparent border-none text-[var(--accent)] focus:ring-0 text-xl font-black"
              required
            />
          </div>
        )}

        {type === 'Leave' && (
          <div className="ios-card shadow-lg">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Leave Reason</label>
            <select 
              value={leaveType}
              onChange={e => setLeaveType(e.target.value as LeaveType)}
              className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium appearance-none"
            >
              <option value="Week Off" className="bg-[var(--card-bg)] text-white">Week Off</option>
              <option value="Sick Leave" className="bg-[var(--card-bg)] text-white">Sick Leave</option>
            </select>
          </div>
        )}

        {type !== 'Leave' && (
          <div className="ios-card shadow-lg">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">
              {brand.toLowerCase() !== profile.brand.toLowerCase() ? 'Why Competitor Brand?' : 'Key Pivot Point'}
            </label>
            <select 
              value={reason}
              onChange={e => setReason(e.target.value as any)}
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-blue-500 appearance-none"
            >
              {REASONS.map(r => <option key={r} value={r} className="bg-[var(--card-bg)] text-white">{r}</option>)}
            </select>
          </div>
        )}

        <div className="ios-card shadow-lg">
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Audit Feedback / Remarks</label>
          <textarea 
            placeholder={type === 'Leave' ? 'Note for leave...' : (brand.toLowerCase() !== profile.brand.toLowerCase() ? 'Detail why your brand missed this sale...' : 'Customer reaction or specific requirement...')}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm h-24 resize-none leading-relaxed"
          />
        </div>

        <div className="flex space-x-3">
          {initialEntry && onCancel && (
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-5 rounded-3xl font-black text-lg bg-gray-500/10 text-gray-400 active:scale-95 transition-all"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit"
            className={`flex-[2] py-5 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all text-white ${
              type === 'Sale' ? 'bg-[var(--accent)] shadow-[var(--accent-glow)]' : 
              type === 'Enquiry' ? 'bg-orange-600 shadow-orange-600/20' : 'bg-red-600 shadow-red-600/20'
            }`}
          >
            {initialEntry ? 'Update Entry' : (type === 'Sale' ? 'Register Sale' : type === 'Enquiry' ? 'Log Enquiry' : 'Confirm Leave')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntryForm;
