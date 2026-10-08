import { useState, useEffect } from 'react';
import { saveProfile, getProfile } from '../services/dbService';
import { Loader2, CheckCircle2, Edit2, User, Calendar, Pill } from 'lucide-react';
import { differenceInYears } from 'date-fns';

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
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('male');
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [otherMed, setOtherMed] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      if (data && data.name) {
        setName(data.name || '');
        setBirthDate(data.birthDate || '');
        setGender(data.gender || 'male');
        
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
      birthDate,
      gender,
      medications: finalMeds
    });

    setIsLoading(false);
    setIsSaved(true);
    
    setTimeout(() => {
      setIsSaved(false);
      setIsEditing(false);
    }, 1000);
  };

  const currentAge = birthDate ? differenceInYears(new Date(), new Date(birthDate)) : 'غير معروف';
  const allMeds = [...selectedMeds, ...(otherMed.trim() !== '' ? [otherMed.trim()] : [])];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">الملف الشخصي 👤</h1>
          <p className="text-slate-500 text-sm mt-1">تساعد هذه المعلومات الذكاء الاصطناعي في فهم حالتك بشكل أدق.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <Edit2 size={16} />
            <span className="hidden sm:inline">تعديل</span>
          </button>
        )}
      </header>

      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        {!isEditing ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold">الاسم (والجنس)</p>
                <p className="text-lg font-bold text-slate-800">
                  {name || 'غير محدد'} <span className="text-sm font-normal text-slate-400">({gender === 'female' ? 'أنثى' : 'ذكر'})</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold">العمر</p>
                <p className="text-lg font-bold text-slate-800">
                  {currentAge} سنة <span className="text-sm font-normal text-slate-400">({birthDate || 'غير محدد'})</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                <Pill size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold mb-2">الأدوية الحالية</p>
                {allMeds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allMeds.map((m, i) => (
                      <span key={i} className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">لا يوجد أدوية مسجلة.</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(true)}
              className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors mt-4 flex justify-center items-center gap-2"
            >
              <Edit2 size={18} /> تعديل البيانات
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكريم..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الجنس</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الميلاد</label>
                <input 
                  type="date" 
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-left"
                  dir="ltr"
                  required
                />
              </div>
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

            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`flex-1 text-white font-bold py-3 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 ${isSaved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
                {isSaved ? <><CheckCircle2 size={20} /> تم الحفظ</> : 'حفظ البيانات'}
              </button>
              
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
    </div>
  );
}
