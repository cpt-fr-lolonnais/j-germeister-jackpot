import { useLocation, useNavigate } from 'react-router-dom';
import { Users, BarChart3, Crosshair } from 'lucide-react';

const tabs = [
  { path: '/players', label: 'Spieler', icon: Users, isMain: false },
  { path: '/', label: 'Hirschjagd', icon: Crosshair, isMain: true },
  { path: '/stats', label: 'Statistik', icon: BarChart3, isMain: false },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around max-w-md mx-auto">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          
          if (tab.isMain) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center -mt-5"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-background transition-all ${
                  active 
                    ? 'bg-primary box-glow-orange' 
                    : 'bg-primary/80'
                }`}>
                  <tab.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <span className={`text-[9px] font-orbitron font-bold uppercase tracking-wider mt-1 ${
                  active ? 'text-primary text-glow-orange' : 'text-muted-foreground'
                }`}>{tab.label}</span>
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
              <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
