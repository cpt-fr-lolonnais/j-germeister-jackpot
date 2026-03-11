import { useLocation, useNavigate } from 'react-router-dom';
import { Users, BarChart3 } from 'lucide-react';

function BuzzsawIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 0L13.5 4.5L16 1L15 5.5L19 3L17 7L21 5L18.5 8.5L23 8L19 11L24 12L19 13L23 16L18.5 15.5L21 19L17 17L19 21L15 18.5L16 23L13.5 19.5L12 24L10.5 19.5L8 23L9 18.5L5 21L7 17L3 19L5.5 15.5L1 16L5 13L0 12L5 11L1 8L5.5 8.5L3 5L7 7L5 3L9 5.5L8 1L10.5 4.5Z" />
    </svg>
  );
}

const tabs = [
  { path: '/players', label: 'Spieler', icon: Users },
  { path: '/', label: 'Wheel', icon: BuzzsawIcon },
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
