
import React, { useState, useMemo } from 'react';
import { UserProfile, SaleEntry, PRODUCT_CATEGORIES } from '../types';
import { reportService } from '../services/report';

interface DashboardProps {
  profile: UserProfile;
  sales: SaleEntry[];
  onViewHistory: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, sales, onViewHistory }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewScope, setViewScope] = useState<'my' | 'others'>('my');
  const [showDayReportCard, setShowDayReportCard] = useState(false);
  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  // Weekly bounds (Mon-Sun)
  const currentWeekStart = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  currentWeekStart.setDate(diff);
  currentWeekStart.setHours(0,0,0,0);
  
  const mtdEntries = sales.filter(s => new Date(s.date).getTime() >= monthStart);
  const weeklyEntries = sales.filter(s => new Date(s.date).getTime() >= currentWeekStart.getTime());

  // Metrics filtering
  const filteredEntries = mtdEntries.filter(e => viewScope === 'my' ? e.attendedBy === 'Me' : e.attendedBy === 'Other Staff');
  const mtdSales = filteredEntries.filter(e => e.interactionType === 'Sale');
  const mtdEnquiries = filteredEntries.filter(e => e.interactionType === 'Enquiry');
  const mtdRevenue = mtdSales.reduce((a, c) => a + (c.price * c.quantity), 0);
  const mtdWalkins = mtdEnquiries.reduce((a, c) => a + (c.walkins || 0), 0);

  // Weekly Attendance (Customers attended throughout the week)
  const weeklyAttendanceData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = weeklyEntries.filter(e => e.date === dateStr && e.attendedBy === 'Me' && e.interactionType !== 'Leave');
      data.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayEntries.length
      });
    }
    return data;
  }, [weeklyEntries, currentWeekStart]);

  const weeklyAttendedTotal = weeklyAttendanceData.reduce((a, b) => a + b.count, 0);

  // Family-wise (Category) Weekly Report
  const weeklyFamilyReport = useMemo(() => {
    return PRODUCT_CATEGORIES.map(cat => {
      const catWeekly = weeklyEntries.filter(e => e.category === cat && (viewScope === 'my' ? e.attendedBy === 'Me' : e.attendedBy === 'Other Staff'));
      const salesCount = catWeekly.filter(e => e.interactionType === 'Sale').length;
      const walkins = catWeekly.filter(e => e.interactionType === 'Enquiry').reduce((a, c) => a + (c.walkins || 0), 0);
      const rev = catWeekly.filter(e => e.interactionType === 'Sale').reduce((a, c) => a + (c.price * c.quantity), 0);
      const totalPotential = salesCount + walkins;
      const salesRate = totalPotential > 0 ? (salesCount / totalPotential) * 100 : 0;
      return { category: cat, walkins, salesCount, salesRate, rev };
    }).filter(f => f.walkins > 0 || f.salesCount > 0).sort((a, b) => b.rev - a.rev);
  }, [weeklyEntries, viewScope]);

  const calendarDates = useMemo(() => {
    const dates = [];
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff)).setHours(0,0,0,0);
    const start = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);
      dates.push({
        date: dayDate.toISOString().split('T')[0],
        day: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        num: dayDate.getDate()
      });
    }
    return dates;
  }, []);

  const selectedEntries = sales.filter(s => s.date === selectedDate);
  const selectedRevenue = selectedEntries.filter(e => e.interactionType === 'Sale').reduce((a, c) => a + (c.price * c.quantity), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 relative">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
            {profile.photo ? <img src={profile.photo} className="w-full h-full object-cover" /> : <span className="font-bold text-white text-xl">{profile.name[0]}</span>}
          </div>
          <div>
            <h1 className="text-xl font-black shiny-text leading-tight">{profile.name}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{profile.storeName}</p>
          </div>
        </div>
        <button 
          onClick={() => reportService.generatePerformanceReport(profile, sales)}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[var(--accent)] active:scale-90 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </button>
      </header>

      {/* Report Toggle - My vs Others */}
      <div className="flex p-1 bg-gray-500/10 rounded-2xl border border-white/5">
        <button 
          onClick={() => setViewScope('my')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === 'my' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
        >
          My Sales Report
        </button>
        <button 
          onClick={() => setViewScope('others')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === 'others' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500'}`}
        >
          Others Sales Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`ios-card border-none shadow-xl text-white ${viewScope === 'my' ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20' : 'bg-gradient-to-br from-orange-600 to-red-700 shadow-orange-500/20'}`}>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{viewScope === 'my' ? 'Personal' : 'Assisted'} Revenue</p>
           <p className="text-2xl font-black">₹{mtdRevenue.toLocaleString()}</p>
           <div className="mt-4 w-full bg-white/20 h-1 rounded-full">
              <div className="bg-white h-full" style={{ width: `${Math.min((mtdRevenue/profile.monthTarget)*100, 100)}%` }} />
           </div>
        </div>
        <div className="ios-card glass border-orange-500/20 shadow-lg">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-orange-500">Customers Seen</p>
           <p className="text-2xl font-black">{mtdWalkins + mtdSales.length}</p>
           <p className="text-[9px] mt-2 opacity-50 uppercase font-black">Total Interactions</p>
        </div>
      </div>

      {/* Weekly Attendance Analysis */}
      <div 
        onClick={() => setShowWeeklyDetail(true)}
        className="ios-card glass !p-5 cursor-pointer hover:border-blue-500/30 transition-all active:scale-[0.98]"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Weekly Traffic Audit</p>
            <h4 className="text-lg font-black">{weeklyAttendedTotal} Total Leads</h4>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">Efficiency</p>
             <p className="text-xs font-black text-green-500">MTD {((mtdSales.length / (mtdSales.length + mtdWalkins || 1)) * 100).toFixed(0)}% CR</p>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-12 gap-1 px-2">
          {weeklyAttendanceData.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t-md transition-all duration-700 ${d.date === selectedDate ? 'bg-blue-500' : 'bg-blue-500/20'}`}
                style={{ height: `${Math.max((d.count / (Math.max(...weeklyAttendanceData.map(x => x.count)) || 1)) * 100, 5)}%` }}
              />
              <span className="text-[8px] font-black uppercase mt-1 opacity-40">{d.day}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mt-3 text-center">Tap to view full weekly breakdown</p>
      </div>

      {/* Category Performance Breakdown */}
      <div className="ios-card glass">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Family Report ({viewScope === 'my' ? 'My' : 'Others'})</h3>
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Conversion Rate</span>
        </div>
        <div className="space-y-4">
           {weeklyFamilyReport.map(insight => (
             <div key={insight.category} className="space-y-2 group">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-xs font-black">{insight.category}</p>
                      <p className="text-[9px] opacity-40 font-black uppercase mt-0.5">
                        {insight.walkins} Enq • {insight.salesCount} Sales
                      </p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-blue-500">{insight.salesRate.toFixed(0)}% Rate</p>
                      <p className="text-[9px] font-bold opacity-30">₹{insight.rev.toLocaleString()}</p>
                   </div>
                </div>
                <div className="w-full bg-gray-500/10 h-1.5 rounded-full overflow-hidden flex">
                   <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${insight.salesRate}%` }} />
                </div>
             </div>
           ))}
           {weeklyFamilyReport.length === 0 && <p className="text-center py-6 text-xs opacity-30 italic">No activity for this scope this week</p>}
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="ios-card glass !p-4">
        <div className="calendar-strip">
          {calendarDates.map(d => {
            const hasSale = sales.some(s => s.date === d.date && s.interactionType === 'Sale');
            return (
              <div 
                key={d.date} 
                onClick={() => setSelectedDate(d.date)}
                className={`calendar-day ${selectedDate === d.date ? 'active' : 'glass'}`}
              >
                <span className={`text-[9px] font-bold uppercase ${selectedDate === d.date ? 'text-white' : 'text-gray-500'}`}>{d.day}</span>
                <span className="text-lg font-bold">{d.num}</span>
                {hasSale && <div className={`absolute bottom-2 w-1 h-1 rounded-full ${selectedDate === d.date ? 'bg-white' : 'bg-green-500'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Review Trigger */}
      <div 
        onClick={() => setShowDayReportCard(true)}
        className="ios-card glass border-[var(--accent)]/20 cursor-pointer active:scale-[0.98] transition-all bg-gradient-to-r from-[var(--accent)]/5 to-transparent flex justify-between items-center"
      >
        <div>
           <h3 className="font-bold text-sm">Log: {new Date(selectedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</h3>
           <p className="text-[9px] opacity-40 uppercase font-black tracking-widest mt-1">Detailed productivity card</p>
        </div>
        <div className="text-right">
           <span className="text-xs font-black text-blue-500">₹{selectedRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Weekly Detailed Audit Modal */}
      {showWeeklyDetail && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={() => setShowWeeklyDetail(false)}></div>
          <div className="relative w-full max-w-sm bg-[var(--card-bg)] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-800 p-8 text-white relative">
               <button onClick={() => setShowWeeklyDetail(false)} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Weekly Lead Audit</p>
               <h2 className="text-2xl font-black mt-1">Week Attendance</h2>
               <div className="mt-6 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black opacity-60 uppercase">Total Attended</p>
                    <p className="text-3xl font-black">{weeklyAttendedTotal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black opacity-60 uppercase">Target Effort</p>
                    <p className="text-xl font-black">{((weeklyAttendedTotal / 50) * 100).toFixed(0)}%</p>
                  </div>
               </div>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto flex-1 scrollbar-hide">
              {weeklyAttendanceData.map((d, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                   <div>
                      <p className="text-xs font-black">{d.day}, {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                      <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">{d.count} Customers Handled</p>
                   </div>
                   <div className="h-8 w-1 bg-blue-500/20 rounded-full relative overflow-hidden">
                      <div className="absolute bottom-0 w-full bg-blue-500" style={{ height: `${(d.count / (Math.max(...weeklyAttendanceData.map(x => x.count)) || 1)) * 100}%` }} />
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day Report Modal */}
      {showDayReportCard && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={() => setShowDayReportCard(false)}></div>
          <div className="relative w-full max-w-sm bg-[var(--card-bg)] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 flex flex-col max-h-[85vh]">
            <div className={`p-8 text-white relative ${viewScope === 'my' ? 'bg-gradient-to-br from-blue-600 to-indigo-800' : 'bg-gradient-to-br from-orange-600 to-red-800'}`}>
               <button onClick={() => setShowDayReportCard(false)} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{viewScope === 'my' ? 'My Term Audit' : 'Staff Assistance'}</p>
               <h2 className="text-2xl font-black mt-1">{new Date(selectedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</h2>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
               {selectedEntries.filter(e => viewScope === 'my' ? e.attendedBy === 'Me' : e.attendedBy === 'Other Staff').map(e => (
                 <div key={e.id} className={`p-4 rounded-2xl border transition-all ${
                   e.brandName.toLowerCase() === profile.brand.toLowerCase() 
                     ? 'bg-blue-600/5 border-blue-500/20' 
                     : 'bg-red-600/5 border-red-500/10'
                 }`}>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-black">{e.interactionType === 'Sale' ? `₹${(e.price*e.quantity).toLocaleString()}` : (e.walkins ? `${e.walkins} Enq` : e.interactionType)}</span>
                       <span className="text-[8px] font-black uppercase opacity-40">{e.brandName}</span>
                    </div>
                    <p className="text-xs font-black leading-tight">{e.category} | {e.productName}</p>
                    <div className="mt-2 pt-2 border-t border-white/5">
                       <p className="text-[9px] font-black text-blue-500 uppercase">Context:</p>
                       <p className="text-[10px] font-medium leading-relaxed opacity-80">{e.reasonForPurchase}</p>
                    </div>
                 </div>
               ))}
               {selectedEntries.length === 0 && <p className="text-center py-10 text-xs opacity-30 italic">No activity matching filter on this date</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
