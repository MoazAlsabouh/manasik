import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2, Droplet, Sparkles, Activity } from 'lucide-react';
import { saveReading, getReadings, getProfile } from '../services/dbService';
import { analyzeReading } from '../services/geminiService';
import { format, subDays, isAfter } from 'date-fns';

export default function Dashboard() {
  const [readings, setReadings] = useState([]);
  const [profile, setProfile] = useState(null);
  
  // Form State
  const [value, setValue] = useState('');
  const [isFasting, setIsFasting] = useState(true);
  const [note, setNote] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [timeFilter, setTimeFilter] = useState('week'); // week, month, year

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // نجلب آخر 100 قراءة للفلترة
    const data = await getReadings(100);
    setReadings(data);
    const userProfile = await getProfile();
    setProfile(userProfile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value) return;

    setIsLoading(true);
    setAiResponse('');

    const readingValue = parseInt(value);
    
    // الحفظ في قاعدة البيانات
    await saveReading(readingValue, isFasting, note);
    
    // إرسال لجيميناي إذا كان هناك ملاحظة
    if (note.trim() !== '') {
       const response = await analyzeReading(readingValue, isFasting, note, profile);
       setAiResponse(response);
    }

    // إعادة تعيين الحقول
    setValue('');
    setNote('');
    fetchData();
    setIsLoading(false);
  };

  // فلترة المخطط البياني
  const getFilteredData = () => {
    const now = new Date();
    let daysToSubtract = 7;
    if (timeFilter === 'month') daysToSubtract = 30;
    if (timeFilter === 'year') daysToSubtract = 365;

    const cutoffDate = subDays(now, daysToSubtract);
    
    const filtered = readings.filter(r => isAfter(new Date(r.createdAt), cutoffDate));
    // نعكس المصفوفة لتظهر الأقدم على اليسار والأحدث على اليمين في المخطط
    return filtered.reverse().map(r => ({
      name: format(new Date(r.createdAt), 'dd/MM'),
      value: r.value,
      isFasting: r.isFasting
    }));
  };

  const chartData = getFilteredData();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">مرحباً! 👋</h1>
          <p className="text-slate-500 text-sm mt-1">كيف حال السكر لديك اليوم؟</p>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shadow-sm">
          <Droplet size={24} className="fill-blue-500" />
        </div>
      </header>
      
      {/* نافذة الرد الذكي */}
      {aiResponse && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 p-5 rounded-[2rem] shadow-sm relative overflow-hidden">
          <div className="absolute -left-4 -top-4 opacity-10">
            <Sparkles size={100} className="text-blue-600" />
          </div>
          <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold">
            <Sparkles size={20} />
            <span>نصيحة الطبيب الذكي:</span>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed relative z-10 whitespace-pre-wrap">
            {aiResponse}
          </p>
          <button 
            onClick={() => setAiResponse('')}
            className="mt-4 bg-white/60 hover:bg-white text-blue-700 text-xs font-bold py-2 px-4 rounded-xl transition-colors"
          >
            حسناً، شكراً
          </button>
        </div>
      )}

      {/* قسم إدخال القراءة */}
      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
          <Activity size={20} className="text-blue-500" />
          إضافة قراءة جديدة
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input 
                type="number" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="مستوى السكر (مثال: 120)"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-center font-bold"
                required
              />
            </div>
            <div className="flex flex-col gap-2 w-28">
              <button 
                type="button"
                onClick={() => setIsFasting(true)}
                className={`py-2 px-2 rounded-xl text-sm font-bold transition-colors ${isFasting ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                صائم
              </button>
              <button 
                type="button"
                onClick={() => setIsFasting(false)}
                className={`py-2 px-2 rounded-xl text-sm font-bold transition-colors ${!isFasting ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                بعد الأكل
              </button>
            </div>
          </div>

          <div>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="هل لديك ملاحظة؟ (اختياري) مثال: أكلت قطعة حلوى صغيرة، أو أشعر بدوار..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none h-20"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !value}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <><Loader2 size={20} className="animate-spin" /> جاري الحفظ والتحليل...</>
            ) : (
              'حفظ القراءة'
            )}
          </button>
        </form>
      </section>

      {/* قسم المخطط البياني */}
      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-slate-800">نظرة عامة</h2>
          <div className="flex bg-slate-100 rounded-lg p-1">
            {['week', 'month', 'year'].map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeFilter === filter ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                {filter === 'week' ? 'أسبوع' : filter === 'month' ? 'شهر' : 'سنة'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-56 w-full" dir="ltr">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={140} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              لا توجد قراءات في هذه الفترة
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
