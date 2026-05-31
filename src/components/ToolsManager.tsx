import React, { useState } from 'react';
import { 
  DollarSign, 
  Car, 
  MapPin, 
  Clock, 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown, 
  Award, 
  Sparkles, 
  Fuel, 
  Plus, 
  HelpCircle,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { Shift, Vehicle, DriverProfile } from '../types';

interface ToolsManagerProps {
  shifts: Shift[];
  vehicle: Vehicle;
  profile: DriverProfile;
}

export default function ToolsManager({ shifts, vehicle, profile }: ToolsManagerProps) {
  const [activeToolTab, setActiveToolTab] = useState<'simulator' | 'ranking'>('simulator');

  // --- TRIP SIMULATOR STATE ---
  const [simDistance, setSimDistance] = useState<number>(180);
  const [simHours, setSimHours] = useState<number>(4);
  const [simPriceOffered, setSimPriceOffered] = useState<number>(380);
  const [simFuelPrice, setSimFuelPrice] = useState<number>(
    vehicle.fuelType === 'GNV' ? 4.39 : vehicle.fuelType === 'Etanol' ? 3.99 : 5.89
  );
  const [simTolls, setSimTolls] = useState<number>(30);
  const [simFood, setSimFood] = useState<number>(25);
  const [simOtherCosts, setSimOtherCosts] = useState<number>(0);

  // --- SIMULATION CALCULATIONS ---
  const simConsumption = vehicle.avgConsumption || 12;
  const simFuelUsed = simDistance / simConsumption;
  const simFuelCost = simFuelUsed * simFuelPrice;
  const simDepreciationCost = simDistance * (vehicle.depreciationPerKm || 0.22);
  const simTotalDirectCosts = simFuelCost + simTolls + simFood + simOtherCosts;
  const simTotalRealCosts = simTotalDirectCosts + simDepreciationCost;
  
  const simGrossProfit = simPriceOffered - simTotalDirectCosts;
  const simRealNetProfit = simPriceOffered - simTotalRealCosts;
  
  const simNetPerHour = simRealNetProfit / simHours;
  const simRatePerKm = simPriceOffered / simDistance;

  // VERDICT SELECTION
  let verdictTitle = '';
  let verdictDesc = '';
  let verdictColor = '';
  let verdictIcon = null;

  if (simNetPerHour >= 45) {
    verdictTitle = 'Altamente Lucrativa 🟢';
    verdictDesc = 'Viagem excelente! O valor compensa todos os custos mecânicos, combustível e paga uma taxa horária de alto padrão para motoristas de aplicativos.';
    verdictColor = 'bg-emerald-50 border-emerald-250 text-emerald-900';
    verdictIcon = <ThumbsUp className="w-8 h-8 text-emerald-600 shrink-0" />;
  } else if (simNetPerHour >= 22) {
    verdictTitle = 'Viabilidade Aceitável 🟡';
    verdictDesc = 'Viagem viável, porém o rendimento por hora está dentro da média padrão urbana. Certifique-se de que não há riscos de retenção de tráfego pesado.';
    verdictColor = 'bg-amber-50 border-amber-200 text-amber-900';
    verdictIcon = <Zap className="w-8 h-8 text-amber-600 shrink-0" />;
  } else {
    verdictTitle = 'Inviável / Prejuízo Oculto 🔴';
    verdictDesc = 'Desaconselhável! Após descontar o desgaste de pneus, suspensão (depreciação), combustível e as horas gastas, restará um lucro irrisório. Você pagará para rodar.';
    verdictColor = 'bg-red-50 border-red-200 text-red-900';
    verdictIcon = <ThumbsDown className="w-8 h-8 text-red-650 shrink-0" />;
  }


  // --- APP RANKING CALCULATIONS ---
  // Aggregate real shifts data
  const totalUber = shifts.reduce((sum, s) => sum + s.uberEarnings, 0);
  const total99 = shifts.reduce((sum, s) => sum + s.earnings99, 0);
  const totalInDrive = shifts.reduce((sum, s) => sum + s.indriveEarnings, 0);
  const totalPrivate = shifts.reduce((sum, s) => sum + s.privateEarnings, 0);
  const totalOther = shifts.reduce((sum, s) => sum + s.otherEarnings, 0);

  const totalGrossRevenue = totalUber + total99 + totalInDrive + totalPrivate + totalOther;
  const totalKmDriven = shifts.reduce((sum, s) => sum + s.totalKm, 0);
  const totalHoursWorked = shifts.reduce((sum, s) => sum + s.hoursWorked, 0);

  // Proportional estimations for efficiency rating
  const appMetrics = [
    {
      id: 'uber',
      name: 'Uber',
      earnings: totalUber,
      color: 'bg-black text-white hover:bg-slate-900',
      iconBg: 'bg-slate-900',
      percentage: totalGrossRevenue > 0 ? (totalUber / totalGrossRevenue) * 100 : 0,
      description: 'Plataforma líder em volume de chamadas e dinamismo de tarifas.'
    },
    {
      id: '99',
      name: '99App',
      earnings: total99,
      color: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
      iconBg: 'bg-amber-500',
      percentage: totalGrossRevenue > 0 ? (total99 / totalGrossRevenue) * 100 : 0,
      description: 'Excelente para campanhas de bônus por corridas efetuadas.'
    },
    {
      id: 'indrive',
      name: 'InDrive',
      earnings: totalInDrive,
      color: 'bg-emerald-600 text-white hover:bg-emerald-700',
      iconBg: 'bg-emerald-600',
      percentage: totalGrossRevenue > 0 ? (totalInDrive / totalGrossRevenue) * 100 : 0,
      description: 'Negociação direta com margem de combustível previsível.'
    },
    {
      id: 'private',
      name: 'Particular',
      earnings: totalPrivate,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
      iconBg: 'bg-blue-600',
      percentage: totalGrossRevenue > 0 ? (totalPrivate / totalGrossRevenue) * 100 : 0,
      description: 'Alto valor agregado por km rodado, livre de taxas.'
    }
  ];

  // Sort apps by faturamento to create the ranking list
  const rankedApps = [...appMetrics].sort((a,b) => b.earnings - a.earnings);

  return (
    <div className="space-y-6">
      
      {/* Tab Selectors */}
      <div className="no-print flex space-x-1.5 bg-slate-100 p-1 rounded-xl max-w-sm sm:max-w-md border border-slate-200">
        <button
          onClick={() => setActiveToolTab('simulator')}
          className={`flex-1 py-2 px-3 text-2xs sm:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeToolTab === 'simulator' ? 'bg-white text-slate-运行 shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Car className="w-4 h-4 text-blue-600" />
          <span>Simulador Viagens</span>
        </button>
        <button
          onClick={() => setActiveToolTab('ranking')}
          className={`flex-1 py-2 px-3 text-2xs sm:text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeToolTab === 'ranking' ? 'bg-white text-slate-运行 shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Ranking de Canais</span>
        </button>
      </div>

      {/* 1. TRIP & PRIVATE VIABILITY SIMULATOR */}
      {activeToolTab === 'simulator' && (
        <div className="space-y-6 animate-fade-in text-xs font-semibold text-slate-705">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center sm:items-start flex-col sm:flex-row gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Plus className="w-5 h-5 text-blue-600" /> Simulador de Viabilidade de Viagens & Particular
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  Calcule com precisão cirúrgica se uma viagem para outra cidade ou corrida particular compensa seus gastos diretos (combustível, pedágios) e o desgaste invisível de rodagem.
                </p>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> PRECISION V.1
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SLIDERS INPUTS */}
              <div className="lg:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="text-[10px] uppercase font-mono font-black text-slate-400 block border-b border-slate-200 pb-1.5">
                  Preencher Variáveis da Corrida
                </h4>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-slate-650 font-bold block mb-1">
                      Distância Total (Ida + Volta KM)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        min="5"
                        max="2000"
                        value={simDistance}
                        onChange={e => setSimDistance(Number(e.target.value))}
                        className="w-24 p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center font-black text-slate-800"
                      />
                      <input 
                        type="range"
                        min="10"
                        max="600"
                        step="5"
                        value={simDistance}
                        onChange={e => setSimDistance(Number(e.target.value))}
                        className="flex-1 cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-650 font-bold block mb-1">
                      Tempo Estimado do Serviço (Horas)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="48"
                        value={simHours}
                        onChange={e => setSimHours(Number(e.target.value))}
                        className="w-24 p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-center font-black text-slate-800"
                      />
                      <input 
                        type="range"
                        min="1"
                        max="15"
                        step="0.5"
                        value={simHours}
                        onChange={e => setSimHours(Number(e.target.value))}
                        className="flex-1 cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-650 font-bold block mb-1">
                      Valor Proposto Bruto (R$)
                    </label>
                    <input 
                      type="number"
                      value={simPriceOffered}
                      onChange={e => setSimPriceOffered(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black text-blue-600 text-sm font-mono focus:outline-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">Pedágios (R$)</label>
                      <input 
                        type="number"
                        value={simTolls}
                        onChange={e => setSimTolls(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">Alimentação (R$)</label>
                      <input 
                        type="number"
                        value={simFood}
                        onChange={e => setSimFood(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">Preço Combustível (L / m³)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={simFuelPrice}
                        onChange={e => setSimFuelPrice(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-indigo-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-black block mb-1">Consumo Cidade</label>
                      <input 
                        type="text"
                        disabled
                        value={`${simConsumption} km/${vehicle.fuelType === 'GNV' ? 'm³' : 'L'}`}
                        className="w-full p-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg font-mono text-center font-bold"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* OUTPUTS GRAPH AND CARDS */}
              <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                
                {/* VERDICT CARD */}
                <div className={`p-4.5 rounded-2xl border flex items-start gap-3.5 shadow-2xs leading-relaxed ${verdictColor}`}>
                  {verdictIcon}
                  <div>
                    <h4 className="font-black uppercase text-xs tracking-tight">{verdictTitle}</h4>
                    <p className="mt-1 text-[11px] font-medium leading-relaxed">{verdictDesc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-55 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 block font-bold">Custo Combustível</span>
                    <p className="text-sm font-bold text-slate-800 font-mono mt-1">R$ {simFuelCost.toFixed(2)}</p>
                    <span className="text-[8px] text-slate-400 font-medium">({simFuelUsed.toFixed(1)} {vehicle.fuelType === 'GNV' ? 'm³' : 'L'})</span>
                  </div>

                  <div className="bg-slate-55 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 block font-bold">Pedágios & Aliment.</span>
                    <p className="text-sm font-bold text-slate-800 font-mono mt-1">R$ {(simTolls + simFood).toFixed(2)}</p>
                    <span className="text-[8px] text-slate-400 font-medium">(Despesas Diretas)</span>
                  </div>

                  <div className="bg-slate-55 p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-amber-700 block font-bold">Desgaste Mecânico</span>
                    <p className="text-sm font-bold text-amber-800 font-mono mt-1">R$ {simDepreciationCost.toFixed(2)}</p>
                    <span className="text-[8px] text-amber-650 font-bold">(Invisível por KM)</span>
                  </div>

                  <div className="bg-slate-55 p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-xl">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-blue-700 block font-bold">Rendimento Hora</span>
                    <p className="text-sm font-black text-blue-700 font-mono mt-1">R$ {simNetPerHour.toFixed(2)} /h</p>
                    <span className="text-[8px] text-blue-600 font-black">({simHours} Horas Totais)</span>
                  </div>
                </div>

                {/* COMPARATIVE PROGRESS GRAPH */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-4">
                  <span className="text-[10px] uppercase font-mono font-black text-slate-400 block border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-500" /> Divisão Analítica da Receita Prevista
                  </span>

                  <div className="space-y-3 font-mono text-[10px]">
                    {/* Fuel share */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-600">
                        <span>Combustível Gasto</span>
                        <span>{((simFuelCost / simPriceOffered) * 100 || 0).toFixed(1)}% • R$ {simFuelCost.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${Math.min(100, (simFuelCost / simPriceOffered) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Toll and food share */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-650">
                        <span>Gastos Auxiliares (Almoço, Pedágios)</span>
                        <span>{(((simTolls + simFood) / simPriceOffered) * 100 || 0).toFixed(1)}% • R$ {(simTolls + simFood).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, ((simTolls + simFood) / simPriceOffered) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Depreciation share */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-bold text-amber-700">
                        <span>Depreciação Invisível (Desgaste Mecânico)</span>
                        <span>{((simDepreciationCost / simPriceOffered) * 100 || 0).toFixed(1)}% • R$ {simDepreciationCost.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (simDepreciationCost / simPriceOffered) * 100)}%` }} />
                      </div>
                    </div>

                    {/* Net real return */}
                    <div className="space-y-1 border-t border-slate-200 pt-2.5">
                      <div className="flex justify-between font-black text-emerald-700">
                        <span>Sobra Líquida / Lucro Real Final</span>
                        <span>{((simRealNetProfit / simPriceOffered) * 100 || 0).toFixed(0)}% • R$ {simRealNetProfit.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-350">
                        <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(0, Math.min(100, (simRealNetProfit / simPriceOffered) * 100))}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* 2. CHANNELS / APP EFFICIENCY RANKING */}
      {activeToolTab === 'ranking' && (
        <div className="space-y-6 animate-fade-in text-xs font-semibold text-slate-705">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-500" /> Ranking Comparativo de Eficiência por Aplicativo
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                O GMC cruza os faturamentos brutos acumulados em seus turnos de trabalho ativos para identificar de forma inteligente qual canal ou aplicativo gera o maior volume em seu caixa.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              
              {/* RANKED LIST ROW */}
              <div className="lg:col-span-2 space-y-3.5">
                <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
                  Pódio de Aproveitamento Comercial
                </span>

                <div className="space-y-3">
                  {rankedApps.map((app, index) => {
                    let badge = '';
                    let badgeColor = '';
                    if (index === 0) {
                      badge = '🥇 1º Lugar (Líder)';
                      badgeColor = 'bg-yellow-50 text-yellow-800 border-yellow-250';
                    } else if (index === 1) {
                      badge = '🥈 2º Lugar';
                      badgeColor = 'bg-slate-100 text-slate-750 border-slate-250';
                    } else if (index === 2) {
                      badge = '🥉 3º Lugar';
                      badgeColor = 'bg-orange-50 text-orange-900 border-orange-200';
                    } else {
                      badge = '🎗️ Menor Volume';
                      badgeColor = 'bg-slate-50 text-slate-450 border-slate-100';
                    }

                    return (
                      <div key={app.id} className="p-4 bg-slate-50/40 border border-slate-200 rounded-xl hover:bg-slate-50 transition duration-205 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl text-white ${app.id === 'uber' ? 'bg-slate-950 font-black' : app.id === '99' ? 'bg-amber-500 font-extrabold text-slate-900' : 'bg-blue-650'} flex items-center justify-center text-xs tracking-tighter uppercase font-black shrink-0`}>
                            {app.name.substring(0, 2)}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-slate-900 leading-tight">{app.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">{app.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 font-mono">
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {badge}
                          </span>
                          <span className="text-xs font-black text-slate-800 text-right">
                            R$ {app.earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <span className="text-[9px] text-slate-400 font-normal block">({app.percentage.toFixed(1)}% do caixa)</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SIDEBAR KPI ANALYTICS AND RECOMMENDATION */}
              <div className="lg:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4">
                
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-mono font-black text-slate-400 block border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-500" /> Estatísticas Coletadas do Diário
                  </h4>

                  <div className="space-y-3 font-mono text-[10px] text-slate-500">
                    <div className="flex justify-between border-b border-slate-200/55 pb-1">
                      <span>Total Faturamento Bruto:</span>
                      <span className="text-slate-800 font-bold">R$ {totalGrossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/55 pb-1">
                      <span>Horas de Trabalho Registradas:</span>
                      <span className="text-slate-800 font-bold">{totalHoursWorked.toFixed(1)} Horas</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/55 pb-1">
                      <span>Faturamento Médio / Hora:</span>
                      <span className="text-slate-800 font-bold">R$ {totalHoursWorked > 0 ? (totalGrossRevenue / totalHoursWorked).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '0,00'} /h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eficiência Média / KM:</span>
                      <span className="text-blue-650 font-black">R$ {totalKmDriven > 0 ? (totalGrossRevenue / totalKmDriven).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '0,00'} /km</span>
                    </div>
                  </div>
                </div>

                {/* ADVISORY CARD */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-[11px] leading-relaxed">
                  <h5 className="font-extrabold text-amber-900 flex items-center gap-1 uppercase text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Recomendação de Otimização
                  </h5>
                  {totalGrossRevenue <= 0 ? (
                    <p className="text-amber-850 font-medium">
                      Comece a preencher seus primeiros turnos diários no diário de trabalho. O GMC cruzará os ganhos para traçar dinâmicas de maior eficiência horária neste painel!
                    </p>
                  ) : totalUber > total99 ? (
                    <p className="text-amber-850 font-medium">
                      O faturamento da <strong>Uber</strong> representa a maior fatia do seu caixa. No entanto, lembre-se de monitorar as taxas ocultas de intermediação para garantir que o seu carro obtenha rendimentos acima de R$ 2,00 por KM em vias densas da cidade.
                    </p>
                  ) : (
                    <p className="text-amber-850 font-medium">
                      Seus maiores ganhos estão direcionados à **99App**. Aproveite as campanhas semanais de quantidade para diluir despesas fixas (como seguro APP e aluguel), o que maximizará sua sobra líquida no final do mês!
                    </p>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
