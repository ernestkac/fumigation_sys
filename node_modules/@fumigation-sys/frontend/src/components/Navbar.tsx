import { Shield, Sparkles, RotateCcw, BarChart3, Warehouse, Users, Package, Layers, CalendarCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetSeeds: () => void;
  onOpenAcceptanceTest: () => void;
}

export const Navbar = ({
  activeTab,
  setActiveTab,
  onResetSeeds,
  onOpenAcceptanceTest,
}: NavbarProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'exercises', label: 'Fumigation Exercises', icon: CalendarCheck },
    { id: 'reports', label: 'Reports & Excel Export', icon: Layers },
    { id: 'stacks', label: 'Warehouse Stacks', icon: Package },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'officers', label: 'Pest Officers', icon: Users },
    { id: 'commodities', label: 'Commodities', icon: Shield },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <img
              src="/assert/admarclogo.webp"
              alt="ADMARC logo"
              className="h-11 w-11 object-contain rounded-md border border-slate-200 bg-white shadow-xs"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">BT Div fem</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                  operations
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">Quick Fumigation tracking platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-1 scrollbar-none border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap rounded-md relative ${
                  isActive
                    ? 'text-blue-600 bg-blue-50/70 border border-blue-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
