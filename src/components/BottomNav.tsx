import { useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, Users, BarChart3 } from 'lucide-react';

const tabs = [
  { path: '/players', label: 'Spieler', icon: Users },
  { path: '/', label: 'Bandit', icon: Gamepad2 },
  { path: '/stats', label: 'Statistik', icon: BarChart3 },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around max-w-md mx-auto">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
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
