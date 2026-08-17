import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ExercisesView } from './components/ExercisesView';
import { ReportsView } from './components/ReportsView';
import { StacksView } from './components/StacksView';
import { WarehousesView } from './components/WarehousesView';
import { OfficersView } from './components/OfficersView';
import { CommoditiesView } from './components/CommoditiesView';
import { CreateExerciseModal } from './components/CreateExerciseModal';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { AcceptanceTestModal } from './components/AcceptanceTestModal';
import { api } from './lib/api';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [acceptanceTestOpen, setAcceptanceTestOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleResetSeeds = async () => {
    if (window.confirm('Reset database to default sample seed data? Any new records will be restored to default demo state.')) {
      try {
        await api.resetSeedData();
        setRefreshKey((k) => k + 1);
        showToast('Database successfully re-seeded with initial sample records!');
      } catch (err) {
        showToast(`Reset failed: ${(err as Error).message}`);
      }
    }
  };

  const handleExerciseCreated = () => {
    setRefreshKey((k) => k + 1);
    showToast('Fumigation exercise successfully created and stack snapshots recorded!');
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetSeeds={handleResetSeeds}
        onOpenAcceptanceTest={() => setAcceptanceTestOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-70 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div key={refreshKey}>
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveTab}
              onOpenCreateExercise={() => setCreateExerciseOpen(true)}
              onSelectExercise={(id) => setSelectedExerciseId(id)}
            />
          )}

          {activeTab === 'exercises' && (
            <ExercisesView
              onOpenCreateExercise={() => setCreateExerciseOpen(true)}
              onSelectExercise={(id) => setSelectedExerciseId(id)}
              onNavigateToReports={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'stacks' && <StacksView />}

          {activeTab === 'warehouses' && <WarehousesView />}

          {activeTab === 'officers' && <OfficersView />}

          {activeTab === 'commodities' && <CommoditiesView />}
        </div>
      </main>

      {/* Modals */}
      <CreateExerciseModal
        isOpen={createExerciseOpen}
        onClose={() => setCreateExerciseOpen(false)}
        onSuccess={handleExerciseCreated}
      />

      <ExerciseDetailModal
        exerciseId={selectedExerciseId}
        isOpen={selectedExerciseId !== null}
        onClose={() => setSelectedExerciseId(null)}
        onRefresh={handleRefresh}
      />

      <AcceptanceTestModal
        isOpen={acceptanceTestOpen}
        onClose={() => setAcceptanceTestOpen(false)}
        onRefreshAll={handleRefresh}
      />

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Fumigation Tracking & Reporting System</span>
            <span className="text-slate-400">| Relational Snapshot Architecture</span>
          </div>
          <div>
            <span>Multi-sheet Excel Exports & Snapshot Auditing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
