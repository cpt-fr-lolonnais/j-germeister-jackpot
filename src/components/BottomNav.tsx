import { useLocation, useNavigate } from 'react-router-dom';
import { Users, BarChart3, RefreshCw } from 'lucide-react';

const tabs = [
  { path: '/players', label: 'Spieler', icon: Users, isCenter: false },
  { path: '/', label: 'Wheel', icon: RefreshCw, isCenter: true },
  { path: '/stats', label: 'Statistik', icon: BarChart3, isCenter: false },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around max-w-md mx-auto">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;

          if (tab.isCenter) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-1 -mt-5 transition-all"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-primary box-glow-orange shadow-lg ${
                  active ? 'scale-110' : 'scale-100'
                } transition-transform`}>
                  <tab.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <span className="text-[9px] font-arcade font-bold uppercase tracking-wider text-primary text-glow-orange">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-all ${
                active ? 'text-primary text-glow-orange scale-110' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-[10px] font-arcade font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
