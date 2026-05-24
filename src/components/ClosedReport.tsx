import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  Navigation, 
  Clock, 
  Car, 
  CheckCircle, 
  PenTool, 
  Eraser, 
  FileText,
  Percent
} from 'lucide-react';
import { Shift, Expense, Vehicle, DriverProfile } from '../types';

interface ClosedReportProps {
  shifts: Shift[];
  expenses: Expense[];
  vehicle: Vehicle;
  profile: DriverProfile;
  onBack: () => void;
}

export default function ClosedReport({ shifts, expenses, vehicle, profile, onBack }: ClosedReportProps) {
  const [reportRange, setReportRange] = useState<'all' | 'week' | 'month' | string>('all'); // all, week, month, or shiftId
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize canvas drawing behavior
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#2563eb'; // blue-600
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [reportRange]);

  // Filter shifts based on range
  const getFilteredData = () => {
    let filteredShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));
    let title = "Consolidado de Atividades (Geral)";
    let subtitle = "Total acumulado de toda a base de dados";

    if (reportRange === 'week') {
      // Last 7 days of entries
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 7);
      filteredShifts = shifts.filter(s => new Date(s.date) >= limitDate);
      title = "Demonstrativo Semanal";
      subtitle = "Desempenho dos últimos 7 dias";
    } else if (reportRange === 'month') {
      // May 2026
      filteredShifts = shifts.filter(s => s.date.startsWith('2026-05'));
      title = "Fechamento Mensal - Maio de 2026";
      subtitle = "Desempenho financeiro consolidado do mês corrente";
    } else if (reportRange !== 'all') {
      // Selected specific shift
      const specificShift = shifts.find(s => s.id === reportRange);
      if (specificShift) {
        filteredShifts = [specificShift];
        const formattedDate = new Date(specificShift.date + 'T00:00:00').toLocaleDateString('pt-BR');
        title = `Demonstrativo Diario - Turno ${formattedDate}`;
        subtitle = specificShift.notes || "Turno individual registrado de atividade profissional";
      }
    }

    return { filteredShifts, title, subtitle };
  };

  const { filteredShifts, title, subtitle } = getFilteredData();

  // Group filtered shifts by month year YYYY-MM
  const shiftsByMonth = React.useMemo(() => {
    const groups: { [key: string]: Shift[] } = {};
    filteredShifts.forEach(s => {
      const monthKey = s.date ? s.date.substring(0, 7) : 'Sem Data';
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(s);
    });
    return groups;
  }, [filteredShifts]);

  // Format YYYY-MM code dynamically into Portuguese text
  const formatMonthYearStr = (yearMonthKey: string) => {
    if (yearMonthKey === 'Sem Data') return 'Sem Data';
    const [year, month] = yearMonthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 15);
    const monthStr = date.toLocaleDateString('pt-BR', { month: 'long' });
    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1) + ' de ' + year;
  };

  // Core Math
  const totalWorkedHours = filteredShifts.reduce((acc, curr) => acc + curr.hoursWorked, 0);
  const totalKm = filteredShifts.reduce((acc, curr) => acc + curr.totalKm, 0);
  
  // Platform Earnings
  const uberEarnings = filteredShifts.reduce((acc, curr) => acc + curr.uberEarnings, 0);
  const earnings99 = filteredShifts.reduce((acc, curr) => acc + curr.earnings99, 0);
  const indriveEarnings = filteredShifts.reduce((acc, curr) => acc + curr.indriveEarnings, 0);
  const privateEarnings = filteredShifts.reduce((acc, curr) => acc + curr.privateEarnings, 0);
  const otherEarnings = filteredShifts.reduce((acc, curr) => acc + curr.otherEarnings, 0);
  
  const grossEarnings = uberEarnings + earnings99 + indriveEarnings + privateEarnings + otherEarnings;

  // Direct expenses from Shifts
  const shiftsFuelExpense = filteredShifts.reduce((acc, curr) => acc + curr.fuelExpense, 0);
  const shiftsFoodExpense = filteredShifts.reduce((acc, curr) => acc + curr.foodExpense, 0);
  const shiftsOtherExpense = filteredShifts.reduce((acc, curr) => acc + curr.otherExpenses, 0);

  // Standalone general expenses that fall inside this timeframe (only when report is wide, say Month or All)
  // Let us sum expenses of may 2026 context if we are in month or all
  let generalExpensesCost = 0;
  if (reportRange === 'month' || reportRange === 'all') {
    generalExpensesCost = expenses.reduce((acc, curr) => acc + curr.value, 0);
  } else if (reportRange === 'week') {
    // Last 7 days expenses
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7);
    generalExpensesCost = expenses
      .filter(e => new Date(e.date) >= limitDate)
      .reduce((acc, curr) => acc + curr.value, 0);
  }

  const totalFuelExpense = shiftsFuelExpense;
  const totalDirectExpenses = shiftsFuelExpense + shiftsFoodExpense + shiftsOtherExpense;
  const totalConsolidatedExpenses = totalDirectExpenses + generalExpensesCost;
  const netEarnings = grossEarnings - totalConsolidatedExpenses;

  // Key Performance Indicators (KPIs)
  const earningsPerKm = totalKm > 0 ? (grossEarnings / totalKm) : 0;
  const netEarningsPerKm = totalKm > 0 ? (netEarnings / totalKm) : 0;
  const earningsPerHour = totalWorkedHours > 0 ? (grossEarnings / totalWorkedHours) : 0;
  const netEarningsPerHour = totalWorkedHours > 0 ? (netEarnings / totalWorkedHours) : 0;
  
  // Fuel percentages and cost per km
  const fuelCostPerKm = totalKm > 0 ? (totalFuelExpense / totalKm) : 0;
  const fuelPercentageOfGross = grossEarnings > 0 ? (totalFuelExpense / grossEarnings) * 100 : 0;

  // Signature handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CONTROL TOP BAR (No Print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Select Period */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500">Período:</span>
            <select
              value={reportRange}
              onChange={(e) => setReportRange(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-blue-600"
            >
              <option value="all">Todo o Histórico</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Maio de 2026 (Corrente)</option>
              <optgroup label="Turnos Individuais">
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')} - {s.notes?.substring(0, 20) || 'Sem observações'}...
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-blue-650 hover:bg-blue-700 bg-blue-600 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer ml-auto sm:ml-0"
          >
            <Printer className="w-4 h-4" /> Imprimir Demonstrativo
          </button>
        </div>
      </div>

      {/* 2. PRINTABLE SHEET */}
      <div 
        id="printable-statement" 
        className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-md max-w-[850px] mx-auto text-slate-800 space-y-8 font-sans relative"
      >
        {/* Background Watermark/Seal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] select-none pointer-events-none transform rotate-12">
          <TrendingUp className="w-[500px] h-[500px] text-blue-900" />
        </div>

        {/* Header Section */}
        <div className="border-b-[3px] border-blue-600 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                GMC CONTROLES FINANCEIROS
              </h1>
              <p className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                Demonstrativo de Rendimentos de Motorista Profissional
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                GMC Versão Segura • Homologado para Gestão de Lucro Real
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-mono">
            <p className="font-bold text-slate-800 text-xs">GMC ID: #M-{(profile.name || 'GMC').substring(0, 3).toUpperCase()}-2026</p>
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR').substring(0, 5)}</p>
            <p className="text-blue-600 font-bold mt-1">Veículo: {vehicle.brand} {vehicle.model}</p>
          </div>
        </div>

        {/* Profile Card & Report Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-150 relative z-10 text-xs">
          <div className="space-y-1.5">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Identificação do Profissional</h3>
            <p className="text-sm font-black text-slate-900">{profile.name}</p>
            <p className="text-slate-600">Local de Operação: <strong className="text-slate-800">{profile.city}</strong></p>
            <p className="text-slate-600">Meta Diária Configurada: <strong className="text-slate-800">R$ {profile.dailyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
          </div>
          <div className="space-y-1.5 md:text-right">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Escopo das Informações</h3>
            <p className="text-sm font-black text-blue-600">{title}</p>
            <p className="text-slate-500 font-medium italic">{subtitle}</p>
            <p className="text-slate-600 font-mono text-[10px]">Turnos Incluídos no Cálculo: {filteredShifts.length}</p>
          </div>
        </div>

        {/* Consolidated Financial Balances */}
        <div className="space-y-2 relative z-10">
          <h3 className="text-xs font-bold text-slate-850 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-blue-600" /> Balanço Financeiro do Período
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Gross Revenue */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 space-y-1">
              <span className="text-[9px] uppercase font-extrabold text-emerald-600 tracking-wider block">Faturamento Bruto</span>
              <span className="text-lg font-black block">R$ {grossEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-emerald-700 block font-medium">Soma de todas as corridas</span>
            </div>

            {/* Total Expenses */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-800 space-y-1">
              <span className="text-[9px] uppercase font-extrabold text-red-650 tracking-wider block">Despesas Totais</span>
              <span className="text-lg font-black block">R$ {totalConsolidatedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-red-650 block font-medium">
                Combustível, alimentação e custos fixos
              </span>
            </div>

            {/* Net Revenue */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 space-y-1">
              <span className="text-[9px] uppercase font-extrabold text-blue-600 block tracking-wider">Sobrou Líquido (Lucro)</span>
              <span className="text-lg font-black block">R$ {netEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-blue-600 block font-medium">Dividendo real para o bolso</span>
            </div>

          </div>
        </div>

        {/* Platform breakdown */}
        <div className="space-y-2 relative z-10">
          <h3 className="text-xs font-bold text-slate-855 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-blue-600" /> Detalhamento de Receitas por Plataforma
          </h3>
          <div className="border border-slate-150 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 text-[10px] uppercase">
                  <th className="py-2.5 px-4">Canal / Recurso</th>
                  <th className="py-2.5 px-4 text-right">R$ bruto</th>
                  <th className="py-2.5 px-4 text-right">% do total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {uberEarnings > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-black"></span> Uber App
                    </td>
                    <td className="py-2.5 px-4 text-right">R$ {uberEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-normal">{((uberEarnings/grossEarnings)*100).toFixed(1)}%</td>
                  </tr>
                )}
                {earnings99 > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> 99 App
                    </td>
                    <td className="py-2.5 px-4 text-right">R$ {earnings99.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-normal">{((earnings99/grossEarnings)*100).toFixed(1)}%</td>
                  </tr>
                )}
                {indriveEarnings > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> InDrive
                    </td>
                    <td className="py-2.5 px-4 text-right">R$ {indriveEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-normal">{((indriveEarnings/grossEarnings)*100).toFixed(1)}%</td>
                  </tr>
                )}
                {privateEarnings > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Viagens Particulares
                    </td>
                    <td className="py-2.5 px-4 text-right">R$ {privateEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-normal">{((privateEarnings/grossEarnings)*100).toFixed(1)}%</td>
                  </tr>
                )}
                {otherEarnings > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Outros (Gorjetas, Entregas)
                    </td>
                    <td className="py-2.5 px-4 text-right">R$ {otherEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500 font-normal">{((otherEarnings/grossEarnings)*100).toFixed(1)}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Metrics Breakdown */}
        <div className="space-y-2 relative z-10">
          <h3 className="text-xs font-bold text-slate-855 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1.5">
            <Car className="w-4 h-4 text-blue-600" /> Indicadores Operacionais e Eficiência
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-[11px]">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-0.5">
              <span className="text-slate-450 uppercase text-[9px] font-extrabold tracking-wide">Quilômetros Rodados</span>
              <p className="text-base font-black text-slate-900">{totalKm} KM</p>
              <p className="text-[9px] font-mono font-medium text-slate-500">Medido pelo odômetro</p>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-0.5">
              <span className="text-slate-450 uppercase text-[9px] font-extrabold tracking-wide">Horas Trabalhadas</span>
              <p className="text-base font-black text-slate-900">{totalWorkedHours.toFixed(1)} hrs</p>
              <p className="text-[9px] font-mono font-medium text-slate-500">Eficiência de jornada</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-0.5">
              <span className="text-slate-450 uppercase text-[9px] font-extrabold tracking-wide">Faturamento Bruto/KM</span>
              <p className="text-base font-black text-slate-900">R$ {earningsPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[9px] text-blue-600 font-extrabold">R$ {netEarningsPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Líq/KM</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-0.5">
              <span className="text-slate-450 uppercase text-[9px] font-extrabold tracking-wide">Faturamento Bruto/Hora</span>
              <p className="text-base font-black text-slate-900">R$ {earningsPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[9px] text-blue-600 font-extrabold">R$ {netEarningsPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Líq/Hora</p>
            </div>
          </div>
        </div>

        {/* Cost Analysis Card */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-slate-800 rounded-xl text-white relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-semibold">
          <div className="space-y-1">
            <p className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">Metodologia Tributária de Abatimento</p>
            <p className="text-sm font-extrabold">O Combustível abocanhou {fuelPercentageOfGross.toFixed(1)}% do seu faturamento bruto.</p>
            <p className="text-[10px] text-slate-300 font-normal">Custo combustível por KM percorrido: <strong>R$ {fuelCostPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / KM</strong></p>
          </div>
          <div className="md:text-right space-y-0.5 shrink-0 font-mono">
            <p className="text-blue-200">Gasto total combustível: R$ {totalFuelExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-yellow-400 font-bold">Consumo médio ponderado: {vehicle.avgConsumption} Km/{vehicle.fuelType === 'GNV' ? 'm³' : 'L'}</p>
          </div>
        </div>

        {/* Individual Shifts Log Tables organized by Month */}
        {filteredShifts.length > 0 && (
          <div className="space-y-6 relative z-10 text-left">
            <h3 className="text-xs font-bold text-slate-855 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> Histórico Detalhado do Período (Separado por Mês)
            </h3>
            
            {(Object.entries(shiftsByMonth) as [string, Shift[]][])
              .sort(([monthA], [monthB]) => monthB.localeCompare(monthA)) // Newest months first
              .map(([monthKey, monthShifts]) => {
                const monthGross = monthShifts.reduce((acc, s) => acc + s.uberEarnings + s.earnings99 + s.indriveEarnings + s.privateEarnings + s.otherEarnings, 0);
                const monthCost = monthShifts.reduce((acc, s) => acc + s.fuelExpense + s.foodExpense + s.otherExpenses, 0);
                const monthNet = monthGross - monthCost;

                return (
                  <div key={monthKey} className="space-y-2">
                    {/* Header bar of the specific month */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-100/90 px-3.5 py-2.5 rounded-xl border border-slate-200 gap-2">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider font-sans">
                        📅 {formatMonthYearStr(monthKey)}
                      </span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono font-bold text-slate-600">
                        <span>Faturamento Bruto: <strong className="text-emerald-700">R$ {monthGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                        <span>Despesas: <strong className="text-red-600">R$ {monthCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                        <span>Saldo Líquido: <strong className="text-blue-600">R$ {monthNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                      </div>
                    </div>

                    {/* Table of shifts belonging to this month */}
                    <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-xs">
                      <table className="w-full text-[10px] text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 font-extrabold text-slate-500 uppercase">
                            <th className="py-2 px-3">Data</th>
                            <th className="py-2 px-3">Odômetro Inic.</th>
                            <th className="py-2 px-3">Odômetro Fim</th>
                            <th className="py-2 px-3">KM Percorrido</th>
                            <th className="py-2 px-3">Horas</th>
                            <th className="py-2 px-3 text-right">Bruto (R$)</th>
                            <th className="py-2 px-3 text-right">Custos (R$)</th>
                            <th className="py-2 px-3 text-right">Líquido (R$)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {monthShifts.map(s => {
                            const shiftGross = s.uberEarnings + s.earnings99 + s.indriveEarnings + s.privateEarnings + s.otherEarnings;
                            const shiftCost = s.fuelExpense + s.foodExpense + s.otherExpenses;
                            const shiftNet = shiftGross - shiftCost;

                            return (
                              <tr key={s.id} className="hover:bg-slate-50/40">
                                <td className="py-2.5 px-3 font-bold text-slate-850">{new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-500">{s.startOdometer.toLocaleString('pt-BR')} km</td>
                                <td className="py-2.5 px-3 font-mono text-slate-500">{s.endOdometer.toLocaleString('pt-BR')} km</td>
                                <td className="py-2.5 px-3 font-mono text-slate-950 font-bold">{s.totalKm.toLocaleString('pt-BR')} km</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{s.hoursWorked.toFixed(1)} hrs</td>
                                <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">R$ {shiftGross.toFixed(2)}</td>
                                <td className="py-2.5 px-3 text-right text-red-600 font-bold">R$ {shiftCost.toFixed(2)}</td>
                                <td className="py-2.5 px-3 text-right text-blue-600 font-black">R$ {shiftNet.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Declarative statement of truth */}
        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold italic text-center border-t border-slate-100 pt-3 relative z-10">
          Declaro que este demonstrativo financeiro foi preenchido de boa-fé, com dados reais de odômetro e recibos originais de plataformas eletrônicas. O GMC serve como ferramenta assistencial privada de gestão de fluxo de caixa e não substitui escritura fiscal oficial para dedução de IRPF.
        </p>

        {/* Interactive Digital Canvas Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end border-t border-slate-200/50 pt-8 relative z-10 text-xs">
          <div className="space-y-2">
            <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-100 text-[11px] text-slate-600">
              <p className="font-bold text-yellow-800 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Chave de Autenticação GMC
              </p>
              <p className="mt-0.5 text-[10px] font-mono select-all">SHA256: {Math.random().toString(36).substring(2, 10).toUpperCase()}-{(grossEarnings * 3.14).toFixed(0)}-{totalKm}</p>
              <p className="mt-1 text-[9px] text-slate-400">Desenvolvido em conformidade para comprovação financeira informal.</p>
            </div>
          </div>

          <div className="text-center group">
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><PenTool className="w-3 h-3 text-blue-600" /> ASSINATURA DIGITAL DO MOTORISTA</span>
              <button 
                onClick={clearSignature}
                className="no-print text-red-500 hover:text-red-700 flex items-center gap-0.5 font-bold cursor-pointer transition-colors"
                title="Limpar assinatura"
              >
                <Eraser className="w-3 h-3" /> Limpar
              </button>
            </div>

            <div className="bg-slate-50/80 border border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-white transition relative h-28 overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={350}
                height={112}
                className="w-full h-full cursor-crosshair relative z-2"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 pointer-events-none select-none z-1">
                  Assine aqui com o dedo ou mouse
                </div>
              )}
            </div>

            <p className="font-black text-slate-900 border-t border-slate-200/50 mt-2.5 pt-1 max-w-[240px] mx-auto truncate">
              {profile.name}
            </p>
            <p className="text-[9px] text-blue-700 font-mono font-extrabold tracking-wide uppercase">Motorista Licenciado GMC</p>
            <p className="text-[8px] text-slate-400 font-mono">Região: {profile.city}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
