/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Receipt, 
  Car, 
  Target, 
  Menu, 
  X, 
  TrendingUp, 
  Smartphone,
  CheckCircle,
  Wrench,
  FileText,
  BarChart2,
  Cloud,
  Sliders
} from 'lucide-react';
import { Shift, Expense, Vehicle, DriverProfile, Maintenance } from './types';
import { 
  DEFAULT_VEHICLE, 
  DEFAULT_PROFILE, 
  INITIAL_SHIFTS, 
  INITIAL_EXPENSES, 
  INITIAL_MAINTENANCE_LOG 
} from './data/initialData';

// Component Imports
import Dashboard from './components/Dashboard';
import ShiftsManager from './components/ShiftsManager';
import ExpensesManager from './components/ExpensesManager';
import VehicleManager from './components/VehicleManager';
import GoalsManager from './components/GoalsManager';
import ClosedReport from './components/ClosedReport';
import MonthlyHistory from './components/MonthlyHistory';
import BackupManager from './components/BackupManager';
import ToolsManager from './components/ToolsManager';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReportRange, setSelectedReportRange] = useState<string | null>(null); // if active, displays ClosedReport

  // Persistent States
  const [profile, setProfile] = useState<DriverProfile>(() => {
    const saved = localStorage.getItem('gmc_driver_profile') || localStorage.getItem('cpma_driver_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [vehicle, setVehicle] = useState<Vehicle>(() => {
    const saved = localStorage.getItem('gmc_driver_vehicle') || localStorage.getItem('cpma_driver_vehicle');
    return saved ? JSON.parse(saved) : DEFAULT_VEHICLE;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('gmc_driver_shifts') || localStorage.getItem('cpma_driver_shifts');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('gmc_driver_expenses') || localStorage.getItem('cpma_driver_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [maintenanceLog, setMaintenanceLog] = useState<Maintenance[]>(() => {
    const saved = localStorage.getItem('gmc_driver_maintenance') || localStorage.getItem('cpma_driver_maintenance');
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_LOG;
  });

  // Local Storage Synchronization Effects
  useEffect(() => {
    localStorage.setItem('gmc_driver_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('gmc_driver_vehicle', JSON.stringify(vehicle));
  }, [vehicle]);

  useEffect(() => {
    localStorage.setItem('gmc_driver_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('gmc_driver_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('gmc_driver_maintenance', JSON.stringify(maintenanceLog));
  }, [maintenanceLog]);

  // Auto-Pull on initial load if logged in with Google Account
  useEffect(() => {
    const savedGoogleUser = localStorage.getItem('cpma_google_user');
    if (savedGoogleUser) {
      try {
        const parsedUser = JSON.parse(savedGoogleUser);
        if (parsedUser && parsedUser.email) {
          fetch(`/api/backup/load/${encodeURIComponent(parsedUser.email)}`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.backup) {
                const cloudBackup = data.backup;
                if (cloudBackup.shifts || cloudBackup.expenses) {
                  setProfile(cloudBackup.profile);
                  setVehicle(cloudBackup.vehicle);
                  setShifts(cloudBackup.shifts || []);
                  setExpenses(cloudBackup.expenses || []);
                  setMaintenanceLog(cloudBackup.maintenance || []);
                  
                  // Update local last-modified timestamp with the backup's timestamp or updatedAt
                  const ts = cloudBackup.timestamp || data.updatedAt || new Date().toISOString();
                  localStorage.setItem('gmc_last_modified', ts);
                  
                  console.log("GMC Auto-Sincronização: Seus dados foram carregados diretamente da nuvem GMC com sucesso para o e-mail: " + parsedUser.email);
                }
              }
            })
            .catch(err => {
              console.error("Erro no auto-pull no carregamento inicial:", err);
            });
        }
      } catch (err) {
        console.error("Erro parsing google user on mount:", err);
      }
    }
  }, []);

  // Helper to trigger automated server-side backup on modification
  const triggerAutoBackup = (
    p: DriverProfile,
    v: Vehicle,
    s: Shift[],
    e: Expense[],
    m: Maintenance[]
  ) => {
    // Record current time as our last edited/modified moment
    localStorage.setItem('gmc_last_modified', new Date().toISOString());

    const savedGoogleUser = localStorage.getItem('cpma_google_user');
    if (!savedGoogleUser) return;
    try {
      const parsedUser = JSON.parse(savedGoogleUser);
      if (parsedUser && parsedUser.email) {
        const payload = {
          meta: 'GMC_SECURE_BACKUP',
          version: '1.0',
          timestamp: new Date().toISOString(),
          profile: p,
          vehicle: v,
          shifts: s,
          expenses: e,
          maintenance: m
        };
        fetch('/api/backup/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: parsedUser.email, backup: payload })
        })
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            console.log("GMC Nuvem: backup de segurança automática guardado com sucesso.");
          }
        })
        .catch(err => console.error("Erro no auto-backup em background:", err));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler Actions
  const handleAddShift = (newShift: Shift) => {
    setShifts(prev => {
      const updated = [...prev, newShift];
      triggerAutoBackup(profile, vehicle, updated, expenses, maintenanceLog);
      return updated;
    });
  };

  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts(prev => {
      const updated = prev.map(s => s.id === updatedShift.id ? updatedShift : s);
      triggerAutoBackup(profile, vehicle, updated, expenses, maintenanceLog);
      return updated;
    });
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => {
      const updated = prev.filter(s => s.id !== id);
      triggerAutoBackup(profile, vehicle, updated, expenses, maintenanceLog);
      return updated;
    });
  };

  const handleAddExpense = (newExp: Expense) => {
    setExpenses(prev => {
      const updated = [...prev, newExp];
      triggerAutoBackup(profile, vehicle, shifts, updated, maintenanceLog);
      return updated;
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      triggerAutoBackup(profile, vehicle, shifts, updated, maintenanceLog);
      return updated;
    });
  };

  const handleUpdateVehicle = (updatedVeh: Vehicle) => {
    setVehicle(updatedVeh);
    triggerAutoBackup(profile, updatedVeh, shifts, expenses, maintenanceLog);
  };

  const handleAddMaintenance = (newMaint: Maintenance) => {
    setMaintenanceLog(prev => {
      const updated = [...prev, newMaint];
      triggerAutoBackup(profile, vehicle, shifts, expenses, updated);
      return updated;
    });
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenanceLog(prev => {
      const updated = prev.filter(m => m.id !== id);
      triggerAutoBackup(profile, vehicle, shifts, expenses, updated);
      return updated;
    });
  };

  const handleUpdateProfile = (updatedProf: DriverProfile, updatedVehicle?: Vehicle) => {
    setProfile(updatedProf);
    const targetVeh = updatedVehicle || vehicle;
    if (updatedVehicle) {
      setVehicle(updatedVehicle);
    }
    triggerAutoBackup(updatedProf, targetVeh, shifts, expenses, maintenanceLog);
  };

  // Import State from Backup Codes
  const handleImportAllData = (data: {
    profile: DriverProfile;
    vehicle: Vehicle;
    shifts: Shift[];
    expenses: Expense[];
    maintenance: Maintenance[];
    timestamp?: string;
  }) => {
    if (data.profile) setProfile(data.profile);
    if (data.vehicle) setVehicle(data.vehicle);
    if (data.shifts) setShifts(data.shifts);
    if (data.expenses) setExpenses(data.expenses);
    if (data.maintenance) setMaintenanceLog(data.maintenance);

    const ts = data.timestamp || new Date().toISOString();
    localStorage.setItem('gmc_last_modified', ts);
  };

  // Helper method to update vehicle's current odometer because of high values in shift logging
  const handleUpdateVehicleOdometer = (newKm: number) => {
    if (newKm > vehicle.currentOdometer) {
      setVehicle(prev => ({
        ...prev,
        currentOdometer: newKm
      }));
    }
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab.trim());
    setSelectedReportRange(null);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* SIDEBAR NAVIGATION (Desktop - hidden on print) */}
      <aside className="no-print hidden md:flex w-64 bg-slate-900 flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 text-slate-400">
        
        {/* GMC Brand header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-base select-none">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest font-black block leading-none">GESTOR CO-PILOTO</span>
              <span className="text-sm font-black text-white uppercase tracking-tight mt-1 block">GMC CONTROLE</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <nav className="flex-1 p-4 space-y-2 text-xs font-semibold">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' && !selectedReportRange
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' && !selectedReportRange ? 'text-white' : 'text-blue-500'}`} />
            <span>Painel Financeiro</span>
          </button>

          <button
            onClick={() => handleNavigate('shifts')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'shifts' 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'shifts' ? 'text-white' : 'text-blue-500'}`} />
            <span>Diário de Turnos</span>
          </button>

          <button
            onClick={() => handleNavigate('expenses')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'expenses' 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Receipt className={`w-4 h-4 shrink-0 ${activeTab === 'expenses' ? 'text-white' : 'text-blue-500'}`} />
            <span>Despesas Extras</span>
          </button>

          <button
            onClick={() => handleNavigate('vehicle')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'vehicle' 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Car className={`w-4 h-4 shrink-0 ${activeTab === 'vehicle' ? 'text-white' : 'text-blue-500'}`} />
            <span>Meu Carro & Revisões</span>
          </button>

          <button
            onClick={() => handleNavigate('goals')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'goals' 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Target className={`w-4 h-4 shrink-0 ${activeTab === 'goals' ? 'text-white' : 'text-blue-500'}`} />
            <span>Planejamento & Metas</span>
          </button>

          <button
            onClick={() => handleNavigate('history')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart2 className={`w-4 h-4 shrink-0 ${activeTab === 'history' ? 'text-white' : 'text-blue-500'}`} />
            <span>Histórico Mensal (Ganhos/Gastos)</span>
          </button>

          <button
            onClick={() => handleNavigate('sync')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'sync' 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Cloud className={`w-4 h-4 shrink-0 ${activeTab === 'sync' ? 'text-white' : 'text-blue-500'}`} />
            <span>Sincronização & Backup</span>
          </button>

          <button
            onClick={() => handleNavigate('tools')}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'tools' 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'tools' ? 'text-white' : 'text-blue-500'}`} />
            <span>Simuladores & Comparativos</span>
          </button>
        </nav>

        {/* Driver identity footer widget */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 bg-slate-850/40 rounded-xl border border-slate-800/60">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center text-xs font-black uppercase shrink-0">
              {profile.name ? profile.name.substring(0, 2) : 'MC'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate">{profile.name}</p>
              <p className="text-[9px] text-slate-500 font-mono truncate">{profile.city}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE APPLICATION HEADER (Mobile - hidden on print) */}
      <header className="no-print md:hidden bg-slate-900 border-b border-slate-800 text-white shrink-0 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider font-extrabold block">GESTOR MOTORISTA</span>
              <span className="text-xs font-black text-white uppercase tracking-tight -mt-0.5 block">GMC CONTROLE</span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu drawer dropdown */}
        {mobileMenuOpen && (
          <div className="bg-slate-950 border-t border-slate-850 px-4 py-3 space-y-1.5 text-xs font-semibold text-slate-300 shadow-lg">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'dashboard' && !selectedReportRange ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
              <span>Painel Financeiro</span>
            </button>
            <button
              onClick={() => handleNavigate('shifts')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'shifts' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Diário de Turnos</span>
            </button>
            <button
              onClick={() => handleNavigate('expenses')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'expenses' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
            >
              <Receipt className="w-4 h-4 text-blue-500" />
              <span>Despesas Extras</span>
            </button>
            <button
              onClick={() => handleNavigate('vehicle')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'vehicle' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
            >
              <Car className="w-4 h-4 text-blue-500" />
              <span>Meu Carro & Revisões</span>
            </button>
            <button
               onClick={() => handleNavigate('goals')}
               className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'goals' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
             >
               <Target className="w-4 h-4 text-blue-500" />
               <span>Planejamento & Metas</span>
             </button>
             <button
               onClick={() => handleNavigate('history')}
               className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'history' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
             >
               <BarChart2 className="w-4 h-4 text-blue-500" />
               <span>Histórico Mensal (Ganhos/Gastos)</span>
             </button>
             <button
               onClick={() => handleNavigate('sync')}
               className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'sync' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
             >
               <Cloud className="w-4 h-4 text-blue-500" />
               <span>Sincronização & Backup</span>
             </button>
             <button
               onClick={() => handleNavigate('tools')}
               className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 ${activeTab === 'tools' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800'}`}
             >
               <Sliders className="w-4 h-4 text-blue-500" />
               <span>Simuladores & Comparativos</span>
             </button>
          </div>
        )}
      </header>

      {/* MAIN VIEWPORT BODY */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-slate-50">
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Indicators (Hidden in PDF/statement report screens) */}
          {!selectedReportRange && (
            <div className="no-print flex flex-col md:flex-row md:items-center justify-between border-b border-slate-205 pb-5 mb-6 gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-850 uppercase">
                  {activeTab === 'dashboard' && 'Painel Geral GMC'}
                  {activeTab === 'shifts' && 'Controle Diário de Trabalho'}
                  {activeTab === 'expenses' && 'Despesas Extras Lançadas'}
                  {activeTab === 'vehicle' && 'Meu Carro & Alertas Mecânicos'}
                  {activeTab === 'goals' && 'Planejador de Faturamento'}
                  {activeTab === 'history' && 'Histórico de Faturamento Mensal'}
                  {activeTab === 'sync' && 'Central de Backup & Sincronização'}
                  {activeTab === 'tools' && 'Ferramentas de Simulação & Eficiência'}
                </h2>
                <p className="text-xs text-slate-500 font-medium.">
                  {activeTab === 'dashboard' && 'Visão consolidada de lucros, faturamento das plataformas (Uber/99), despesas e alertas de óleo.'}
                  {activeTab === 'shifts' && 'Cadastre aqui suas jornadas diárias de trabalho com odômetro para controle de faturamento.'}
                  {activeTab === 'expenses' && 'Registre despesas administrativas como seguro especial APP, tag de pedágios ou limpeza profunda.'}
                  {activeTab === 'vehicle' && 'Ficha técnica do carro, odômetro do painel e monitoramento inteligente de troca de óleo.'}
                  {activeTab === 'goals' && 'Configure metas diárias e mensais ou brinque com o simulador financeiro de jornada sugerida.'}
                  {activeTab === 'history' && 'Evolução cronológica de faturamento, gráficos de lucratividade real e listagem consolidada de custos.'}
                  {activeTab === 'sync' && 'Conecte sua Conta do Google para assinatura eletrônica e compartilhe dados com notebooks e celulares.'}
                  {activeTab === 'tools' && 'Faça o simulador de corridas particulares ou confira quais plataformas (Uber, 99, InDrive ou Particular) são mais rentáveis para você.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Análise de Lucro Ativa</span>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW TAB ROUTER */}
          {selectedReportRange ? (
            <ClosedReport 
              shifts={shifts}
              expenses={expenses}
              vehicle={vehicle}
              profile={profile}
              onBack={() => setSelectedReportRange(null)}
            />
          ) : (
            <div className="duration-300">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  shifts={shifts}
                  expenses={expenses}
                  vehicle={vehicle}
                  profile={profile}
                  onNavigate={handleNavigate}
                  onSelectReportRange={(range) => setSelectedReportRange(range)}
                />
              )}

              {activeTab === 'shifts' && (
                <ShiftsManager 
                  shifts={shifts}
                  vehicle={vehicle}
                  profile={profile}
                  onAddShift={handleAddShift}
                  onUpdateShift={handleUpdateShift}
                  onDeleteShift={handleDeleteShift}
                  onUpdateVehicleOdometer={handleUpdateVehicleOdometer}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesManager 
                  expenses={expenses}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'vehicle' && (
                <VehicleManager 
                  vehicle={vehicle}
                  maintenanceLog={maintenanceLog}
                  onUpdateVehicle={handleUpdateVehicle}
                  onAddMaintenance={handleAddMaintenance}
                  onDeleteMaintenance={handleDeleteMaintenance}
                />
              )}

              {activeTab === 'goals' && (
                <GoalsManager 
                  profile={profile}
                  vehicle={vehicle}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === 'history' && (
                <MonthlyHistory
                  shifts={shifts}
                  expenses={expenses}
                  vehicle={vehicle}
                  profile={profile}
                />
              )}

              {activeTab === 'sync' && (
                <BackupManager
                  profile={profile}
                  vehicle={vehicle}
                  shifts={shifts}
                  expenses={expenses}
                  maintenance={maintenanceLog}
                  onImportAllData={handleImportAllData}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {activeTab === 'tools' && (
                <ToolsManager 
                  shifts={shifts}
                  vehicle={vehicle}
                  profile={profile}
                />
              )}
            </div>
          )}

        </main>

        {/* REGULATORY PERSISTENT FOOTER */}
        <footer className="no-print bg-white border-t border-slate-205 py-6 text-center text-xs text-slate-400 mt-auto shrink-0">
          <div className="max-w-7xl mx-auto px-4 space-y-1 font-medium select-none">
            <p>© {new Date().getFullYear()} GMC • Controle Financeiro para Motoristas.</p>
            <p className="text-[10px] text-slate-300 font-mono uppercase tracking-wide">Planejamento financeiro de precisão para maior lucratividade.</p>
          </div>
        </footer>

      </div>

    </div>
  );
}
