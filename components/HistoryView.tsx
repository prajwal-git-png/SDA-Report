
import React, { useState } from 'react';
import { SaleEntry, UserProfile, BRANDS } from '../types.ts';

interface HistoryViewProps {
  sales: SaleEntry[];
  profile: UserProfile;
  onDelete: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ sales, profile, onDelete }) => {
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const filteredSales = sales.filter(s => {
    const brandMatch = filterBrand === 'All' || s.brandName === filterBrand;
    const typeMatch = filterType === 'All' || s.interactionType === filterType;
    return brandMatch && typeMatch;
  });

  const groupedByDate = filteredSales.reduce((groups: any, sale) => {
    const date = sale.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(sale);
    return groups;
  }, {});

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col space-y-4">
         <h2 className="text-3xl font-bold shiny-text px-1">Timeline</h2>
         <div className="flex space-x-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
            <select 
              value={filterBrand}
              onChange={e => setFilterBrand(e.target.value)}
              className="bg-[var(--card-bg)] border border-[var(--border)] text-[10px] font-black uppercase px-4 py-2 rounded-xl focus:outline-none min-w-[120px]"
            >
              <option value="All">Brands: All</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-[var(--card-bg)] border border-[var(--border)] text-[10px] font-black uppercase px-4 py-2 rounded-xl focus:outline-none min-w-[120px]"
            >
              <option value="All">Type: All</option>
              <option value="Sale">Sales</option>
              <option value="Enquiry">Enquiries</option>
              <option value="Leave">Leaves</option>
            </select>
         </div>
      </div>

      {dates.length === 0 ? (
        <div className="py-24 text-center">
           <div className="w-16 h-16 bg-gray-500/5 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-8 h-8 text-gray-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <p className="text-sm text-gray-500 font-medium italic">No activity matches your filters.</p>
        </div>
      ) : (
        <div className="space-y-10 relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-[var(--border)] z-0 opacity-20"></div>
          
          {dates.map(date => (
            <div key={date} className="space-y-5 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-24 h-7 bg-[var(--bg)] border border-[var(--border)] rounded-full flex items-center justify-center z-20">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                     {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                   </span>
                </div>
                <div className="h-px flex-1 bg-[var(--border)] opacity-20"></div>
              </div>
              
              <div className="space-y-4 pl-8">
                {groupedByDate[date].map((sale: SaleEntry) => (
                  <div key={sale.id} className="ios-card flex flex-col space-y-3 group border border-transparent hover:border-[var(--accent)]/20 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                           <span className={`w-2 h-2 rounded-full ${
                             sale.interactionType === 'Sale' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                             sale.interactionType === 'Enquiry' ? 'bg-orange-500' : 'bg-red-500'
                           }`}></span>
                           <h4 className="font-bold text-sm tracking-tight">{sale.productName}</h4>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {sale.brandName} {sale.interactionType === 'Sale' ? `• Qty ${sale.quantity} • ₹${(sale.price * sale.quantity).toLocaleString()}` : `• ${sale.interactionType}`}
                        </p>
                      </div>
                      <button 
                        onClick={() => onDelete(sale.id)}
                        className="text-gray-400 hover:text-red-500 p-1 opacity-40 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    {(sale.reasonForPurchase || sale.customerFeedback) && (
                      <div className="bg-gray-500/5 p-3 rounded-xl space-y-2">
                        {sale.reasonForPurchase && (
                          <div className="flex items-start space-x-2">
                             <span className="text-[8px] font-black uppercase bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">Remark</span>
                             <p className="text-[10px] font-semibold leading-snug">{sale.reasonForPurchase}</p>
                          </div>
                        )}
                        {sale.customerFeedback && (
                          <div className="flex items-start space-x-2">
                             <span className="text-[8px] font-black uppercase bg-gray-500/10 text-gray-500 px-1.5 py-0.5 rounded">Note</span>
                             <p className="text-[10px] opacity-60 italic leading-snug break-words">"{sale.customerFeedback}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
