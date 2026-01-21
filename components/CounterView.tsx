
import React, { useState, useMemo, useRef } from 'react';
import { CounterLog, CounterCategory, BRANDS } from '../types';

interface CounterViewProps {
  logs: CounterLog[];
  onUpdate: (logs: CounterLog[]) => void;
}

const KITCHEN_PRODUCTS = ['Mixer Grinder', 'Air Fryer', 'OTG', 'Kettle', 'Induction', 'Juicer', 'Other Kitchen'];
const GARMENT_PRODUCTS = ['Steam Iron', 'Dry Iron', 'Garment Steamer', 'Other Garment'];
const HOME_PRODUCTS = ['Vacuum Cleaner', 'Air Purifier', 'Geyser', 'Fan', 'Other Home'];
const ALL_PRODUCTS = [...KITCHEN_PRODUCTS, ...GARMENT_PRODUCTS, ...HOME_PRODUCTS, 'Other'];

const CounterView: React.FC<CounterViewProps> = ({ logs, onUpdate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [newCat, setNewCat] = useState<CounterCategory>('Kitchen Care');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [customBrand, setCustomBrand] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newPurchased, setNewPurchased] = useState(false);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'All' | 'Sale' | 'Enquiry'>('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterProduct, setFilterProduct] = useState('All');

  const activeDate = new Date(selectedDate);
  const currentMonth = activeDate.getMonth();
  const currentYear = activeDate.getFullYear();

  const dayLogsRaw = logs.filter(l => l.date === selectedDate);
  
  const filteredLogs = useMemo(() => {
    return dayLogsRaw.filter(l => {
      const statusMatch = filterStatus === 'All' || 
                         (filterStatus === 'Sale' && l.hasPurchased) || 
                         (filterStatus === 'Enquiry' && !l.hasPurchased);
      const brandMatch = filterBrand === 'All' || l.brands.includes(filterBrand);
      const productMatch = filterProduct === 'All' || l.products.includes(filterProduct);
      return statusMatch && brandMatch && productMatch;
    });
  }, [dayLogsRaw, filterStatus, filterBrand, filterProduct]);

  const dayTotal = dayLogsRaw.length;
  const daySales = dayLogsRaw.filter(l => l.hasPurchased).length;

  const toggleProduct = (p: string) => {
    setSelectedProducts(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };

  const toggleBrand = (b: string) => {
    setSelectedBrands(prev => prev.includes(b) ? prev.filter(item => item !== b) : [...prev, b]);
  };

  const handleSaveLead = () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least one product.");
      return;
    }
    if (selectedBrands.length === 0 && !customBrand) {
      alert("Please select or enter a brand.");
      return;
    }

    const finalBrands = [...selectedBrands];
    if (customBrand && !finalBrands.includes(customBrand)) {
      finalBrands.push(customBrand);
    }

    if (editingLogId) {
      onUpdate(logs.map(l => l.id === editingLogId ? {
        ...l,
        hasPurchased: newPurchased,
        category: newCat,
        products: selectedProducts,
        brands: finalBrands,
        note: newNote
      } : l));
    } else {
      const newLog: CounterLog = {
        id: Math.random().toString(36).substr(2, 9),
        date: selectedDate,
        hasPurchased: newPurchased,
        timestamp: Date.now(),
        category: newCat,
        products: selectedProducts,
        brands: finalBrands,
        note: newNote
      };
      onUpdate([newLog, ...logs]);
    }
    resetForm();
  };

  const resetForm = () => {
    setNewNote('');
    setNewPurchased(false);
    setSelectedProducts([]);
    setSelectedBrands([]);
    setCustomBrand('');
    setShowAddForm(false);
    setEditingLogId(null);
  };

  const startEdit = (log: CounterLog) => {
    setEditingLogId(log.id);
    setNewCat(log.category);
    setSelectedProducts(log.products);
    
    // Split brands into known and custom
    const known = log.brands.filter(b => BRANDS.includes(b));
    const custom = log.brands.filter(b => !BRANDS.includes(b));
    
    setSelectedBrands(known);
    if (custom.length > 0) {
      setCustomBrand(custom[0]);
    }
    
    setNewNote(log.note);
    setNewPurchased(log.hasPurchased);
    setShowAddForm(true);
  };

  const deleteLead = (id: string) => {
    if (confirm("Delete this entry?")) {
      onUpdate(logs.filter(l => l.id !== id));
    }
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentYear, currentMonth, i).toISOString().split('T')[0]);
    return days;
  }, [currentMonth, currentYear]);

  const currentCategoryProducts = useMemo(() => {
    if (newCat === 'Kitchen Care') return KITCHEN_PRODUCTS;
    if (newCat === 'Garment Care') return GARMENT_PRODUCTS;
    if (newCat === 'Home Care') return HOME_PRODUCTS;
    return ['Other'];
  }, [newCat]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 relative pb-10">
      <header className="px-1 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black shiny-text">Counter</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Conversion Tracker</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => dateInputRef.current?.showPicker()}
            className="px-4 py-2 bg-gray-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center space-x-2"
          >
            <span>{activeDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
          </button>
          <input 
            ref={dateInputRef} 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="absolute opacity-0 pointer-events-none" 
          />
        </div>
      </header>

      <div className="ios-card glass !p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
            {activeDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">Sale / Walk-in</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={i} className="aspect-square" />;
            const isSelected = selectedDate === date;
            const dayEntries = logs.filter(l => l.date === date);
            const sold = dayEntries.filter(l => l.hasPurchased).length;
            const total = dayEntries.length;

            return (
              <div 
                key={i} 
                onClick={() => setSelectedDate(date)}
                className={`aspect-square relative rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 bg-blue-600/10' : 'bg-white/5'}`}
              >
                <span className={`text-[10px] font-black ${isSelected ? 'text-white' : 'text-gray-500'}`}>{new Date(date).getDate()}</span>
                {total > 0 && (
                  <span className={`text-[7px] font-black mt-0.5 ${sold > 0 ? 'text-green-500' : 'text-gray-600'}`}>
                    {sold}/{total}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="ios-card bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center py-6 shadow-blue-500/20 shadow-xl">
           <p className="text-[9px] font-black uppercase opacity-60 mb-2">Total Walk-ins</p>
           <p className="text-4xl font-black">{dayTotal}</p>
        </div>
        <div className="ios-card glass flex flex-col items-center justify-center py-6">
           <p className="text-[9px] font-black uppercase opacity-40 mb-2 text-green-500">Sales Closed</p>
           <p className="text-4xl font-black">{daySales}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest opacity-30">Quick Filters</h4>
          {(filterStatus !== 'All' || filterBrand !== 'All' || filterProduct !== 'All') && (
            <button 
              onClick={() => { setFilterStatus('All'); setFilterBrand('All'); setFilterProduct('All'); }}
              className="text-[9px] font-black text-red-500 uppercase tracking-widest"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="bg-gray-500/10 text-[9px] font-black uppercase px-4 py-2.5 rounded-xl min-w-[100px] text-gray-400 outline-none"
          >
            <option value="All">All Status</option>
            <option value="Enquiry">Enquiries</option>
            <option value="Sale">Closed Sales</option>
          </select>
          <select 
            value={filterBrand}
            onChange={e => setFilterBrand(e.target.value)}
            className="bg-gray-500/10 text-[9px] font-black uppercase px-4 py-2.5 rounded-xl min-w-[120px] text-gray-400 outline-none"
          >
            <option value="All">All Brands</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select 
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="bg-gray-500/10 text-[9px] font-black uppercase px-4 py-2.5 rounded-xl min-w-[130px] text-gray-400 outline-none"
          >
            <option value="All">All Products</option>
            {ALL_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {!showAddForm ? (
        <button 
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="w-full py-6 bg-blue-600 rounded-[32px] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center space-x-3"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span className="text-lg font-black text-white uppercase tracking-widest">Add Walk-in</span>
        </button>
      ) : (
        <div className="ios-card bg-white/5 p-6 space-y-6 animate-in slide-in-from-top-4 duration-300 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">{editingLogId ? 'Edit Entry' : 'New Customer Intent'}</h4>
            <button onClick={resetForm} className="text-[10px] font-black text-gray-500 uppercase">Cancel</button>
          </div>
          
          {/* Main Category */}
          <div className="space-y-2">
             <label className="text-[8px] font-black uppercase opacity-40 ml-1">Core Department</label>
             <div className="flex flex-wrap gap-2">
               {(['Garment Care', 'Kitchen Care', 'Home Care', 'Others'] as CounterCategory[]).map(cat => (
                 <button 
                  key={cat}
                  onClick={() => {
                    setNewCat(cat);
                    setSelectedProducts([]);
                  }}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${newCat === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-gray-500'}`}
                 >
                   {cat}
                 </button>
               ))}
             </div>
          </div>

          {/* Multiple Products */}
          <div className="space-y-2">
             <label className="text-[8px] font-black uppercase opacity-40 ml-1">Products Wanted (Multiple)</label>
             <div className="flex flex-wrap gap-2">
               {currentCategoryProducts.map(p => (
                 <button 
                  key={p}
                  onClick={() => toggleProduct(p)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${selectedProducts.includes(p) ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-transparent border-white/5 text-gray-500'}`}
                 >
                   {p}
                 </button>
               ))}
             </div>
          </div>

          {/* Multiple Brands */}
          <div className="space-y-2">
             <label className="text-[8px] font-black uppercase opacity-40 ml-1">Brands Interested (Multiple)</label>
             <div className="flex flex-wrap gap-2">
               {BRANDS.map(b => (
                 <button 
                  key={b}
                  onClick={() => toggleBrand(b)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${selectedBrands.includes(b) ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-transparent border-white/5 text-gray-500'}`}
                 >
                   {b}
                 </button>
               ))}
             </div>
             {(selectedBrands.includes('Other') || customBrand) && (
               <div className="mt-3 animate-in fade-in zoom-in-95 duration-200">
                 <input 
                  type="text"
                  placeholder="Enter manual brand name..."
                  value={customBrand}
                  onChange={e => setCustomBrand(e.target.value)}
                  className="w-full bg-black/40 rounded-xl px-4 py-3 text-xs font-bold border border-blue-500/30 outline-none focus:border-blue-500 transition-all"
                 />
               </div>
             )}
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase opacity-40 ml-2">Quick Note / Requirement</label>
            <textarea 
              placeholder="E.g. Price conscious, looking for high warranty..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="w-full bg-black/40 rounded-xl px-4 py-3 text-xs font-medium h-20 resize-none outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button 
            onClick={() => setNewPurchased(!newPurchased)}
            className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all ${newPurchased ? 'bg-green-600 shadow-lg shadow-green-600/20' : 'bg-white/5'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${newPurchased ? 'bg-white border-white' : 'border-gray-600'}`}>
              {newPurchased && <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg>}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{newPurchased ? 'Customer Purchased (Closed)' : 'Log as Enquiry'}</span>
          </button>

          <button 
            onClick={handleSaveLead}
            className="w-full py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            {editingLogId ? 'Update Interaction' : 'Register Customer'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-30 px-2">
          {filteredLogs.length} Records for {new Date(selectedDate).toLocaleDateString('en-GB')}
        </h4>
        {filteredLogs.map((l, i) => (
          <div key={l.id} className="ios-card glass flex flex-col p-4 animate-in fade-in slide-in-from-right-4 border border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-[10px] font-black opacity-20 w-4">#{filteredLogs.length - i}</span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {l.products.map(p => (
                      <span key={p} className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {l.brands.map(b => (
                      <span key={b} className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${l.hasPurchased ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className={`text-[8px] font-black uppercase mt-2 ${l.hasPurchased ? 'text-green-500' : 'text-orange-500'}`}>
                    {l.hasPurchased ? 'CONVERTED TO SALE' : 'POTENTIAL LEAD'} • {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => startEdit(l)}
                  className="text-blue-500/30 hover:text-blue-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => deleteLead(l.id)} className="text-red-500/20 active:text-red-500 transition-colors p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            {l.note && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[10px] text-gray-400 font-medium italic">"{l.note}"</p>
              </div>
            )}
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center py-20">
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <p className="text-xs opacity-30 italic">No matches found for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterView;
