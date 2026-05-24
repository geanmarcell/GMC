import React, { useState } from 'react';
import { 
  BarChart2, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Car, 
  Percent,
  ChevronRight,
  ChevronDown,
  FileText,
  PieChart as PieChartIcon,
  Smartphone,
  Sparkles,
  Info,
  Download,
  Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Shift, Expense, Vehicle, DriverProfile } from '../types';

interface MonthlyHistoryProps {
  shifts: Shift[];
  expenses: Expense[];
  vehicle: Vehicle;
  profile: DriverProfile;
}

export default function MonthlyHistory({ shifts, expenses, vehicle, profile }: MonthlyHistoryProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [expandedDetails, setExpandedDetails] = useState<boolean>(true);

  // Parse all months with data (from shifts and standalone expenses)
  const getAvailableMonths = () => {
    const monthsSet = new Set<string>();
    
    shifts.forEach(s => {
      if (s.date) {
        monthsSet.add(s.date.substring(0, 7)); // YYYY-MM
      }
    });

    expenses.forEach(e => {
      if (e.date) {
        monthsSet.add(e.date.substring(0, 7)); // YYYY-MM
      }
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
  };

  const availableMonths = getAvailableMonths();

  // If no selected month and we have months, set the newest as default
  if (!selectedMonth && availableMonths.length > 0) {
    setSelectedMonth(availableMonths[0]);
  }

  // Format month name to Portuguese
  const formatMonthName = (yearMonth: string) => {
    if (!yearMonth) return '';
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 15);
    const monthStr = date.toLocaleDateString('pt-BR', { month: 'long' });
    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1) + ' ' + year;
  };

  // Calculate stats for a single month YYYY-MM
  const calculateMonthStats = (yearMonth: string) => {
    // Shifts in this month
    const monthShifts = shifts.filter(s => s.date && s.date.startsWith(yearMonth));
    
    // Total platforms earnings in this month
    const uber = monthShifts.reduce((acc, curr) => acc + curr.uberEarnings, 0);
    const m99 = monthShifts.reduce((acc, curr) => acc + curr.earnings99, 0);
    const indrive = monthShifts.reduce((acc, curr) => acc + curr.indriveEarnings, 0);
    const priv = monthShifts.reduce((acc, curr) => acc + curr.privateEarnings, 0);
    const other = monthShifts.reduce((acc, curr) => acc + curr.otherEarnings, 0);
    const gross = uber + m99 + indrive + priv + other;

    // Direct shift expenses (costs registered during shifts)
    const fuel = monthShifts.reduce((acc, curr) => acc + curr.fuelExpense, 0);
    const food = monthShifts.reduce((acc, curr) => acc + curr.foodExpense, 0);
    const tagClean = monthShifts.reduce((acc, curr) => acc + curr.otherExpenses, 0);

    // Standalone fixed expenses in this month
    const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(yearMonth));
    const extraCostsTotal = monthExpenses.reduce((acc, curr) => acc + curr.value, 0);

    // Total expenses
    const totalExpenses = fuel + food + tagClean + extraCostsTotal;

    // Profit margin calculation (pocket money)
    const netProfit = gross - totalExpenses;

    const totalKm = monthShifts.reduce((acc, curr) => acc + curr.totalKm, 0);
    const totalHours = monthShifts.reduce((acc, curr) => acc + curr.hoursWorked, 0);

    return {
      gross,
      totalExpenses,
      netProfit,
      uber,
      m99,
      indrive,
      priv,
      other,
      fuel,
      food,
      tagClean,
      extraCostsTotal,
      extras: monthExpenses,
      shiftsCount: monthShifts.length,
      totalKm,
      totalHours,
      avgKmPerDay: monthShifts.length > 0 ? (totalKm / monthShifts.length) : 0,
      earningsPerKm: totalKm > 0 ? (gross / totalKm) : 0,
      netEarningsPerKm: totalKm > 0 ? (netProfit / totalKm) : 0,
      earningsPerHour: totalHours > 0 ? (gross / totalHours) : 0,
      netEarningsPerHour: totalHours > 0 ? (netProfit / totalHours) : 0
    };
  };

  // Calculate comparative chart data for the last 6 months
  const chartData = availableMonths.slice().reverse().map(m => {
    const stats = calculateMonthStats(m);
    return {
      name: formatMonthName(m),
      Faturamento: Number(stats.gross.toFixed(0)),
      Despesas: Number(stats.totalExpenses.toFixed(0)),
      Lucro: Number(stats.netProfit.toFixed(0))
    };
  });

  const activeStats = selectedMonth ? calculateMonthStats(selectedMonth) : null;
  const netProfitPercentage = activeStats && activeStats.gross > 0 
    ? (activeStats.netProfit / activeStats.gross) * 100 
    : 0;

  // Platform chart data formatting based on selectedMonth
  const selectedMonthPlatformData = React.useMemo(() => {
    if (!activeStats) return [];
    return [
      { name: 'Uber App', value: activeStats.uber, color: '#09090b' },
      { name: '99 App', value: activeStats.m99, color: '#facc15' },
      { name: 'InDrive', value: activeStats.indrive, color: '#14b8a6' },
      { name: 'Particular', value: activeStats.priv, color: '#2563eb' },
      { name: 'Gorjetas & Tips', value: activeStats.other, color: '#f97316' }
    ].filter(item => item.value > 0);
  }, [activeStats]);

  // Expense Breakdown data formatting based on selectedMonth
  const selectedMonthExpenseData = React.useMemo(() => {
    if (!activeStats) return [];
    
    const extraGrouped: { [key: string]: number } = {};
    activeStats.extras.forEach(e => {
      extraGrouped[e.category] = (extraGrouped[e.category] || 0) + e.value;
    });

    const list = [
      { name: 'Combustível (GNV/L)', value: activeStats.fuel, color: '#f97316' },
      { name: 'Lanches/Alimentação', value: activeStats.food, color: '#fbbf24' },
      { name: 'Tag / Lava-jato', value: activeStats.tagClean, color: '#06b6d4' }
    ];

    Object.entries(extraGrouped).forEach(([cat, val]) => {
      let color = '#64748b'; // default others
      if (cat === 'Aluguel' || cat === 'Financiamento' || cat === 'Seguro') color = '#8b5cf6';
      if (cat === 'Celular/Internet') color = '#ec4899';
      list.push({ name: cat, value: val, color });
    });

    return list.filter(item => item.value > 0);
  }, [activeStats]);

  // Export active month data to CSV natively
  const exportToCSV = () => {
    if (!activeStats || !selectedMonth) return;
    const monthShifts = shifts.filter(s => s.date && s.date.startsWith(selectedMonth));
    const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(selectedMonth));

    // Formulate CSV layout with semicolon separator for European/LatAm systems (Excel standard)
    let csv = '\uFEFF'; // UTF-8 Byte Order Mark
    csv += `RELATORIO FINANCEIRO MENSAL - ${formatMonthName(selectedMonth).toUpperCase()}\n`;
    csv += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    csv += `=== RESUMO CONSOLIDADO ===\n`;
    csv += `Faturamento Bruto;R$ ${activeStats.gross.toFixed(2)}\n`;
    csv += `Despesas Operacionais;R$ ${activeStats.totalExpenses.toFixed(2)}\n`;
    csv += `Resultado Liquido (Lucro);R$ ${activeStats.netProfit.toFixed(2)}\n`;
    csv += `Margem Liquida;${netProfitPercentage.toFixed(1)}%\n`;
    csv += `Numero de Dias Trabalhados;${activeStats.shiftsCount}\n`;
    csv += `Horas Trabalhadas;${activeStats.totalHours.toFixed(2)}\n`;
    csv += `Km Rodados;${activeStats.totalKm.toFixed(1)}\n\n`;

    csv += `=== DETALHAMENTO DE TURNOS ===\n`;
    csv += `Data;Horas Trabalhadas;Km Rodados;Uber;99;InDrive;Particular;Outros;Combustivel;Alimentacao;Lava-Jato/Tag;Bruto Diario;Resultado Diario;Rendimento h;Rendimento Km\n`;
    
    monthShifts.forEach(s => {
      const dailyGross = s.uberEarnings + s.earnings99 + s.indriveEarnings + s.privateEarnings + s.otherEarnings;
      const dailyCost = s.fuelExpense + s.foodExpense + s.otherExpenses;
      const dailyNet = dailyGross - dailyCost;
      const rHour = s.hoursWorked > 0 ? (dailyGross / s.hoursWorked).toFixed(2) : '0.00';
      const rKm = s.totalKm > 0 ? (dailyGross / s.totalKm).toFixed(2) : '0.00';
      csv += `${s.date};${s.hoursWorked};${s.totalKm};${s.uberEarnings.toFixed(2)};${s.earnings99.toFixed(2)};${s.indriveEarnings.toFixed(2)};${s.privateEarnings.toFixed(2)};${s.otherEarnings.toFixed(2)};${s.fuelExpense.toFixed(2)};${s.foodExpense.toFixed(2)};${s.otherExpenses.toFixed(2)};${dailyGross.toFixed(2)};${dailyNet.toFixed(2)};${rHour};${rKm}\n`;
    });

    csv += `\n=== DESPESAS ADMINISTRATIVAS & FIXAS ===\n`;
    csv += `Data;Categoria;Descricao do Lancamento;Valor de Custo\n`;
    monthExpenses.forEach(e => {
      csv += `${e.date};${e.category};"${e.description.replace(/"/g, '""')}";${e.value.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financeiro_motorista_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MONTH SELECTOR & LEDGER CARD */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Histórico Mensal
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Selecione o período desejado nas opções abaixo para visualizar despesas, faturamento granular e eficácia das horas de trabalho de cada mês.
            </p>

            <div className="space-y-2 pt-2">
              {availableMonths.map((m) => {
                const monthInfo = calculateMonthStats(m);
                const isSelected = selectedMonth === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left flex justify-between items-center transition cursor-pointer text-xs font-semibold ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-slate-50 border-slate-205 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold">{formatMonthName(m)}</p>
                      <p className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-450'}`}>{monthInfo.shiftsCount} turnos lançados</p>
                    </div>
                    <div className="text-right space-y-0.5 font-mono">
                      <p className="font-black">R$ {monthInfo.netProfit.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                      <p className={`text-[9px] uppercase font-bold ${monthInfo.netProfit >= 0 ? (isSelected ? 'text-emerald-300' : 'text-emerald-700') : (isSelected ? 'text-red-300' : 'text-red-650')}`}>
                        {monthInfo.netProfit >= 0 ? 'Lucro' : 'Prejuízo'}
                      </p>
                    </div>
                  </button>
                );
              })}
              {availableMonths.length === 0 && (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  Ainda não há dados suficientes gravados para consolidação de meses. Comece cadastrando turnos e despesas extras.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono mt-6">
            Meta Mensal Ativa: R$ {profile.monthlyGoal.toLocaleString('pt-BR')} líquido
          </div>
        </div>

        {/* MONTHLY COMPARATIVE CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Evolução Mensal Comparativa</h3>
              <p className="text-[11px] text-slate-500 font-semibold">Comparativo visual de Faturamento Bruto, Despesas Operacionais e Lucrolo real.</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>

          <div className="h-56 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11 }}
                    labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Bar dataKey="Faturamento" fill="#10b981" radius={[4, 4, 0, 0]} name="Ganhos Brutos" />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesas Totais" />
                  <Bar dataKey="Lucro" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sobrou Líquido" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center border border-dashed border-slate-205 rounded-xl">
                Nenhum dado lançado para geração de gráficos.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SELECTED MONTH DETAIL COMPONENT (IF SELECTED) */}
      {selectedMonth && activeStats && (
        <div id="printable-area" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
          
          {/* Detailed monthly header block */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider">Fechamento do Período</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
                Balancete de {formatMonthName(selectedMonth)}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* CSV button */}
              <button
                onClick={exportToCSV}
                className="no-print h-9 px-3.5 bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200 shadow-sm"
                title="Exportar dados do mês para formato de planilha Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Exportar XLS/CSV</span>
              </button>

              {/* PDF Print button */}
              <button
                onClick={triggerPrint}
                className="no-print h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Imprimir ou Salvar este balancete em formato PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>

              {/* Net profit success tag flag */}
              <div className={`h-9 px-3.5 rounded-xl flex items-center gap-1.5 font-bold text-[11px] ${
                activeStats.netProfit >= 0 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                  : 'bg-red-50 text-red-800 border border-red-105'
              }`}>
                {activeStats.netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-red-650" />}
                <span>
                  Status: {activeStats.netProfit >= 0 ? `Lucro real de R$ ${activeStats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `Prejuízo de R$ ${Math.abs(activeStats.netProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN BALANCES GRIDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Total Gross Revenue Breakdown status */}
            <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 text-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-black text-emerald-600 block">Faturamento Bruto Consolidado</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-1">R$ {activeStats.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <div className="mt-4 space-y-2 border-t border-emerald-100/60 pt-3 text-[11px] font-semibold text-slate-650">
                  <div className="flex justify-between">
                    <span>Uber App:</span>
                    <span className="font-mono font-bold text-slate-900">R$ {activeStats.uber.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>99 App:</span>
                    <span className="font-mono font-bold text-slate-900">R$ {activeStats.m99.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>InDrive:</span>
                    <span className="font-mono font-bold text-slate-900">R$ {activeStats.indrive.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Corridas Particulares:</span>
                    <span className="font-mono font-bold text-slate-900">R$ {activeStats.priv.toFixed(2)}</span>
                  </div>
                  {activeStats.other > 0 && (
                    <div className="flex justify-between">
                      <span>Outros / Gorjetas:</span>
                      <span className="font-mono font-bold text-slate-900">R$ {activeStats.other.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total Expenses costs breakdown */}
            <div className="bg-red-50/50 p-5 rounded-xl border border-red-100 text-slate-805 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-mono font-black text-red-650 block">Despesas e Perdas Operacionais</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-1">R$ {activeStats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                
                <div className="mt-4 space-y-2 border-t border-red-100/60 pt-3 text-[11px] font-semibold text-slate-650">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">Combustível:</span>
                    <span className="font-mono font-bold text-slate-900">R$ {activeStats.fuel.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alimentação (Rua):</span>
                    <span className="font-mono font-bold text-slate-900">R$ {activeStats.food.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tag / Lava-jato rápido:</span>
                    <span className="font-mono font-bold text-slate-900">R$ {activeStats.tagClean.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custos Fixos e Extras:</span>
                    <span className="font-mono font-bold text-red-650">R$ {activeStats.extraCostsTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[9px] text-red-650 font-medium italic pt-1 border-t border-red-100/60 font-sans">
                    Combustível representa {activeStats.gross > 0 ? ((activeStats.fuel/activeStats.gross)*100).toFixed(1) : 0}% da sua renda.
                  </p>
                </div>
              </div>
            </div>

            {/* Cash Net Surplus pocket */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-mono font-black text-blue-600 block">Sobra Líquida Real (Lucro)</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">R$ {activeStats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[9px] text-blue-650 font-bold uppercase mt-1">Eficiência de Caixa</p>
                </div>

                {/* Progress Circle Visual */}
                <div className="space-y-2 pt-2 border-t border-blue-100/60">
                  <div className="flex justify-between items-baseline text-[10px] font-bold text-slate-500">
                    <span>Margem líquida de lucro:</span>
                    <span className="text-blue-600 font-mono text-xs">{netProfitPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, netProfitPercentage))}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                    De cada R$ 100 brutos recebidos das plataformas, você guardou <strong>R$ {netProfitPercentage.toFixed(0)} livre de custos</strong>.
                  </p>
                </div>
              </div>

              {activeStats.netProfit >= profile.monthlyGoal ? (
                <div className="p-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase text-center flex items-center justify-center gap-1 mt-4">
                  <Sparkles className="w-3.5 h-3.5 animate-bounce" /> Meta batida com sucesso!
                </div>
              ) : (
                <div className="text-[10px] font-bold text-slate-400 mt-4 text-center">
                  Faltam R$ {Math.max(0, (profile.monthlyGoal - activeStats.netProfit)).toLocaleString('pt-BR')} para atingir a meta mensal.
                </div>
              )}
            </div>

          </div>

          {/* MONTHLY DISTRIBUTION CHARTS FOR SELECTED MONTH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-150 p-5 rounded-xl">
            {/* PLATFORMS PIE CHART */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block text-left">Ganhos por Plataforma (Neste Mês)</span>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="h-44 w-full sm:w-1/2 min-w-[160px] relative flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedMonthPlatformData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {selectedMonthPlatformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Bruto Mês</span>
                    <span className="text-xs font-black text-slate-800 font-mono">R$ {activeStats.gross.toFixed(0)}</span>
                  </div>
                </div>

                {/* Platform legend details */}
                <div className="flex-1 space-y-1.5 text-xs font-semibold text-slate-650 w-full text-left">
                  {selectedMonthPlatformData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <span className="font-mono text-slate-900 font-bold">R$ {item.value.toFixed(0)} ({((item.value / (activeStats.gross || 1))*100).toFixed(0)}%)</span>
                    </div>
                  ))}
                  {selectedMonthPlatformData.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">Nenhum faturamento registrado neste mês.</p>
                  )}
                </div>
              </div>
            </div>

            {/* EXPENSES BREAKDOWN PIE CHART */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block text-left">Distribuição de Custos (Neste Mês)</span>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="h-44 w-full sm:w-1/2 min-w-[160px] relative flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedMonthExpenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {selectedMonthExpenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Custos Mês</span>
                    <span className="text-xs font-black text-red-650 font-mono">R$ {activeStats.totalExpenses.toFixed(0)}</span>
                  </div>
                </div>

                {/* Expense legend details */}
                <div className="flex-1 space-y-1.5 text-xs font-semibold text-slate-650 w-full text-left">
                  {selectedMonthExpenseData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800 font-sans">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <span className="font-mono text-red-650 font-bold">R$ {item.value.toFixed(0)} ({((item.value / (activeStats.totalExpenses || 1))*100).toFixed(0)}%)</span>
                    </div>
                  ))}
                  {selectedMonthExpenseData.length === 0 && (
                    <p className="text-[10px] text-slate-404 italic">Nenhuma despesa ou custo registrado neste mês.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DRIVING TIME EFFICIENCY STATS FOR SELECTED MONTH */}
          <div className="bg-slate-50 border border-slate-150 p-5 rounded-xl space-y-4">
            <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider">Métricas de Rodagem e Trabalho</span>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
              <div className="p-3 bg-white border border-slate-205 rounded-xl">
                <span className="text-slate-450 uppercase text-[9px] font-extrabold block">Dias de Trabalho</span>
                <p className="text-base font-black text-slate-800 mt-0.5">{activeStats.shiftsCount} dias</p>
                <p className="text-[9px] text-slate-400">{activeStats.avgKmPerDay.toFixed(0)} km médios/dia</p>
              </div>

              <div className="p-3 bg-white border border-slate-205 rounded-xl">
                <span className="text-slate-450 uppercase text-[9px] font-extrabold block">Horas Online</span>
                <p className="text-base font-black text-slate-800 mt-0.5">{activeStats.totalHours.toFixed(1)} hrs</p>
                <p className="text-[9px] text-slate-400">Total acumulado</p>
              </div>

              <div className="p-3 bg-white border border-slate-205 rounded-xl">
                <span className="text-slate-450 uppercase text-[9px] font-extrabold block">Faturamento / KM</span>
                <p className="text-base font-black text-slate-800 mt-0.5">R$ {activeStats.earningsPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km</p>
                <p className="text-[10px] text-blue-600 font-bold">R$ {activeStats.netEarningsPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} líq/km</p>
              </div>

              <div className="p-3 bg-white border border-slate-205 rounded-xl">
                <span className="text-slate-450 uppercase text-[9px] font-extrabold block">Lucro Real / Hora</span>
                <p className="text-base font-black text-slate-800 mt-0.5">R$ {activeStats.earningsPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h</p>
                <p className="text-[10px] text-emerald-700 font-bold">R$ {activeStats.netEarningsPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} líq/h</p>
              </div>
            </div>
          </div>

          {/* DRE (DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO) REPORT - MELHORIA 2 */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-sans text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[9px] uppercase font-mono font-black text-blue-400 tracking-wider block">Demonstrativo Contábil de Caixa</span>
                <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight">DRE Mensal de Desempenho Operacional</h4>
              </div>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-mono font-bold uppercase">Regime de Caixa</span>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-mono">
              {/* 1. Receita Bruta */}
              <div className="flex justify-between font-bold border-b border-slate-800/60 pb-1.5 text-white">
                <span>(A) RECEITA BRUTA OPERACIONAL (GANHOS)</span>
                <span>R$ {activeStats.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pl-4 space-y-1 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>- Ganhos do Aplicativo Uber</span>
                  <span>R$ {activeStats.uber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Ganhos do Aplicativo 99</span>
                  <span>R$ {activeStats.m99.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Ganhos do Aplicativo InDrive</span>
                  <span>R$ {activeStats.indrive.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Corredores / Jornadas Particulares</span>
                  <span>R$ {activeStats.priv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {activeStats.other > 0 && (
                  <div className="flex justify-between">
                    <span>- Dicas / Outras Fontes de Renda</span>
                    <span>R$ {activeStats.other.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* 2. Custos Variáveis */}
              <div className="flex justify-between font-semibold border-b border-slate-800/60 pb-1.5 pt-2 text-red-400">
                <span>(B) (-) CUSTOS OPERACIONAIS DIRETOS (VARIÁVEIS)</span>
                <span>- R$ {(activeStats.fuel + activeStats.food + activeStats.tagClean).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pl-4 space-y-1 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>- Combustível (GNV/Líquidos)</span>
                  <span>R$ {activeStats.fuel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Alimentação diária na rua</span>
                  <span>R$ {activeStats.food.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Lavagem, Higienização rápida e Pedágio</span>
                  <span>R$ {activeStats.tagClean.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* 3. Margem de Contribuição */}
              {(() => {
                const contributionMargin = activeStats.gross - (activeStats.fuel + activeStats.food + activeStats.tagClean);
                const cmPercent = activeStats.gross > 0 ? (contributionMargin / activeStats.gross) * 100 : 0;
                return (
                  <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800/80 space-y-1 my-1">
                    <div className="flex justify-between font-black text-emerald-400 text-[12px]">
                      <span>(C = A - B) MARGEM DE CONTRIBUIÇÃO</span>
                      <span>R$ {contributionMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-emerald-500/90 font-sans font-bold">
                      <span>Eficiência Direta Operacional</span>
                      <span>{cmPercent.toFixed(1)}% do faturamento convertido em margem</span>
                    </div>
                  </div>
                );
              })()}

              {/* 4. Custos Administrativos e Extra/Fixo */}
              <div className="flex justify-between font-semibold border-b border-slate-800/60 pb-1.5 pt-1 text-purple-400">
                <span>(D) (-) DESPESAS FIXAS & ADMINISTRATIVAS EXTRAS</span>
                <span>- R$ {activeStats.extraCostsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pl-4 space-y-1 text-slate-400 text-[11px]">
                {selectedMonthExpenseData.filter(item => 
                  item.name !== 'Combustível (GNV/L)' && 
                  item.name !== 'Lanches/Alimentação' && 
                  item.name !== 'Tag / Lava-jato'
                ).map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>- {item.name}</span>
                    <span>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                {activeStats.extraCostsTotal === 0 && (
                  <div className="text-slate-500 italic text-[10px]">Sem despesas fixas ou extras independentes inseridas neste mês.</div>
                )}
              </div>

              {/* 5. Lucro Líquido Real */}
              <div className="flex justify-between font-black border-t border-b border-blue-900 py-2.5 pt-3 text-blue-400 text-[13px]">
                <span>(E = C - D) RESULTADO LÍQUIDO DO PERÍODO (LUCRO)</span>
                <span>R$ {activeStats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pl-4 text-[10px] text-blue-450 italic font-sans flex justify-between font-bold">
                <span>Margem Líquida Real Consolidada (Final)</span>
                <span>{netProfitPercentage.toFixed(1)}% líquido das corridas</span>
              </div>
            </div>

            {/* DYNAMIC DIAGNOSTIC ENGINE */}
            <div className="p-4 bg-slate-850 rounded-xl text-[11px] text-slate-400 leading-relaxed border border-slate-800 mt-2 space-y-2">
              <p className="font-extrabold text-white flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Insights & Recomendações Contábeis do Mês
              </p>
              {activeStats.gross > 0 ? (
                <div className="space-y-1">
                  <p>
                    Sua operação consumiu <strong>{(((activeStats.fuel + activeStats.food + activeStats.tagClean) / activeStats.gross) * 100).toFixed(0)}%</strong> de combustível e alimentação de tudo o que faturou nas ruas. Foram percorridos <strong>{activeStats.totalKm.toLocaleString('pt-BR')} km</strong> nesta janela com rodagem média de <strong>R$ {activeStats.earningsPerKm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/km</strong>.
                  </p>
                  {activeStats.fuel > 0 && (
                    <p className="text-slate-300">
                      ⛽ Como seu veículo está registrado com combustível tipo <strong>{vehicle.fuelType}</strong>, seu custo de combustível estimado por quilômetro rodado neste período é de <strong>R$ {(activeStats.fuel / (activeStats.totalKm || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/km</strong>. {vehicle.fuelType === 'GNV' ? (
                        <span>Esse custo está dentro de uma faixa de eficiência ideal para motoristas com kit GNV.</span>
                      ) : (
                        <span>Como você roda com veículo {vehicle.fuelType}, despesas por km acima de R$ 0,45 indicam que vale a pena abastecer em postos com aplicativo de desconto ou planejar no futuro uma conversão para GNV para elevar a margem de contribuição.</span>
                      )}
                    </p>
                  )}
                  {netProfitPercentage < 40 && (
                    <p className="text-yellow-400 font-bold">
                      ⚠ Alerta de Margem: Sua margem líquida final está abaixo de 40%. Revise gastos com locação de veículos, financiamentos pesados ou alimentação na rua para garantir a saúde do caixa.
                    </p>
                  )}
                  {netProfitPercentage >= 40 && (
                    <p className="text-emerald-400 font-bold">
                      ✔ Margem Saudável: Parabéns! Sua conversão líquida está acima de {netProfitPercentage.toFixed(0)}%, mostrando excelente economia de combustível e controle rígido das despesas corporativas diárias.
                    </p>
                  )}
                </div>
              ) : (
                <p>Favor registrar corridas e turnos ativos no mês correspondente para alimentar os comparativos de faturamento real de km rodado e combustível.</p>
              )}
            </div>
          </div>

          {/* DYNAMIC LISTS: EXTRA DEBITS IN THIS MONTH */}
          {activeStats.extras.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                  <FileText className="w-4 h-4 text-slate-500" /> Detalhamento de Despesas Extras do Mês ({activeStats.extras.length})
                </span>
                <span className="text-xs font-black text-red-600 font-mono">Total Extra: R$ {activeStats.extraCostsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 text-[10px] uppercase">
                      <th className="py-2.5 px-4">Data</th>
                      <th className="py-2.5 px-4">Categoria</th>
                      <th className="py-2.5 px-4">Descrição de Item</th>
                      <th className="py-2.5 px-4 text-right">Preço de Lançamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {activeStats.extras.map(e => (
                      <tr key={e.id}>
                        <td className="py-2.5 px-4 font-mono font-bold text-[11px]">{new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[9px] uppercase">{e.category}</span>
                        </td>
                        <td className="py-2.5 px-4">{e.description}</td>
                        <td className="py-2.5 px-4 text-right text-red-650 font-bold font-mono">R$ {e.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
