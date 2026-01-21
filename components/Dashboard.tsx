
import React, { useState, useMemo } from 'react';
import { UserProfile, SaleEntry, PRODUCT_CATEGORIES } from '../types.ts';
import { reportService } from '../services/report.ts';

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
  const [copyFeedback, setCopyFeedback] = useState(false);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  // Weekly bounds (Mon-Sun)
  const currentWeekStart = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
  currentWeekStart.setDate(diff);
  currentWeekStart.setHours(0,0,0,0);
  
  const mtdEntries = sales.filter(s => new Date(s.date).getTime() >= monthStart);
  const weeklyEntries = sales.filter(s => new Date(s.date).getTime() >= currentWeekStart.getTime());

  const filteredEntries = mtdEntries.filter(e => viewScope === 'my' ? e.attendedBy === 'Me' : e.attendedBy === 'Other Staff');
  const mtdSales = filteredEntries.filter(e => e.interactionType === 'Sale');
  const mtdEnquiries = filteredEntries.filter(e => e.interactionType === 'Enquiry');
  const mtdRevenue = mtdSales.reduce((a, c) => a + (c.price * c.quantity), 0);
  const mtdWalkins = mtdEnquiries.reduce((a, c) => a + (c.walkins || 0), 0);

  const weeklyAttendanceData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = weeklyEntries.filter(e => e.date === dateStr && e.attendedBy === 'Me' && e.interactionType !== 'Leave');
      data.push({
        date: dateStr,
        day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        count: dayEntries.length
      });
    }
    return data;
  }, [weeklyEntries, currentWeekStart]);

  const weeklyAttendedTotal = weeklyAttendanceData.reduce((a, b) => a + b.count, 0);

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
        day: dayDate.toLocaleDateString('en-GB', { weekday: 'short' }),
        num: dayDate.getDate()
      });
    }
    return dates;
  }, []);

  const selectedEntries = sales.filter(s => s.date === selectedDate);
  const selectedRevenue = selectedEntries.filter(e => e.interactionType === 'Sale' && e.attendedBy === 'Me').reduce((a, c) => a + (c.price * c.quantity), 0);

  // Helper for formatted date display
  const formatDateStr = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const copyWhatsAppReport = () => {
    const dayTarget = Math.round(profile.weekTarget / 7);
    const dayAchievement = selectedRevenue;
    const weekTarget = profile.weekTarget;
    const weekAchievement = weeklyEntries
      .filter(e => e.interactionType === 'Sale' && e.attendedBy === 'Me')
      .reduce((a, c) => a + (c.price * c.quantity), 0);

    const reportText = `Date: *${formatDateStr(selectedDate)}*\nName: *${profile.name.toUpperCase()}*\nBrand: *${profile.brand.toUpperCase()}*\nDay Target: ${dayTarget}\nDay achievement: ${dayAchievement}\nWeek Target : ${weekTarget}\nWeek achievement : ${weekAchievement}\nEol target :00\nEol Achive :00`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

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
        <div className="flex space-x-2">
          <button 
            onClick={copyWhatsAppReport}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-green-500 active:scale-90 transition-all shadow-sm border-green-500/20"
            title="Copy WhatsApp Report"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </button>
          <button 
            onClick={() => reportService.generatePerformanceReport(profile, sales)}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[var(--accent)] active:scale-90 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
        </div>
      </header>

      {copyFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[3000] bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4">
          Report Copied for WhatsApp!
        </div>
      )}

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
              <span className="text-[7px] font-black uppercase mt-1 opacity-40 leading-none">{d.day}</span>
              <span className="text-[6px] font-bold opacity-20">{d.formattedDate}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mt-3 text-center">Tap to view full weekly breakdown</p>
      </div>

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

      <div 
        onClick={() => setShowDayReportCard(true)}
        className="ios-card glass border-[var(--accent)]/20 cursor-pointer active:scale-[0.98] transition-all bg-gradient-to-r from-[var(--accent)]/5 to-transparent flex justify-between items-center"
      >
        <div>
           <h3 className="font-bold text-sm">Log: {formatDateStr(selectedDate)}</h3>
           <p className="text-[9px] opacity-40 uppercase font-black tracking-widest mt-1">Detailed productivity card</p>
        </div>
        <div className="text-right">
           <span className="text-xs font-black text-blue-500">₹{selectedRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Redesigned Weekly Detailed Modal */}
      {showWeeklyDetail && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowWeeklyDetail(false)}></div>
          <div className="relative w-full max-w-sm bg-[#050505] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(10,132,255,0.25)] border border-white/10 flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-br from-[#111] to-black p-8 border-b border-white/5 relative">
               <button onClick={() => setShowWeeklyDetail(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Weekly Lead Audit</p>
               <h2 className="text-2xl font-black mt-2 text-white shiny-text">Traffic Analytics</h2>
               <div className="mt-8 flex justify-between items-end bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                  <div>
                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Total Attended</p>
                    <p className="text-4xl font-black text-white">{weeklyAttendedTotal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Efficiency</p>
                    <p className="text-2xl font-black text-green-500">{((weeklyAttendedTotal / 50) * 100).toFixed(0)}%</p>
                  </div>
               </div>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto flex-1 scrollbar-hide">
              {weeklyAttendanceData.map((d, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.06] transition-all">
                   <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-black text-white">{d.day}</p>
                        <p className="text-[10px] font-bold text-gray-500">{d.formattedDate}</p>
                      </div>
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">{d.count} Customers</p>
                   </div>
                   <div className="h-10 w-1.5 bg-blue-500/10 rounded-full relative overflow-hidden">
                      <div className="absolute bottom-0 w-full bg-blue-500 shadow-[0_0_10px_rgba(10,132,255,0.5)]" style={{ height: `${Math.min((d.count / 15) * 100, 100)}%` }} />
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Day Report Modal */}
      {showDayReportCard && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowDayReportCard(false)}></div>
          <div className="relative w-full max-w-sm bg-[#050505] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,149,0,0.15)] border border-white/10 flex flex-col max-h-[85vh]">
            <div className={`p-8 text-white relative border-b border-white/5 ${viewScope === 'my' ? 'bg-gradient-to-br from-blue-900/40 to-black' : 'bg-gradient-to-br from-orange-900/40 to-black'}`}>
               <button onClick={() => setShowDayReportCard(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">{viewScope === 'my' ? 'Self Audit' : 'Staff Assistance'}</p>
               <h2 className="text-2xl font-black mt-2 shiny-text">{new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</h2>
               <button 
                  onClick={copyWhatsAppReport}
                  className="mt-6 w-full py-4 bg-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
               >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  <span>Copy WhatsApp Report</span>
               </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
               {selectedEntries.filter(e => viewScope === 'my' ? e.attendedBy === 'Me' : e.attendedBy === 'Other Staff').map(e => (
                 <div key={e.id} className="p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-xs font-black text-white">{e.interactionType === 'Sale' ? `₹${(e.price*e.quantity).toLocaleString()}` : (e.walkins ? `${e.walkins} Enq` : e.interactionType)}</span>
                       <span className="text-[8px] font-black uppercase opacity-40 bg-white/5 px-2 py-1 rounded">{e.brandName}</span>
                    </div>
                    <p className="text-xs font-black text-blue-500 leading-tight">{e.category}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 mb-3">{e.productName}</p>
                    <div className="mt-2 pt-3 border-t border-white/5">
                       <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Audit Remark:</p>
                       <p className="text-[10px] font-medium leading-relaxed text-gray-300">{e.reasonForPurchase || 'No specific remark entered.'}</p>
                    </div>
                 </div>
               ))}
               {selectedEntries.length === 0 && <p className="text-center py-16 text-xs opacity-20 italic">No activity logs for this filter.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
