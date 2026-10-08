import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2, Lock } from 'lucide-react';
import appLogo from '../image/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // التوجيه سيتم تلقائياً من خلال App.jsx عبر مراقب حالة الدخول
    } catch (err) {
      console.error(err);
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Cairo'] text-slate-800" dir="rtl">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center shadow-sm overflow-hidden border-2 border-blue-100 mb-4 shrink-0">
            <img src={appLogo} alt="شعار سكري" className="w-16 h-16 object-contain drop-shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">تطبيق سُكَّري</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">يرجى تسجيل الدخول للوصول إلى بياناتك</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-left"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-left"
              dir="ltr"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !email || !password}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-70"
          >
            {isLoading ? (
              <><Loader2 size={20} className="animate-spin" /> جاري التحقق...</>
            ) : (
              <><Lock size={20} /> دخول</>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs mt-6">
          التسجيل متاح فقط من قبل مشرف النظام.
        </p>
      </div>
    </div>
  );
}
