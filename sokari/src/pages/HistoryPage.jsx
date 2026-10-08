import { useState, useEffect } from 'react';
import { getReadings } from '../services/dbService';
import { format, subDays, isAfter } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, FileDown, Activity, Info, ChevronDown } from 'lucide-react';

export default function HistoryPage() {
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // التحكم في عرض القراءات في الواجهة (بدون إنترنت إضافي)
  const [visibleCount, setVisibleCount] = useState(20);
  
  // فترة الطباعة المختارة
  const [printPeriod, setPrintPeriod] = useState('month'); // week, month, year, all

  useEffect(() => {
    const fetchHistory = async () => {
      // جلب جميع القراءات مرة واحدة من الكاش لحساب الملخص بدقة
      const data = await getReadings(5000);
      setReadings(data);
      setIsLoading(false);
    };
    fetchHistory();
  }, []);

  // حساب الملخص الطبي من (جــمــيــع القراءات حرفياً)
  const getSummary = () => {
    if (readings.length === 0) return null;
    const sum = readings.reduce((acc, curr) => acc + curr.value, 0);
    const avg = Math.round(sum / readings.length);
    const a1c = ((avg + 46.7) / 28.7).toFixed(1);
    const inRange = readings.filter(r => r.value >= 70 && r.value <= 180).length;
    const tir = Math.round((inRange / readings.length) * 100);
    return { avg, a1c, tir, count: readings.length };
  };

  const stats = getSummary();
  const visibleReadings = readings.slice(0, visibleCount);

  const handleExport = () => {
    // تحديد القراءات التي سيتم طباعتها في الجدول بناءً على الفترة
    let readingsToPrint = readings;
    if (printPeriod !== 'all') {
      const now = new Date();
      let days = 30;
      if (printPeriod === 'week') days = 7;
      if (printPeriod === 'year') days = 365;
      const cutoff = subDays(now, days);
      readingsToPrint = readings.filter(r => isAfter(new Date(r.createdAt), cutoff));
    }

    if (readingsToPrint.length === 0) {
      alert("لا توجد قراءات في الفترة المحددة لطباعتها.");
      return;
    }

    const printWindow = window.open('', '_blank');
    
    const periodName = 
      printPeriod === 'week' ? 'آخر أسبوع' : 
      printPeriod === 'month' ? 'آخر شهر' : 
      printPeriod === 'year' ? 'آخر سنة' : 'جميع القراءات المتاحة';

    const tableRows = readingsToPrint.map(r => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${format(new Date(r.createdAt), 'yyyy/MM/dd')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${format(new Date(r.createdAt), 'hh:mm a')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${r.isFasting ? 'صائم' : 'بعد الأكل'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${r.value > 140 ? '#dc2626' : r.value < 70 ? '#d97706' : '#16a34a'};" dir="ltr">${r.value}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${r.note || '-'}</td>
      </tr>
    `).join('');
    
    // الملخص الشامل الدقيق
    const summaryHtml = `
      <div class="summary-box">
        <div class="summary-item">
          <span class="summary-label">متوسط السكر العام:</span>
          <span class="summary-value" dir="ltr">${stats.avg} mg/dL</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">التراكمي التقريبي العام:</span>
          <span class="summary-value" dir="ltr">${stats.a1c} %</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">الانضباط العام (TIR):</span>
          <span class="summary-value" dir="ltr">${stats.tir} %</span>
        </div>
      </div>
    `;

    const htmlContent = `
      <html dir="rtl" lang="ar">
        <head>
          <title>سجل القراءات - سكري</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', system-ui, sans-serif; padding: 40px; color: #0f172a; margin: 0; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #1e3a8a; margin: 0 0 10px 0; font-size: 28px; }
            .header p { color: #64748b; margin: 5px 0; font-size: 14px; }
            .stats-info { display: flex; justify-content: center; gap: 20px; font-weight: bold; color: #3b82f6; margin-top: 10px; }
            
            .summary-box { display: flex; justify-content: space-around; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
            .summary-item { text-align: center; }
            .summary-label { display: block; font-size: 12px; color: #64748b; margin-bottom: 5px; font-weight: bold; }
            .summary-value { display: block; font-size: 18px; color: #0f172a; font-weight: bold; }

            table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 10px; text-align: right; }
            th { background-color: #f8fafc; padding: 15px 12px; border-bottom: 2px solid #cbd5e1; color: #334155; font-weight: bold; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .summary-box { border: 1px solid #cbd5e1; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>سجل قراءات السكر</h1>
            <p>تاريخ استخراج التقرير: ${format(new Date(), 'dd MMMM yyyy', { locale: ar })}</p>
            <div class="stats-info">
              <span>الفترة المطبوعة في الجدول: ${periodName}</span>
              <span>عدد القراءات المطبوعة: ${readingsToPrint.length}</span>
            </div>
          </div>
          
          <h3 style="color: #64748b; font-size: 14px; margin-bottom: 10px;">الملخص العام (مبني على إجمالي ${stats.count} قراءة مسجلة):</h3>
          ${summaryHtml}

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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">سجل القراءات 📅</h1>
          <p className="text-slate-500 text-sm mt-1">تتبع قراءاتك السابقة واطبعها للطبيب</p>
        </div>
        
        {/* قسم الطباعة واختيار فترة التقرير المطبوع */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
          <select 
            value={printPeriod}
            onChange={(e) => setPrintPeriod(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none pr-2"
          >
            <option value="week">تقرير لأسبوع</option>
            <option value="month">تقرير لشهر</option>
            <option value="year">تقرير لسنة</option>
            <option value="all">تقرير شامل</option>
          </select>
          <button 
            onClick={handleExport}
            disabled={readings.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileDown size={16} />
            <span>طباعة</span>
          </button>
        </div>
      </header>

      {/* الملخص الطبي الشامل (مبني على كل القراءات) */}
      {stats && (
        <section className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 rounded-r-[2rem]"></div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity size={16} className="text-blue-500" />
              الملخص العام الشامل (بناءً على {stats.count} قراءة)
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100/50">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold mb-1">المتوسط</p>
              <p className="text-lg font-extrabold text-blue-600">{stats.avg} <span className="text-[10px] font-normal">mg/dL</span></p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-xl border border-indigo-100/50">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold mb-1">تراكمي تقريبي</p>
              <p className="text-lg font-extrabold text-indigo-600">{stats.a1c} <span className="text-[10px] font-normal">%</span></p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100/50">
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold mb-1">انضباط (TIR)</p>
              <p className="text-lg font-extrabold text-green-600">{stats.tir} <span className="text-[10px] font-normal">%</span></p>
            </div>
          </div>
        </section>
      )}

      {/* قائمة القراءات بحد أقصى 20 */}
      <section className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100">
        {isLoading ? (
          <div className="text-center text-slate-400 py-10">
            جاري تحميل السجل...
          </div>
        ) : visibleReadings.length === 0 ? (
          <div className="text-center text-slate-400 py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            لا توجد قراءات مسجلة بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleReadings.map((reading) => (
              <div key={reading.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shrink-0 ${
                    reading.value > 140 
                      ? 'bg-red-100 text-red-600' 
                      : reading.value < 70 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : 'bg-green-100 text-green-600'
                  }`}>
                    {reading.value}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm sm:text-base">
                      {reading.isFasting ? 'صائم' : 'بعد الأكل'}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(reading.createdAt), 'dd MMMM - hh:mm a', { locale: ar })}
                    </div>
                  </div>
                </div>
                {reading.note && (
                  <div className="hidden sm:block text-xs text-slate-400 bg-white px-3 py-2 rounded-lg max-w-[200px] truncate border border-slate-200" title={reading.note}>
                    {reading.note}
                  </div>
                )}
              </div>
            ))}
            
            {/* زر عرض المزيد */}
            {visibleCount < readings.length && (
              <button 
                onClick={() => setVisibleCount(prev => prev + 20)}
                className="w-full mt-4 bg-slate-50 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors flex justify-center items-center gap-2"
              >
                عرض 20 قراءة إضافية
                <ChevronDown size={18} className="text-slate-400" />
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
