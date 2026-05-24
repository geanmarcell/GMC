import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Navigation, 
  Percent, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Smartphone, 
  Car,
  ChevronRight,
  Plus,
  Compass,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { Shift, Expense, Vehicle, DriverProfile } from '../types';

interface DashboardProps {
  shifts: Shift[];
  expenses: Expense[];
  vehicle: Vehicle;
  profile: DriverProfile;
  onNavigate: (tab: string) => void;
  onSelectReportRange: (range: string) => void;
}

export default function Dashboard({ 
  shifts, 
  expenses, 
  vehicle, 
  profile, 
  onNavigate,
  onSelectReportRange
}: DashboardProps) {

  // Global consolidated math (current month / all)
  const totalKm = shifts.reduce((acc, curr) => acc + curr.totalKm, 0);
  const totalHours = shifts.reduce((acc, curr) => acc + curr.hoursWorked, 0);

  // Platform gross earnings
  const uberTotal = shifts.reduce((acc, curr) => acc + curr.uberEarnings, 0);
  const total99 = shifts.reduce((acc, curr) => acc + curr.earnings99, 0);
  const indriveTotal = shifts.reduce((acc, curr) => acc + curr.indriveEarnings, 0);
  const privateTotal = shifts.reduce((acc, curr) => acc + curr.privateEarnings, 0);
  const otherTotal = shifts.reduce((acc, curr) => acc + curr.otherEarnings, 0);

  const totalGrossEarnings = uberTotal + total99 + indriveTotal + privateTotal + otherTotal;

  // Direct expenses from Shifts
  const totalShiftFuel = shifts.reduce((acc, curr) => acc + curr.fuelExpense, 0);
  const totalShiftFood = shifts.reduce((acc, curr) => acc + curr.foodExpense, 0);
  const totalShiftOther = shifts.reduce((acc, curr) => acc + curr.otherExpenses, 0);
  const shiftsDirectExpenses = totalShiftFuel + totalShiftFood + totalShiftOther;

  // Extra fixed/standalone expenses (car rent, mobile etc.)
  const totalFixedExpenses = expenses.reduce((acc, curr) => acc + curr.value, 0);

  const totalConsolidatedExpenses = shiftsDirectExpenses + totalFixedExpenses;
  const netProfit = totalGrossEarnings - totalConsolidatedExpenses;

  // Average performance KPIs
  const avgEarningsPerKm = totalKm > 0 ? (totalGrossEarnings / totalKm) : 0;
  const avgNetProfitPerKm = totalKm > 0 ? (netProfit / totalKm) : 0;
  const avgEarningsPerHour = totalHours > 0 ? (totalGrossEarnings / totalHours) : 0;
  const avgNetProfitPerHour = totalHours > 0 ? (netProfit / totalHours) : 0;

  // Goals calculations (assume we are assessing the last 30 days or cumulative month)
  // Monthly goal is on Net Profit.
  const monthlyProgressPercent = Math.min(100, Math.max(0, (netProfit / profile.monthlyGoal) * 100));

  // Platform chart data formatting
  const platformChartData = [
    { name: 'Uber App', value: uberTotal, color: '#09090b' },
    { name: '99 App', value: total99, color: '#facc15' },
    { name: 'InDrive', value: indriveTotal, color: '#14b8a6' },
    { name: 'Particular', value: privateTotal, color: '#2563eb' },
    { name: 'Gorjetas & Tips', value: otherTotal, color: '#f97316' }
  ].filter(item => item.value > 0);

  // Expens Breakdown data formatting
  const expenseChartData = [
    { name: 'Combustível (GNV/L)', value: totalShiftFuel, color: '#f97316' },
    { name: 'Lanches/Alimentação', value: totalShiftFood, color: '#fbbf24' },
    { name: 'Tag Sem Parar/Limpeza', value: totalShiftOther, color: '#06b6d4' },
    { name: 'Parcl/Aluguel/Seguros', value: expenses.filter(e => e.category === 'Aluguel' || e.category === 'Financiamento' || e.category === 'Seguro').reduce((a, c) => a + c.value, 0), color: '#8b5cf6' },
    { name: 'Internet/Plano Celular', value: expenses.filter(e => e.category === 'Celular/Internet').reduce((a, c) => a + c.value, 0), color: '#ec4899' },
    { name: 'Outras Adm.', value: expenses.filter(e => e.category === 'IPVA/Impostos' || e.category === 'Outros').reduce((a, c) => a + c.value, 0), color: '#64748b' }
  ].filter(item => item.value > 0);

  // Calendar timeline chart: last 6 worked entries
  const timelineChartData = [...shifts]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6)
    .map(s => {
      const gross = s.uberEarnings + s.earnings99 + s.indriveEarnings + s.privateEarnings + s.otherEarnings;
      const costs = s.fuelExpense + s.foodExpense + s.otherExpenses;
      const net = gross - costs;
      return {
        dia: new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        Bruto: gross,
        Custos: costs,
        Lucro: net
      };
    });

  // Smart Warnings Monitor
  const nextOilChange = vehicle.lastOilChangeOdometer + vehicle.oilChangeInterval;
  const remainingKmForOil = nextOilChange - vehicle.currentOdometer;

  return (
    <div className="space-y-6">
      
      {/* 1. INTELLIGENT ALERTS CENTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* OIL ALARM */}
        {remainingKmForOil <= 500 ? (
          <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-extrabold uppercase text-red-750">Urgente: Troca de Óleo Vencendo!</p>
              <p className="mt-0.5 text-slate-600">Restam apenas {remainingKmForOil} KM para a próxima revisão agendada. Proteja seu motor!</p>
              <button onClick={() => onNavigate('config')} className="text-red-750 hover:underline font-extrabold mt-1 uppercase text-[10px] block cursor-pointer">Verificar Veículo &rarr;</button>
            </div>
          </div>
        ) : remainingKmForOil <= 1200 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-5 h-5 text-yellow-750 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase text-yellow-800">Atenção preventiva de óleo</p>
              <p className="mt-0.5 text-slate-600">A troca do lubrificante de 10.000Km do Onix expira em menos de {remainingKmForOil} KM.</p>
              <button onClick={() => onNavigate('config')} className="text-yellow-800 hover:underline font-extrabold mt-1 uppercase text-[10px] block cursor-pointer">Revisar Peças &rarr;</button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase text-emerald-800">Motor Saudável</p>
              <p className="mt-0.5 text-slate-600">Faltam {remainingKmForOil.toLocaleString('pt-BR')} KM para a próxima revisão do lubrificante.</p>
            </div>
          </div>
        )}

        {/* METRICS NOTIFIER FEE */}
        {avgEarningsPerKm > 2.10 ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase text-blue-800">Meta Eficiência Excelente!</p>
              <p className="mt-0.5 text-slate-600">Sua média é de <strong>R$ {avgEarningsPerKm.toFixed(2)} por KM rodado</strong>. Isso sinaliza excelente aceitação de corridas curtas e dinâmicas.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase text-amber-800">Alinhamento de Rotas</p>
              <p className="mt-0.5 text-slate-600">Sua margem está em R$ {avgEarningsPerKm.toFixed(2)}/KM. Evite aceitar corridas longas sem dinâmico ou sem pedágio reembolsado.</p>
            </div>
          </div>
        )}

        {/* RECENT STATEMENT BANNER SHIFT */}
        <div className="bg-slate-900 hover:bg-slate-950 border border-slate-800 text-slate-300 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold transition">
          <Smartphone className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-black text-white uppercase text-[11px] tracking-wide">Relatórios Fiscais GMC</p>
            <p className="mt-0.5 text-slate-400">Gere e emita laudos consolidados em formato de folha de pagamento selados para comprovação.</p>
            <button 
              onClick={() => {
                onSelectReportRange('month'); // auto route to ClosedReport
              }} 
              className="text-blue-400 hover:underline font-extrabold mt-1 uppercase text-[10px] block cursor-pointer"
            >
              Emitir Extrato Próximo &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* 2. CORE FINANCIAL BALANCES HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Gross Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Faturamento Bruto</span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">R$ {totalGrossEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[9px] text-emerald-600 font-bold">Lançado por apps e corridas</p>
          </div>
        </div>

        {/* Consolidated Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3.5 rounded-xl bg-red-50 text-red-600">
            <TrendingUp className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Despesas Operacionais</span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">R$ {totalConsolidatedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[9px] text-red-550 font-bold">Combustível + custos fixos do carro</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Rendimento Líquido (Real Pocket)</span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[9px] text-blue-600 font-bold">Sua sobra real após amortizações</p>
          </div>
        </div>

      </div>

      {/* 3. PERFORMANCE METRICS SPARK CARDS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-widest">Indicadores Médios de Desempenho Real</span>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          
          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
            <span className="text-slate-405 text-[9px] uppercase font-bold tracking-wider">KM rodados totais</span>
            <p className="text-lg font-black text-slate-800 font-mono mt-0.5">{totalKm.toLocaleString('pt-BR')} km</p>
            <p className="text-[9px] text-slate-400">Medido pelo odômetro</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
            <span className="text-slate-405 text-[9px] uppercase font-bold tracking-wider">Tempo total rodado</span>
            <p className="text-lg font-black text-slate-800 font-mono mt-0.5">{totalHours.toFixed(1)} hrs</p>
            <p className="text-[9px] text-slate-400">Com aplicativos online</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
            <span className="text-slate-405 text-[9px] uppercase font-bold tracking-wider">Médio recebido por KM</span>
            <p className="text-lg font-black text-slate-800 font-mono mt-0.5">R$ {avgEarningsPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km</p>
            <p className="text-[9px] text-blue-650 font-bold">R$ {avgNetProfitPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} líquido</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
            <span className="text-slate-405 text-[9px] uppercase font-bold tracking-wider">Mão de obra por Hora</span>
            <p className="text-lg font-black text-slate-800 font-mono mt-0.5">R$ {avgEarningsPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/hr</p>
            <p className="text-[9px] text-emerald-700 font-bold">R$ {avgNetProfitPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} líquido</p>
          </div>

        </div>
      </div>

      {/* 4. CHARTS SECTION PROGRESS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROGRESS METAS RADAR BLOCK */}
        <div className="lg:col-span-1 bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">Acompanhamento de Caixa</span>
            <h4 className="text-lg font-black tracking-tight leading-snug">Meta Mensal Líquida de Lucro</h4>
            
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-baseline text-xs font-bold font-mono">
                <span className="text-slate-400">Progresso Atual:</span>
                <span className="text-blue-400 text-base">R$ {netProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              </div>
              {/* Horizontal line indicator */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${monthlyProgressPercent}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{monthlyProgressPercent.toFixed(1)}% Completo</span>
                <span>Alvo: R$ {profile.monthlyGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-850 border border-slate-800 rounded-xl text-[10px] text-slate-400 leading-relaxed">
            <p className="font-extrabold text-white flex items-center gap-1 mb-0.5"><Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Dica de Roteamento Inteligente</p>
            Rodando {profile.workingDaysPerWeek} dias na semana com uma média de faturamento bruto diário de R$ {(profile.dailyGoal).toFixed(0)}, você baterá com folga sua meta líquida devido ao baixo custo tributário do GNV.
          </div>

          <button 
            onClick={() => onNavigate(' os')} // Navigate to goals simulators
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold tracking-wider uppercase rounded-xl transition cursor-pointer"
          >
            Ajustar Metas & Simulação
          </button>
        </div>

        {/* TIME GRAPH LINE BALANÇO */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-2">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block">Balanço das Últimas 6 Jornadas (Evolução)</span>
          
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBruto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                  labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="Bruto" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBruto)" />
                <Area type="monotone" dataKey="Lucro" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLucro)" name="Lucro Líq." />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. SPLIT PLATFORMS VS COST DISTRIBUTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        
        {/* PLATFORMS PIE CHART */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block">Ganhos por Plataforma de Trabalho</span>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="h-44 w-1/2 min-w-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {platformChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
                <span className="text-[9px] uppercase font-bold text-slate-450 block">Bruto</span>
                <span className="text-sm font-black text-slate-900 font-mono">R$ {totalGrossEarnings.toFixed(0)}</span>
              </div>
            </div>

            {/* Platform legend details */}
            <div className="flex-1 space-y-2 text-xs font-semibold text-slate-650 w-full">
              {platformChartData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-slate-805">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">R$ {item.value.toFixed(0)} ({((item.value / totalGrossEarnings)*100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* EXPENSE BREAKDOWN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block">Quadro de Distribuição de Despesas</span>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="h-44 w-1/2 min-w-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
                <span className="text-[9px] uppercase font-bold text-slate-450 block">Custos</span>
                <span className="text-sm font-black text-red-650 font-mono">R$ {totalConsolidatedExpenses.toFixed(0)}</span>
              </div>
            </div>

            {/* Cost legend details */}
            <div className="flex-1 space-y-2 text-xs font-semibold text-slate-650 w-full">
              {expenseChartData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-slate-805">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </span>
                  <span className="font-mono text-red-650 font-bold">R$ {item.value.toFixed(0)} ({((item.value / totalConsolidatedExpenses)*100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
