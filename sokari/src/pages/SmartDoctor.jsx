import { useState } from 'react';
import { generateWeeklyReport } from '../services/geminiService';
import { getReadings, getProfile } from '../services/dbService';
import { Loader2, Sparkles, HeartPulse, ChevronRight } from 'lucide-react';

export default function SmartDoctor() {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReport('');
    
    const allReadings = await getReadings(50);
    const profile = await getProfile();
    
    // جلب قراءات آخر 7 أيام فقط
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyReadings = allReadings.filter(r => new Date(r.createdAt) >= weekAgo);
    
    const aiReport = await generateWeeklyReport(weeklyReadings, profile);
    setReport(aiReport);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-800">الطبيب الذكي 🤖</h1>
        <p className="text-slate-500 text-sm mt-1">تحليلات ونصائح مخصصة لحالتك من الذكاء الاصطناعي</p>
      </header>

      <section className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[2rem] shadow-md text-white relative overflow-hidden">
        <HeartPulse size={120} className="absolute -left-6 -bottom-6 opacity-10" />
        <h2 className="font-bold text-lg mb-2 relative z-10">التقرير الأسبوعي</h2>
        <p className="text-blue-100 text-sm mb-4 relative z-10">احصل على تحليل شامل لقراءاتك في آخر 7 أيام مع نصائح مخصصة لأدويتك وحالتك.</p>
        <button 
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="bg-white text-blue-600 px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-80 relative z-10"
        >
          {isLoading ? (
            <><Loader2 size={18} className="animate-spin" /> جاري إعداد التقرير...</>
          ) : (
            <><Sparkles size={18} /> تحليل الآن</>
          )}
        </button>
      </section>

      {report && (
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="font-bold text-lg mb-4 text-blue-700 flex items-center gap-2">
            <Sparkles size={20} />
            تقريرك الأسبوعي جاهز:
          </h2>
          <div className="prose prose-blue prose-sm max-w-none text-slate-700 leading-loose whitespace-pre-wrap">
            {report}
          </div>
        </section>
      )}

      {!report && !isLoading && (
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h2 className="font-bold text-lg mb-4">كيف يعمل الطبيب الذكي؟</h2>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <ChevronRight size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span>عند إدخالك لملاحظة مع قراءتك اليومية، سيرد عليك الطبيب بنصيحة فورية.</span>
            </li>
            <li className="flex gap-3">
              <ChevronRight size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span>يأخذ الطبيب الذكي عمرك والأدوية التي تستخدمها بالاعتبار عند إعطاء النصيحة.</span>
            </li>
            <li className="flex gap-3">
              <ChevronRight size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span>يمكنك طلب تقرير أسبوعي يلخص حالتك ويشجعك على الاستمرار.</span>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
