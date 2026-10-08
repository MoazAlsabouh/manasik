import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, LineChart, Stethoscope, User, Loader2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/HistoryPage';
import SmartDoctor from './pages/SmartDoctor';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

function NavLink({ to, icon: Icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-50'}`}>
      <Icon size={24} className={isActive ? 'stroke-2' : 'stroke-[1.5]'} />
      <span className="text-[10px] sm:text-[11px] mt-1 font-bold">{label}</span>
    </Link>
  );
}

function Navigation() {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 md:w-24 md:h-full md:flex-col md:border-t-0 md:border-l md:justify-center md:gap-8 md:right-0 md:left-auto z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">
      <NavLink to="/" icon={Home} label="الرئيسية" />
      <NavLink to="/history" icon={LineChart} label="السجل" />
      <NavLink to="/doctor" icon={Stethoscope} label="طبيبي" />
      <NavLink to="/profile" icon={User} label="الملف" />
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-blue-600 font-['Cairo']">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen pb-20 md:pb-0 md:pr-24 bg-slate-50 text-slate-800">
        <main className="p-4 md:p-8 max-w-3xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/doctor" element={<SmartDoctor />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
