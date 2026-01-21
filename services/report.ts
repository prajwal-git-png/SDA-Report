
import { UserProfile, SaleEntry, PRODUCT_CATEGORIES } from '../types.ts';

export const reportService = {
  generatePerformanceReport: (profile: UserProfile, sales: SaleEntry[]) => {
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    
    // Date bounds
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0,0,0,0);

    const mtdEntries = sales.filter(s => new Date(s.date).getTime() >= monthStart);
    const weeklyEntries = sales.filter(s => new Date(s.date).getTime() >= currentWeekStart.getTime());

    const myEntries = mtdEntries.filter(e => e.attendedBy === 'Me');
    const staffEntries = mtdEntries.filter(e => e.attendedBy === 'Other Staff');
    
    const myRevenue = myEntries.filter(e => e.interactionType === 'Sale').reduce((a,c) => a + (c.price * c.quantity), 0);
    const staffRevenue = staffEntries.filter(e => e.interactionType === 'Sale').reduce((a,c) => a + (c.price * c.quantity), 0);
    
    const weeklyAttendedCount = weeklyEntries.filter(e => e.attendedBy === 'Me' && e.interactionType !== 'Leave').length;

    const weeklyFamilyAudit = PRODUCT_CATEGORIES.map(cat => {
      const catWeekly = weeklyEntries.filter(e => e.category === cat);
      const salesCount = catWeekly.filter(e => e.interactionType === 'Sale').length;
      const walkins = catWeekly.filter(e => e.interactionType === 'Enquiry').reduce((a, c) => a + (c.walkins || 0), 0);
      const units = catWeekly.filter(e => e.interactionType === 'Sale').length;
      const rev = catWeekly.filter(e => e.interactionType === 'Sale').reduce((a, c) => a + (c.price * c.quantity), 0);
      const potential = units + walkins;
      const rate = potential > 0 ? (units / potential) * 100 : 0;
      return { cat, walkins, units, rate, rev };
    }).filter(f => f.walkins > 0 || f.units > 0).sort((a, b) => b.rev - a.rev);

    const htmlContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SDA Pro Audit - ${profile.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1c1c1e; line-height: 1.4; background: #fff; margin: 0; }
          .header { border-bottom: 4px solid #007aff; padding-bottom: 25px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 32px; font-weight: 900; color: #007aff; letter-spacing: -2px; }
          .section-title { font-size: 11px; font-weight: 800; color: #8e8e93; text-transform: uppercase; letter-spacing: 2px; margin: 30px 0 15px 0; border-left: 4px solid #007aff; padding-left: 10px; }
          .card { background: #f9f9fb; border-radius: 24px; padding: 25px; border: 1px solid #f2f2f7; margin-bottom: 25px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi-card { background: #f2f2f7; padding: 20px; border-radius: 20px; border: 1px solid #e5e5ea; }
          .kpi-val { font-size: 22px; font-weight: 900; color: #007aff; display: block; margin-top: 5px; }
          .kpi-lbl { font-size: 9px; color: #8e8e93; font-weight: 800; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 9px; color: #8e8e93; text-transform: uppercase; padding: 12px; border-bottom: 2px solid #007aff; }
          td { padding: 14px 12px; font-size: 12px; border-bottom: 1px solid #f2f2f7; }
          .tag { display: inline-block; padding: 3px 8px; border-radius: 5px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
          .tag-me { background: #007aff15; color: #007aff; }
          .tag-staff { background: #ff950015; color: #ff9500; }
          @media print { .no-print { display: none; } }
          footer { margin-top: 60px; text-align: center; font-size: 10px; color: #8e8e93; font-weight: 800; letter-spacing: 2px; border-top: 1px solid #f2f2f7; padding-top: 30px; }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: center; padding: 20px;"><button style="background: #007aff; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 20px rgba(0,122,255,0.3);" onclick="window.print()">Download Audit PDF</button></div>
        
        <div class="header">
          <div>
            <div class="logo">SDA PRO AUDIT</div>
            <div style="font-weight: 800; color: #8e8e93;">PRODUCTIVITY ANALYSIS: ${monthName.toUpperCase()} ${now.getFullYear()}</div>
          </div>
          <div style="text-align: right">
            <div class="kpi-lbl">Executive Profile</div>
            <div style="font-weight: 900; font-size: 20px;">${profile.name}</div>
            <div style="font-size: 11px; color: #8e8e93;">${profile.storeName} • Specialist: ${profile.brand}</div>
          </div>
        </div>

        <div class="section-title">Consolidated MTD Performance</div>
        <div class="kpi-grid">
           <div class="kpi-card" style="border-left: 5px solid #007aff;">
              <span class="kpi-lbl">Personal Revenue (Self)</span>
              <span class="kpi-val">₹${myRevenue.toLocaleString()}</span>
           </div>
           <div class="kpi-card" style="border-left: 5px solid #ff9500;">
              <span class="kpi-lbl">Assisted Revenue (Staff)</span>
              <span class="kpi-val">₹${staffRevenue.toLocaleString()}</span>
           </div>
           <div class="kpi-card" style="border-left: 5px solid #34c759;">
              <span class="kpi-lbl">Weekly Leads Attended</span>
              <span class="kpi-val">${weeklyAttendedCount}</span>
           </div>
        </div>

        <div class="section-title">Weekly Family Audit (Category Benchmarking)</div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Product Family</th>
                <th>MTD Walk-ins</th>
                <th>Units Sold</th>
                <th>Conversion Rate (%)</th>
                <th>Revenue Potential</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyFamilyAudit.map(f => `
                <tr>
                  <td style="font-weight: 800; color: #007aff;">${f.cat}</td>
                  <td style="font-weight: 700;">${f.walkins}</td>
                  <td style="font-weight: 700; color: #34c759;">${f.units}</td>
                  <td style="font-weight: 900;">${f.rate.toFixed(1)}%</td>
                  <td style="font-weight: 800;">₹${f.rev.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section-title">Executive Transaction Journal</div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th style="width: 100px;">Date</th>
                <th>Term</th>
                <th>Category / Brand</th>
                <th>Outcome</th>
                <th>Audit Remark</th>
              </tr>
            </thead>
            <tbody>
              ${mtdEntries.slice(0, 100).map(s => `
                <tr>
                  <td style="font-size: 11px; font-weight: 700; color: #8e8e93;">${new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td><span class="tag ${s.attendedBy === 'Me' ? 'tag-me' : 'tag-staff'}">${s.attendedBy === 'Me' ? 'SELF' : 'OTHER'}</span></td>
                  <td>
                    <div style="font-weight: 800;">${s.category}</div>
                    <div style="font-size: 10px; color: #8e8e93; font-weight: 600;">Brand: ${s.brandName}</div>
                  </td>
                  <td style="font-weight: 900; color: ${s.interactionType === 'Sale' ? '#34c759' : '#1c1c1e'}">
                    ${s.interactionType === 'Sale' ? `₹${(s.price * s.quantity).toLocaleString()}` : `${s.walkins || 1} Enquiry`}
                  </td>
                  <td>
                    <div style="font-size: 10px; font-weight: 700; color: #007aff;">${s.reasonForPurchase || '-'}</div>
                    ${s.customerFeedback ? `<div style="font-size: 10px; font-style: italic; color: #8e8e93; margin-top: 4px;">"${s.customerFeedback}"</div>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <footer>
           SDA PRO SYSTEM AUDIT • ${new Date().toLocaleDateString('en-GB')} • CONFIDENTIAL INTERNAL DOCUMENT
        </footer>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  }
};
