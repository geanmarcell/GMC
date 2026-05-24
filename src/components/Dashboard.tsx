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
  Info,
  Calendar,
  ChevronDown
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

  // Dynamic Month & Year list generator
  const getMonthsList = () => {
    const list = new Set<string>();
    shifts.forEach(s => {
      if (s.date) list.add(s.date.substring(0, 7)); // YYYY-MM
    });
    expenses.forEach(e => {
      if (e.date) list.add(e.date.substring(0, 7)); // YYYY-MM
    });
    // Fallback if empty to have a starting record
    if (list.size === 0) {
      list.add(new Date().toISOString().substring(0, 7));
    }
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  };

  const monthsList = React.useMemo(() => getMonthsList(), [shifts, expenses]);
  const [selectedMonth, setSelectedMonth] = React.useState<string>(() => monthsList[0] || new Date().toISOString().substring(0, 7));
  const [chartTab, setChartTab] = React.useState<'month' | 'year'>('month');

  const selectedYear = selectedMonth.substring(0, 4);

  const formatMonthLabel = (yearMonth: string) => {
    if (!yearMonth) return '';
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 15);
    const monthStr = date.toLocaleDateString('pt-BR', { month: 'long' });
    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1) + ' de ' + year;
  };

  // Monthly breakdown calculations
  const monthShifts = React.useMemo(() => {
    return shifts.filter(s => s.date && s.date.startsWith(selectedMonth));
  }, [shifts, selectedMonth]);

  const monthUber = monthShifts.reduce((acc, curr) => acc + curr.uberEarnings, 0);
  const month99 = monthShifts.reduce((acc, curr) => acc + curr.earnings99, 0);
  const monthIndrive = monthShifts.reduce((acc, curr) => acc + curr.indriveEarnings, 0);
  const monthPrivate = monthShifts.reduce((acc, curr) => acc + curr.privateEarnings, 0);
  const monthOther = monthShifts.reduce((acc, curr) => acc + curr.otherEarnings, 0);
  const monthGross = monthUber + month99 + monthIndrive + monthPrivate + monthOther;

  const monthShiftFuel = monthShifts.reduce((acc, curr) => acc + curr.fuelExpense, 0);
  const monthShiftFood = monthShifts.reduce((acc, curr) => acc + curr.foodExpense, 0);
  const monthShiftOther = monthShifts.reduce((acc, curr) => acc + curr.otherExpenses, 0);
  const monthDirectExpenses = monthShiftFuel + monthShiftFood + monthShiftOther;

  const monthFixedExpenses = React.useMemo(() => {
    return expenses.filter(e => e.date && e.date.startsWith(selectedMonth)).reduce((acc, curr) => acc + curr.value, 0);
  }, [expenses, selectedMonth]);

  const monthConsolidatedExpenses = monthDirectExpenses + monthFixedExpenses;
  const monthNet = monthGross - monthConsolidatedExpenses;

  // Annual breakdown calculations
  const yearShifts = React.useMemo(() => {
    return shifts.filter(s => s.date && s.date.startsWith(selectedYear));
  }, [shifts, selectedYear]);

  const yearUber = yearShifts.reduce((acc, curr) => acc + curr.uberEarnings, 0);
  const year99 = yearShifts.reduce((acc, curr) => acc + curr.earnings99, 0);
  const yearIndrive = yearShifts.reduce((acc, curr) => acc + curr.indriveEarnings, 0);
  const yearPrivate = yearShifts.reduce((acc, curr) => acc + curr.privateEarnings, 0);
  const yearOther = yearShifts.reduce((acc, curr) => acc + curr.otherEarnings, 0);
  const yearGross = yearUber + year99 + yearIndrive + yearPrivate + yearOther;

  const yearShiftFuel = yearShifts.reduce((acc, curr) => acc + curr.fuelExpense, 0);
  const yearShiftFood = yearShifts.reduce((acc, curr) => acc + curr.foodExpense, 0);
  const yearShiftOther = yearShifts.reduce((acc, curr) => acc + curr.otherExpenses, 0);
  const yearDirectExpenses = yearShiftFuel + yearShiftFood + yearShiftOther;

  const yearFixedExpenses = React.useMemo(() => {
    return expenses.filter(e => e.date && e.date.startsWith(selectedYear)).reduce((acc, curr) => acc + curr.value, 0);
  }, [expenses, selectedYear]);

  const yearConsolidatedExpenses = yearDirectExpenses + yearFixedExpenses;
  const yearNet = yearGross - yearConsolidatedExpenses;

  // Chart datasets
  const monthChartData = React.useMemo(() => {
    return monthShifts
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(s => {
        const gross = s.uberEarnings + s.earnings99 + s.indriveEarnings + s.privateEarnings + s.otherEarnings;
        const costs = s.fuelExpense + s.foodExpense + s.otherExpenses;
        const net = gross - costs;
        return {
          dia: s.date.substring(8, 10),
          dataCompleta: new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          Faturamento: Number(gross.toFixed(2)),
          Despesas: Number(costs.toFixed(2)),
          Lucro: Number(net.toFixed(2))
        };
      });
  }, [monthShifts]);

  const annualChartData = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = String(i + 1).padStart(2, '0');
      const yearMonth = `${selectedYear}-${monthNum}`;
      
      const mShifts = shifts.filter(s => s.date && s.date.startsWith(yearMonth));
      const mExpenses = expenses.filter(e => e.date && e.date.startsWith(yearMonth));
      
      const uber = mShifts.reduce((acc, curr) => acc + curr.uberEarnings, 0);
      const m99 = mShifts.reduce((acc, curr) => acc + curr.earnings99, 0);
      const indrive = mShifts.reduce((acc, curr) => acc + curr.indriveEarnings, 0);
      const priv = mShifts.reduce((acc, curr) => acc + curr.privateEarnings, 0);
      const other = mShifts.reduce((acc, curr) => acc + curr.otherEarnings, 0);
      const gross = uber + m99 + indrive + priv + other;
      
      const fuel = mShifts.reduce((acc, curr) => acc + curr.fuelExpense, 0);
      const food = mShifts.reduce((acc, curr) => acc + curr.foodExpense, 0);
      const tagClean = mShifts.reduce((acc, curr) => acc + curr.otherExpenses, 0);
      const extraCostsTotal = mExpenses.reduce((acc, curr) => acc + curr.value, 0);
      const totalExpenses = fuel + food + tagClean + extraCostsTotal;
      const netProfit = gross - totalExpenses;
      
      return {
        monthNum,
        name: new Date(Number(selectedYear), i, 15).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        Faturamento: Number(gross.toFixed(0)),
        Despesas: Number(totalExpenses.toFixed(0)),
        Lucro: Number(netProfit.toFixed(0)),
        hasData: mShifts.length > 0 || mExpenses.length > 0
      };
    }).filter(item => item.hasData);
  }, [shifts, expenses, selectedYear]);

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

      {/* ANALYSIS FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Período de Análise</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Selecione para alterar faturamento bruto, despesas e rendimento líquido.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">Análise Temporal:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-blue-600 cursor-pointer shadow-xs"
          >
            {monthsList.map(m => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. CORE FINANCIAL BALANCES HIGHLIGHTS (MONTH VS YEAR SPLIT GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MONTH SELECTED BLOCK */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-105 pb-3">
            <span className="text-[11px] uppercase font-mono font-black text-blue-600 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Faturamento do Mês ({formatMonthLabel(selectedMonth).toUpperCase()})
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{monthShifts.length} TRABALHOS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Monthly Gross */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100/70 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-extrabold text-emerald-800/80 tracking-wider block">Receita Bruta</span>
                <p className="text-lg font-black text-emerald-705 font-mono mt-1">R$ {monthGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-[9px] text-emerald-600 font-medium mt-1 inline-block border-t border-emerald-100/40 pt-1">Ganhos em apps</span>
            </div>

            {/* Monthly Expenses */}
            <div className="p-4 rounded-xl bg-red-50/40 border border-red-100/70 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-extrabold text-red-800/80 tracking-wider block">Custos Totais</span>
                <p className="text-lg font-black text-red-655 font-mono mt-1">R$ {monthConsolidatedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-[9px] text-red-550 font-medium mt-1 inline-block border-t border-red-100/40 pt-1">Combustível/Extras</span>
            </div>

            {/* Monthly net margin */}
            <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100/70 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-extrabold text-blue-800/80 tracking-wider block">Sobra Líquida</span>
                <p className="text-lg font-black text-blue-655 font-mono mt-1">R$ {monthNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-[9px] text-blue-600 font-semibold mt-1 inline-block border-t border-blue-100/40 pt-1 font-mono">Margem Real: {monthGross > 0 ? ((monthNet / monthGross) * 100).toFixed(0) : 0}%</span>
            </div>

          </div>
        </div>

        {/* YEAR SELECTED ACUMULADO */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-[11px] uppercase font-mono font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Acumulado do Ano ({selectedYear})
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">{yearShifts.length} TRABALHOS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Annual Gross */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800/70 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 tracking-wider block">Receita Bruta</span>
                <p className="text-lg font-black text-emerald-400 font-mono mt-1">R$ {yearGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-[9px] text-slate-500 font-bold mt-1 inline-block border-t border-slate-800/40 pt-1">Soma de todos meses</span>
            </div>

            {/* Annual Expenses */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800/70 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 tracking-wider block">Custos Totais</span>
                <p className="text-lg font-black text-red-400 font-mono mt-1">R$ {yearConsolidatedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-[9px] text-slate-500 font-bold mt-1 inline-block border-t border-slate-800/40 pt-1">Débitos operacionais</span>
            </div>

            {/* Annual Net */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800/70 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 tracking-wider block">Sobra Líquida</span>
                <p className="text-lg font-black text-blue-400 font-mono mt-1">R$ {yearNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="text-[9px] text-slate-500 font-bold mt-1 inline-block border-t border-slate-800/40 pt-1 font-mono">Margem Anual: {yearGross > 0 ? ((yearNet / yearGross) * 100).toFixed(0) : 0}%</span>
            </div>

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
            onClick={() => onNavigate('goals')} // Navigate to goals simulators
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold tracking-wider uppercase rounded-xl transition cursor-pointer"
          >
            Ajustar Metas & Simulação
          </button>
        </div>

        {/* TIME GRAPH LINE BALANÇO (DYNAMIC DUAL CHART CONTAINER) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[9px] uppercase font-mono font-black text-slate-400 tracking-wider block">Visualização Gráfica do Desempenho</span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {chartTab === 'month' ? `Detalhamento Diário: ${formatMonthLabel(selectedMonth)}` : `Evolução Mensal do Ano: ${selectedYear}`}
              </h3>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setChartTab('month')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all duration-150 cursor-pointer ${
                  chartTab === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Gráfico do Mês
              </button>
              <button
                onClick={() => setChartTab('year')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all duration-150 cursor-pointer ${
                  chartTab === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Gráfico do Ano
              </button>
            </div>
          </div>
          
          <div className="h-56 w-full pt-2">
            {chartTab === 'month' ? (
              monthChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMonthBruto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMonthLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dia" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                      labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
                      formatter={(val: number) => [`R$ ${val.toFixed(2)}`]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="Faturamento" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMonthBruto)" name="Receita Bruta" />
                    <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} name="Despesas" />
                    <Area type="monotone" dataKey="Lucro" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMonthLucro)" name="Lucro Líquido" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="font-extrabold text-slate-600">Nenhum turno registrado</p>
                  <p className="text-[10px] text-slate-400">Não há jornadas de direção salvas neste mês.</p>
                </div>
              )
            ) : (
              annualChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                      labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                      formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                    <Bar dataKey="Faturamento" fill="#10b981" radius={[3, 3, 0, 0]} name="Faturamento Bruto" />
                    <Bar dataKey="Despesas" fill="#ef4444" radius={[3, 3, 0, 0]} name="Despesas Totais" />
                    <Bar dataKey="Lucro" fill="#2563eb" radius={[3, 3, 0, 0]} name="Rendimento Líquido" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="font-extrabold text-slate-600">Nenhum registro para o ano {selectedYear}</p>
                  <p className="text-[10px] text-slate-400">Sem faturamentos ou despesas cadastrados neste ano.</p>
                </div>
              )
            )}
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
