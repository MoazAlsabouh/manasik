import { useState, useEffect } from 'react';
import { saveProfile, getProfile } from '../services/dbService';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const medicationsList = [
    { id: 'metformin', name: 'ميتفورمين (جلوكوڤاج)' },
    { id: 'glimepiride', name: 'جليميبيريد (أماريل)' },
    { id: 'glibenclamide', name: 'جليبينكلاميد (داونيل)' },
    { id: 'mixtard', name: 'إنسولين مخلوط (مكستارد)' },
    { id: 'lantus', name: 'إنسولين طويل الأمد (لانتوس)' },
    { id: 'novorapid', name: 'إنسولين سريع (نوفورابيد)' },
    { id: 'diet', name: 'حمية غذائية فقط (بدون دواء)' },
  ];

  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [otherMed, setOtherMed] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      if (data) {
        setName(data.name || '');
        setBirthYear(data.birthYear || '');
        
        // استخراج الأدوية الموجودة في القائمة والأدوية الأخرى
        const knownMeds = medicationsList.map(m => m.name);
        const savedKnownMeds = (data.medications || []).filter(m => knownMeds.includes(m));
        const savedOtherMeds = (data.medications || []).filter(m => !knownMeds.includes(m));

        setSelectedMeds(savedKnownMeds);
        if (savedOtherMeds.length > 0) {
          setOtherMed(savedOtherMeds.join('، '));
        }
      }
    };
    loadProfile();
  }, []);

  const toggleMedication = (medName) => {
    if (selectedMeds.includes(medName)) {
      setSelectedMeds(selectedMeds.filter(m => m !== medName));
    } else {
      setSelectedMeds([...selectedMeds, medName]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSaved(false);

    let finalMeds = [...selectedMeds];
    if (otherMed.trim() !== '') {
      finalMeds.push(otherMed.trim());
    }

    await saveProfile({
      name,
      birthYear,
      medications: finalMeds
    });

    setIsLoading(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // إخفاء علامة النجاح بعد 3 ثواني
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-800">الملف الشخصي 👤</h1>
        <p className="text-slate-500 text-sm mt-1">تساعد هذه المعلومات الذكاء الاصطناعي في تقديم نصائح أدق لحالتك.</p>
      </header>

      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكريم..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">سنة الميلاد (لحساب العمر)</label>
            <input 
              type="number" 
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="مثال: 1960"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الأدوية الحالية (اختر كل ما ينطبق)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {medicationsList.map(med => (
                <label key={med.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedMeds.includes(med.name)}
                    onChange={() => toggleMedication(med.name)}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                  />
                  <span className="text-slate-700 text-sm">{med.name}</span>
                </label>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-200">
                <input 
                  type="text" 
                  value={otherMed}
                  onChange={(e) => setOtherMed(e.target.value)}
                  placeholder="أدوية أخرى؟ اكتبها هنا..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-4 flex justify-center items-center gap-2 ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
            {isSaved ? <><CheckCircle2 size={20} /> تم الحفظ بنجاح</> : 'حفظ البيانات'}
          </button>
        </form>
      </section>
    </div>
  );
}
