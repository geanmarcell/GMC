import React, { useState } from 'react';
import { 
  Target, 
  User, 
  HelpCircle, 
  Calculator, 
  TrendingUp, 
  Sliders, 
  DollarSign, 
  Building, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { DriverProfile, Vehicle } from '../types';

interface GoalsManagerProps {
  profile: DriverProfile;
  vehicle: Vehicle;
  onUpdateProfile: (p: DriverProfile) => void;
}

export default function GoalsManager({ profile, vehicle, onUpdateProfile }: GoalsManagerProps) {
  // Profile settings state
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [monthlyGoal, setMonthlyGoal] = useState(profile.monthlyGoal);
  const [workingDays, setWorkingDays] = useState(profile.workingDaysPerWeek);

  // Simulation State
  const [simHoursPerDay, setSimHoursPerDay] = useState(8);
  const [simDaysPerWeek, setSimDaysPerWeek] = useState(5);
  const [simEarningPerHour, setSimEarningPerHour] = useState(40); // R$/hora médio
  
  const [simDailyKm, setSimDailyKm] = useState(180);
  const [simFuelPrice, setSimFuelPrice] = useState(4.50); // R$ por litro ou m³
  const [simWeeklyFixedCost, setSimWeeklyFixedCost] = useState(450); // ex: Aluguel de carro (R$ 450/semana)
  const [simMonthlyCellPlan, setSimMonthlyCellPlan] = useState(75);

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      city,
      dailyGoal: Number(dailyGoal),
      monthlyGoal: Number(monthlyGoal),
      workingDaysPerWeek: Number(workingDays)
    });
    alert("Metas e Perfil atualizados com sucesso!");
  };

  // Simulation Calculations (4.33 weeks per month)
  const weeksPerMonth = 4.33;
  const totalWorkedDaysPerMonth = simDaysPerWeek * weeksPerMonth;
  const totalWorkedHoursPerMonth = simHoursPerDay * simDaysPerWeek * weeksPerMonth;
  const projectedGrossMonthlyEarnings = totalWorkedHoursPerMonth * simEarningPerHour;

  const totalMonthlyKm = simDailyKm * totalWorkedDaysPerMonth;
  // fuel needed = total km / average consumption
  const fuelNeededLiters = totalMonthlyKm / vehicle.avgConsumption;
  const projectedMonthlyFuelExpense = fuelNeededLiters * simFuelPrice;

  const projectedWeeklyRentalExpense = simWeeklyFixedCost * weeksPerMonth;
  const totalProjectedMonthlyExpenses = projectedMonthlyFuelExpense + projectedWeeklyRentalExpense + simMonthlyCellPlan;

  const projectedNetMonthlyEarnings = projectedGrossMonthlyEarnings - totalProjectedMonthlyExpenses;
  const projectedNetPerHour = totalWorkedHoursPerMonth > 0 ? (projectedNetMonthlyEarnings / totalWorkedHoursPerMonth) : 0;
  const projectedNetPerKm = totalMonthlyKm > 0 ? (projectedNetMonthlyEarnings / totalMonthlyKm) : 0;

  return (
    <div className="space-y-6">
      
      {/* 2 PANELS: METAS AND REGULAR CONFIG / SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PROFILE SETTINGS & GOALS FORM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <h4 className="text-[10px] uppercase font-mono font-black text-slate-400 block border-b border-slate-100 pb-2 flex items-center gap-1.5 font-sans">
            <User className="w-4 h-4 text-blue-600" /> Perfil de Trabalho & Metas Oficiais
          </h4>

          <form onSubmit={handleSaveProfileSubmit} className="text-xs space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-slate-600 font-bold block mb-1">Nome Completo do Motorista</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800 focus:outline-blue-600"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Cidade / Região Metropolitana</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800 focus:outline-blue-600"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Dias Planejados por Semana</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  required
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-slate-800 focus:outline-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Meta Diária (Bruto R$)</label>
                <input
                  type="number"
                  step="5"
                  required
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-slate-800 focus:outline-blue-600"
                />
                <p className="text-[9px] text-slate-400 mt-1">Ex: R$ 320 faturamento bruto</p>
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Meta Líquida Mensal (R$)</label>
                <input
                  type="number"
                  step="50"
                  required
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-slate-800 focus:outline-blue-600"
                />
                <p className="text-[9px] text-slate-400 mt-1">Ex: R$ 4.500 livre na conta</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="w-full py-3 bg-blue-650 hover:bg-blue-700 bg-blue-600 text-white rounded-xl font-extrabold shadow-xs transition cursor-pointer text-center"
              >
                Gravar Configurações & Metas
              </button>
            </div>
          </form>
        </div>

        {/* FINANCIAL RADAR SUMMARY */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">Radar de Propósito GMC</span>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Como são definidas suas metas?</h4>
            <p className="text-[11px] text-slate-405 leading-relaxed font-semibold">
              O motorista parceiro independente é um microempreendedor individual da rodagem. Trabalhar sem metas financeiras de caixa gera sensação de perda financeira por causa do cansaço mental diário.
            </p>
          </div>

          <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl space-y-2 mt-2 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase text-slate-500 font-bold">
              <span>Fórmula GMC de Análise de Caixa</span>
              <span className="text-blue-400 font-extrabold uppercase font-mono border border-blue-900/40 px-1 rounded">Consolidada</span>
            </div>
            <p className="text-[11px] text-slate-350">
              <strong>Faturamento Bruto</strong> - é a soma integral das passagens mostradas no app da Uber/99. Não caia no erro de achar que isso é seu salário!
            </p>
            <p className="text-[11px] text-slate-350">
              <strong>Faturamento Líquido (Lucro real)</strong> - é o montante que sobra após subtrair custos com combustível (GNV/Gasolina), comissão de locadora de carros, manutenção e pacotes celulares de dados.
            </p>
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
            Meta ativa atual de Gean Carvalho: R$ {profile.dailyGoal.toFixed(0)} Brutos / Dia planejado.
          </div>
        </div>

      </div>

      {/* 3. APP DRIVERS SIMULATOR PLAYGROUND (PREMIUM COMPONENT) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Calculator className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Simulador Técnico e Planeador de Faturamento Mensal
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">
              Simule e projete suas margens líquidas ajustando os botões de controle abaixo para planejar sua escala de trabalho diária.
            </p>
          </div>
        </div>

        {/* SIMULATION FORM SLIDERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-slate-100 pt-5">
          
          {/* Controls Sliders block */}
          <div className="lg:col-span-1 space-y-4 text-xs font-semibold text-slate-705">
            <h4 className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider">Parâmetros de Simulação</h4>
            
            {/* Hours worked per day */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Horas trabalhadas/dia:</span>
                <span className="text-blue-600 font-black font-mono">{simHoursPerDay} hrs</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="0.5"
                value={simHoursPerDay}
                onChange={(e) => setSimHoursPerDay(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100"
              />
            </div>

            {/* Days per week */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Dias trabalhados/Semana:</span>
                <span className="text-blue-600 font-black font-mono">{simDaysPerWeek} dias</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={simDaysPerWeek}
                onChange={(e) => setSimDaysPerWeek(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100"
              />
            </div>

            {/* Average earning per hour */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>R$/Hora médio bruto (Plataformas):</span>
                <span className="text-orange-600 font-black font-mono">R$ {simEarningPerHour}/h</span>
              </div>
              <input
                type="range"
                min="20"
                max="75"
                step="1"
                value={simEarningPerHour}
                onChange={(e) => setSimEarningPerHour(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100"
              />
              <p className="text-[9px] text-slate-400 font-sans">Uber Black/Comfort possuem taxas horárias maiores (R$ 45 - R$ 55/hr)</p>
            </div>

            {/* Weekly rent / vehicle fixed costs */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600 font-bold">
                <span>Aluguel/Parcela Semanal do veículo:</span>
                <span className="text-slate-800 font-mono">R$ {simWeeklyFixedCost}</span>
              </div>
              <input
                type="number"
                value={simWeeklyFixedCost}
                onChange={(e) => setSimWeeklyFixedCost(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold focus:outline-blue-600 text-slate-700"
              />
              <p className="text-[9px] text-slate-400 font-normal">Para motoristas com veículo alugado (Localiza, Kovi, etc.) ou financiamento fixo.</p>
            </div>
            
            {/* Daily KM and Fuel Price */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Média KM/Dia</label>
                <input
                  type="number"
                  value={simDailyKm}
                  onChange={(e) => setSimDailyKm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-205 rounded-xl font-mono text-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Preço Combustível</label>
                <input
                  type="number"
                  step="0.01"
                  value={simFuelPrice}
                  onChange={(e) => setSimFuelPrice(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-205 rounded-xl font-mono text-slate-705"
                />
              </div>
            </div>

          </div>

          {/* Core computations simulator dashboard Outputs */}
          <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-210 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider">Fechamento Mensal Projetado</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                
                {/* Gross revenue forecast */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Total Faturamento Bruto</span>
                  <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">R$ {projectedGrossMonthlyEarnings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] text-slate-400 font-normal mt-0.5">Rodando {totalWorkedHoursPerMonth.toFixed(0)} horas por mês</p>
                </div>

                {/* Simulated fuel spend */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-red-650">Gasto Est. Combustível</span>
                  <p className="text-xl font-black text-red-700 font-mono mt-0.5">R$ {projectedMonthlyFuelExpense.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] text-slate-400 font-normal mt-0.5">Consumo médio Onix: {vehicle.avgConsumption} Km/L GNV</p>
                </div>

                {/* Simulated fixed rents */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-purple-650">Outros Custos Fixos</span>
                  <p className="text-xl font-black text-purple-700 font-mono mt-0.5">R$ {(projectedWeeklyRentalExpense + simMonthlyCellPlan).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] text-slate-400 font-normal mt-0.5">Aluguel do carro + Internet</p>
                </div>

                {/* Net Earnings profit */}
                <div className="p-4 bg-gradient-to-r from-blue-700 to-slate-800 text-white rounded-xl border border-blue-900/40">
                  <span className="text-[9px] uppercase font-black text-blue-200 block tracking-widest">Lucro Líquido Esperado (Melhor Cenário)</span>
                  <p className="text-2xl font-black font-mono mt-0.5">R$ {projectedNetMonthlyEarnings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] text-blue-350 font-normal mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" /> Rendimento real líquido de faturamento
                  </p>
                </div>

              </div>
            </div>

            {/* Metrics efficiency comparison column */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-205/80 text-[10px] font-semibold text-slate-600 font-mono bg-white p-3.5 rounded-xl border border-slate-210 text-center">
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-sans tracking-wide">R$ Líquido Real / Hora</p>
                <p className="text-slate-850 text-xs font-black">R$ {projectedNetPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-sans tracking-wide">R$ Líquido Real / KM recorrente</p>
                <p className="text-slate-850 text-xs font-black">R$ {projectedNetPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
