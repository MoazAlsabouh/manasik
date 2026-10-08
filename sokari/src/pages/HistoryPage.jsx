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
    // في نسخة الإنتاج الفعلية، سيتم استخدام مكتبة لتوليد PDF
    alert("سيتم تحميل السجل بصيغة PDF قريباً! (الميزة قيد التطوير)");
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
