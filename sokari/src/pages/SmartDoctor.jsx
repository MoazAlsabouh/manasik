import { useState, useEffect } from 'react';
import { generateWeeklyReport, analyzeReading } from '../services/geminiService';
import { getReadings, getProfile, updateReading } from '../services/dbService';
import { Loader2, Sparkles, HeartPulse, ChevronRight, MessageCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function SmartDoctor() {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'notes'
  
  const [report, setReport] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
  const [notesResponses, setNotesResponses] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  
  // تتبع حالة زر إعادة المحاولة لكل عنصر
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    if (activeTab === 'notes') {
      loadNotesResponses();
    }
  }, [activeTab]);

  const loadNotesResponses = async () => {
    setIsLoadingNotes(true);
    const allReadings = await getReadings(100);
    const withResponses = allReadings.filter(r => r.aiResponse);
    setNotesResponses(withResponses);
    setIsLoadingNotes(false);
  };

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    setReport('');
    
    const allReadings = await getReadings(50);
    const profile = await getProfile();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyReadings = allReadings.filter(r => new Date(r.createdAt) >= weekAgo);
    
    const aiReport = await generateWeeklyReport(weeklyReadings, profile);
    setReport(aiReport);
    setIsLoadingReport(false);
  };

  const handleRetry = async (item) => {
    setRetryingId(item.id);
    const profile = await getProfile();
    
    // إعادة إرسال الطلب لجيميناي
    const newResponse = await analyzeReading(item.value, item.isFasting, item.note, profile);
    
    // تحديث قاعدة البيانات بالرد الجديد
    await updateReading(item.id, { aiResponse: newResponse });
    
    // تحديث الواجهة مباشرة
    setNotesResponses(prev => prev.map(r => r.id === item.id ? { ...r, aiResponse: newResponse } : r));
    setRetryingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-800">الطبيب الذكي 🤖</h1>
        <p className="text-slate-500 text-sm mt-1">تحليلات ونصائح مخصصة لحالتك من الذكاء الاصطناعي</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          التحليلات الدورية
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'notes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MessageCircle size={16} />
          إجابات الملاحظات
        </button>
      </div>

      {activeTab === 'weekly' ? (
        // Tab 1: Weekly Report
        <div className="space-y-6 animate-in fade-in duration-300">
          <section className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[2rem] shadow-md text-white relative overflow-hidden">
            <HeartPulse size={120} className="absolute -left-6 -bottom-6 opacity-10" />
            <h2 className="font-bold text-lg mb-2 relative z-10">التقرير الأسبوعي</h2>
            <p className="text-blue-100 text-sm mb-4 relative z-10">احصل على تحليل شامل لقراءاتك في آخر 7 أيام مع نصائح مخصصة لأدويتك وحالتك.</p>
            <button 
              onClick={handleGenerateReport}
              disabled={isLoadingReport}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-80 relative z-10"
            >
              {isLoadingReport ? (
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

          {!report && !isLoadingReport && (
            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <h2 className="font-bold text-lg mb-4">كيف يعمل التقرير الأسبوعي؟</h2>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <ChevronRight size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>يقرأ الذكاء الاصطناعي قراءاتك المسجلة خلال آخر 7 أيام.</span>
                </li>
                <li className="flex gap-3">
                  <ChevronRight size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>يأخذ بعين الاعتبار الأدوية والعمر المسجل في ملفك الشخصي.</span>
                </li>
                <li className="flex gap-3">
                  <ChevronRight size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>يقدم لك ملخصاً صحياً، يحدد فترات الارتفاع والانخفاض، ويعطيك نصيحة للأسبوع القادم.</span>
                </li>
              </ul>
            </section>
          )}
        </div>
      ) : (
        // Tab 2: Notes Responses
        <div className="space-y-4 animate-in fade-in duration-300">
          {isLoadingNotes ? (
             <div className="text-center py-12 text-slate-400">
               <Loader2 size={30} className="animate-spin mx-auto mb-2 opacity-50" />
               جاري تحميل الردود...
             </div>
          ) : notesResponses.length === 0 ? (
             <div className="bg-white p-8 text-center rounded-[2rem] border border-slate-100">
               <MessageCircle size={40} className="mx-auto text-slate-300 mb-4" />
               <h3 className="font-bold text-slate-700 mb-1">لا توجد ردود بعد</h3>
               <p className="text-sm text-slate-500">عندما تقوم بإضافة قراءة جديدة مع ملاحظة، سيتم حفظ رد الطبيب هنا للرجوع إليه.</p>
             </div>
          ) : (
            notesResponses.map((item) => {
              // التحقق مما إذا كان الرد يحمل عبارة الخطأ الشهيرة
              const isError = item.aiResponse?.includes("لم أتمكن من تحليل قراءتك");
              const isRetrying = retryingId === item.id;

              return (
                <div key={item.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                        سكر {item.isFasting ? 'صائم' : 'بعد الأكل'}: {item.value}
                      </span>
                      <p className="text-slate-800 font-bold mt-2 text-sm flex gap-2">
                        <span className="text-slate-400">ملاحظتك:</span> 
                        {item.note}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: ar })}
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                        <Sparkles size={16} />
                        <span>رد الطبيب:</span>
                      </div>
                      
                      {/* زر إعادة المحاولة يظهر فقط في حال كان الرد خطأ */}
                      {isError && (
                        <button 
                          onClick={() => handleRetry(item)}
                          disabled={isRetrying}
                          className="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold disabled:opacity-50"
                        >
                          {isRetrying ? (
                            <><Loader2 size={14} className="animate-spin" /> جاري التحليل...</>
                          ) : (
                            <><RefreshCw size={14} /> إعادة المحاولة</>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap pl-4 border-r-2 ${isError ? 'text-red-500 border-red-200' : 'text-slate-600 border-blue-200'}`}>
                      {item.aiResponse}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
