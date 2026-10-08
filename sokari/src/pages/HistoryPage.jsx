import { useState, useEffect } from 'react';
import { getReadings } from '../services/dbService';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, FileDown } from 'lucide-react';

export default function HistoryPage() {
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getReadings();
      setReadings(data);
      setIsLoading(false);
    };
    fetchHistory();
  }, []);

  const handleExport = () => {
    // فتح نافذة طباعة جديدة
    const printWindow = window.open('', '_blank');
    
    // تجهيز صفوف الجدول
    const tableRows = readings.map(r => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${format(new Date(r.createdAt), 'yyyy/MM/dd')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${format(new Date(r.createdAt), 'hh:mm a')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${r.isFasting ? 'صائم' : 'بعد الأكل'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${r.value > 140 ? '#dc2626' : r.value < 70 ? '#d97706' : '#16a34a'};" dir="ltr">${r.value}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${r.note || '-'}</td>
      </tr>
    `).join('');

    // تصميم التقرير بالكامل (HTML + CSS)
    const htmlContent = `
      <html dir="rtl" lang="ar">
        <head>
          <title>سجل القراءات - سكري</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', system-ui, sans-serif; padding: 40px; color: #0f172a; margin: 0; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #1e3a8a; margin: 0 0 10px 0; font-size: 28px; }
            .header p { color: #64748b; margin: 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px; text-align: right; }
            th { background-color: #f8fafc; padding: 15px 12px; border-bottom: 2px solid #cbd5e1; color: #334155; font-weight: bold; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>سجل قراءات السكر</h1>
            <p>تاريخ استخراج التقرير: ${format(new Date(), 'dd MMMM yyyy', { locale: ar })}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>حالة القياس</th>
                <th>النتيجة (mg/dL)</th>
                <th>ملاحظات المريض</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            تم استخراج هذا التقرير تلقائياً من تطبيق سكري © ${new Date().getFullYear()}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">سجل القراءات 📅</h1>
          <p className="text-slate-500 text-sm mt-1">تتبع قراءاتك السابقة واطبعها للطبيب</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <FileDown size={18} />
          <span className="hidden sm:inline">تصدير PDF</span>
        </button>
      </header>

      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        {isLoading ? (
          <div className="text-center text-slate-400 py-10">
            جاري تحميل السجل...
          </div>
        ) : readings.length === 0 ? (
          <div className="text-center text-slate-400 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            لم تقم بإضافة أي قراءات بعد.
          </div>
        ) : (
          <div className="space-y-4">
            {readings.map((reading) => (
              <div key={reading.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
                    reading.value > 140 
                      ? 'bg-red-100 text-red-600' 
                      : reading.value < 70 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : 'bg-green-100 text-green-600'
                  }`}>
                    {reading.value}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      {reading.isFasting ? 'صائم' : 'بعد الأكل'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(reading.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
                    </div>
                  </div>
                </div>
                {reading.note && (
                  <div className="hidden sm:block text-xs text-slate-400 bg-white px-3 py-2 rounded-lg max-w-[200px] truncate border border-slate-200">
                    {reading.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
