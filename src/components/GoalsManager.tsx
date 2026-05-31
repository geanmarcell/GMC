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
import { DriverProfile, Vehicle, FuelType } from '../types';

interface GoalsManagerProps {
  profile: DriverProfile;
  vehicle: Vehicle;
  onUpdateProfile: (p: DriverProfile, v?: Vehicle) => void;
}

export default function GoalsManager({ profile, vehicle, onUpdateProfile }: GoalsManagerProps) {
  // Profile settings state
  const [name, setName] = useState(profile.name);
  const [city, setCity] = useState(profile.city);
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal);
  const [monthlyGoal, setMonthlyGoal] = useState(profile.monthlyGoal);
  const [annualGoal, setAnnualGoal] = useState(profile.annualGoal || (profile.monthlyGoal * 12 || 54000));
  const [workingDays, setWorkingDays] = useState(profile.workingDaysPerWeek);

  // Vehicle settings state
  const [vehicleModel, setVehicleModel] = useState(vehicle.model || '');
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate || '');
  const [fuelType, setFuelType] = useState<FuelType>((vehicle.fuelType as FuelType) || 'Gasolina');
  const [avgConsumption, setAvgConsumption] = useState(vehicle.avgConsumption || 10);

  // Simulation State initialized dynamically from workspace/sync profile variables
  const [simHoursPerDay, setSimHoursPerDay] = useState(profile.simHoursPerDay ?? 8);
  const [simDaysPerWeek, setSimDaysPerWeek] = useState(profile.simDaysPerWeek ?? 5);
  const [simEarningPerHour, setSimEarningPerHour] = useState(profile.simEarningPerHour ?? 40); // R$/hora médio
  
  const [simDailyKm, setSimDailyKm] = useState(profile.simDailyKm ?? 180);
  const [simFuelPrice, setSimFuelPrice] = useState(profile.simFuelPrice ?? 4.50); // R$ por litro ou m³
  const [simAvgConsumption, setSimAvgConsumption] = useState(profile.simAvgConsumption ?? vehicle.avgConsumption ?? 10);
  const [simWeeklyFixedCost, setSimWeeklyFixedCost] = useState(profile.simWeeklyFixedCost ?? 450); // ex: Aluguel de carro (R$ 450/semana)
  const [simMonthlyCellPlan, setSimMonthlyCellPlan] = useState(profile.simMonthlyCellPlan ?? 75);

  // Sync prop changes to local states
  React.useEffect(() => {
    setName(profile.name);
    setCity(profile.city);
    setDailyGoal(profile.dailyGoal);
    setMonthlyGoal(profile.monthlyGoal);
    setAnnualGoal(profile.annualGoal || (profile.monthlyGoal * 12 || 54000));
    setWorkingDays(profile.workingDaysPerWeek);

    // Dynamic reactive sync when cloud modifications are pulled/restored
    if (profile.simHoursPerDay !== undefined) setSimHoursPerDay(profile.simHoursPerDay);
    if (profile.simDaysPerWeek !== undefined) setSimDaysPerWeek(profile.simDaysPerWeek);
    if (profile.simEarningPerHour !== undefined) setSimEarningPerHour(profile.simEarningPerHour);
    if (profile.simDailyKm !== undefined) setSimDailyKm(profile.simDailyKm);
    if (profile.simFuelPrice !== undefined) setSimFuelPrice(profile.simFuelPrice);
    if (profile.simAvgConsumption !== undefined) setSimAvgConsumption(profile.simAvgConsumption);
    if (profile.simWeeklyFixedCost !== undefined) setSimWeeklyFixedCost(profile.simWeeklyFixedCost);
    if (profile.simMonthlyCellPlan !== undefined) setSimMonthlyCellPlan(profile.simMonthlyCellPlan);
  }, [
    profile.name, 
    profile.city, 
    profile.dailyGoal, 
    profile.monthlyGoal, 
    profile.annualGoal, 
    profile.workingDaysPerWeek,
    profile.simHoursPerDay,
    profile.simDaysPerWeek,
    profile.simEarningPerHour,
    profile.simDailyKm,
    profile.simFuelPrice,
    profile.simAvgConsumption,
    profile.simWeeklyFixedCost,
    profile.simMonthlyCellPlan
  ]);

  React.useEffect(() => {
    setVehicleModel(vehicle.model || '');
    setLicensePlate(vehicle.licensePlate || '');
    setFuelType(vehicle.fuelType || 'Gasolina');
    setAvgConsumption(vehicle.avgConsumption || 10);
    // Prefer profile specified simulation avg consumption if available, else vehicle's
    if (profile.simAvgConsumption === undefined) {
      setSimAvgConsumption(vehicle.avgConsumption || 10);
    }
  }, [vehicle.model, vehicle.licensePlate, vehicle.fuelType, vehicle.avgConsumption, profile.simAvgConsumption]);

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      city,
      dailyGoal: Number(dailyGoal),
      monthlyGoal: Number(monthlyGoal),
      annualGoal: Number(annualGoal),
      workingDaysPerWeek: Number(workingDays),
      simHoursPerDay: Number(simHoursPerDay),
      simDaysPerWeek: Number(simDaysPerWeek),
      simEarningPerHour: Number(simEarningPerHour),
      simDailyKm: Number(simDailyKm),
      simFuelPrice: Number(simFuelPrice),
      simAvgConsumption: Number(simAvgConsumption),
      simWeeklyFixedCost: Number(simWeeklyFixedCost),
      simMonthlyCellPlan: Number(simMonthlyCellPlan)
    }, {
      ...vehicle,
      model: vehicleModel,
      licensePlate,
      fuelType,
      avgConsumption: Number(avgConsumption)
    });
    alert("Perfil de trabalho, ficha do veículo e planejador de faturamento atualizados com sucesso!");
  };

  // Immediate save for the simulation playground specifically
  const handleSaveSimulatorState = () => {
    onUpdateProfile({
      ...profile,
      simHoursPerDay: Number(simHoursPerDay),
      simDaysPerWeek: Number(simDaysPerWeek),
      simEarningPerHour: Number(simEarningPerHour),
      simDailyKm: Number(simDailyKm),
      simFuelPrice: Number(simFuelPrice),
      simAvgConsumption: Number(simAvgConsumption),
      simWeeklyFixedCost: Number(simWeeklyFixedCost),
      simMonthlyCellPlan: Number(simMonthlyCellPlan)
    });
    alert("Projeções e dados do Planejador de Faturamento atualizados e enviados para a Nuvem GMC com sucesso!");
  };

  // Simulation Calculations (4.33 weeks per month)
  const weeksPerMonth = 4.33;
  const totalWorkedDaysPerMonth = simDaysPerWeek * weeksPerMonth;
  const totalWorkedHoursPerMonth = simHoursPerDay * simDaysPerWeek * weeksPerMonth;
  const projectedGrossMonthlyEarnings = totalWorkedHoursPerMonth * simEarningPerHour;

  const totalMonthlyKm = simDailyKm * totalWorkedDaysPerMonth;
  // fuel needed = total km / average consumption in simulation
  const fuelNeededLiters = totalMonthlyKm / (simAvgConsumption || 1);
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-4">
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
                <p className="text-[9px] text-slate-400 mt-1">Ex: R$ 320 bruto / dia</p>
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
                <p className="text-[9px] text-slate-400 mt-1">Ex: R$ 4.500 líquido / mês</p>
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Meta Líquida Anual (R$)</label>
                <input
                  type="number"
                  step="500"
                  required
                  value={annualGoal}
                  onChange={(e) => setAnnualGoal(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-slate-800 focus:outline-blue-600"
                />
                <p className="text-[9px] text-slate-400 mt-1">Ex: R$ 54.000 líquido / ano</p>
              </div>
            </div>

            {/* VEHICLE REGISTRATION BLOCK */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h5 className="text-[10px] uppercase font-mono font-black text-slate-400 block pb-1 border-b border-dashed border-slate-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Ficha do Veículo de Trabalho
              </h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Modelo Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Onix 1.0, HB20"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800 focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Placa do Veículo</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Ex: BRA2E19"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-slate-750 uppercase focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Combustível</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-800 focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="Gasolina">Gasolina</option>
                    <option value="Etanol">Etanol</option>
                    <option value="Flex">Flex (Gasolina/Álcool)</option>
                    <option value="GNV">GNV (Gás Natural)</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Elétrico">Elétrico</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Autonomia Média (Km/L ou m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={avgConsumption}
                    onChange={(e) => setAvgConsumption(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-slate-800 focus:outline-blue-600"
                  />
                </div>
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
            
            {/* Autonomia KM/L Slider & Input combo */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-605">
                <span>Autonomia Simulador (KM/L ou m³):</span>
                <span className="text-orange-650 font-black font-mono">{simAvgConsumption} Km/{fuelType === 'GNV' ? 'm³' : 'L'}</span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="4"
                  max="30"
                  step="0.1"
                  value={simAvgConsumption}
                  onChange={(e) => setSimAvgConsumption(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-100"
                />
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={simAvgConsumption}
                  onChange={(e) => setSimAvgConsumption(Number(e.target.value))}
                  className="w-16 p-1.5 bg-slate-50 border border-slate-205 rounded-xl font-mono font-bold text-center text-[10px] text-slate-700 focus:outline-blue-600"
                />
              </div>
            </div>

            {/* Daily KM and Fuel Price */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Média KM/Dia</label>
                <input
                  type="number"
                  value={simDailyKm}
                  onChange={(e) => setSimDailyKm(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-205 rounded-xl font-mono text-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Preço Combustível</label>
                <input
                  type="number"
                  step="0.01"
                  value={simFuelPrice}
                  onChange={(e) => setSimFuelPrice(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-205 rounded-xl font-mono text-slate-700 font-bold"
                />
              </div>
            </div>

          </div>

          {/* Core computations simulator dashboard Outputs */}
          <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-210 p-5 space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider">Fechamento Mensal Projetado (Fórmula Meu KM)</span>
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
                  <p className="text-[9px] text-slate-400 font-normal mt-0.5">Eficiência simulada: {simAvgConsumption} Km/{fuelType === 'GNV' ? 'm³' : 'L'}</p>
                </div>

                {/* Simulated fixed rents */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-purple-650">Outros Custos Fixos</span>
                  <p className="text-xl font-black text-purple-700 font-mono mt-0.5">R$ {(projectedWeeklyRentalExpense + simMonthlyCellPlan).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] text-slate-400 font-normal mt-0.5">Aluguel do carro + Internet</p>
                </div>

                {/* Net Earnings profit */}
                <div className="p-4 bg-gradient-to-r from-blue-700 to-slate-800 text-white rounded-xl border border-blue-900/40">
                  <span className="text-[9px] uppercase font-black text-blue-200 block tracking-widest">Lucro Líquido Esperado (Margem Livre)</span>
                  <p className="text-2xl font-black font-mono mt-0.5">R$ {projectedNetMonthlyEarnings.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] text-blue-350 font-normal mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" /> Rendimento real líquido de faturamento
                  </p>
                </div>

              </div>
            </div>

            {/* Metrics efficiency comparison grid - Meu KM Style */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-205/80 text-[10px] font-semibold text-slate-650 font-mono bg-white p-3.5 rounded-xl border border-slate-210 text-center">
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-sans tracking-wide">Líquido / Hora</p>
                <p className="text-slate-850 text-xs font-black">R$ {projectedNetPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-sans tracking-wide">Líquido / KM</p>
                <p className="text-blue-600 text-xs font-black">R$ {projectedNetPerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-sans tracking-wide">Combustível / KM</p>
                <p className="text-red-650 text-xs font-black">R$ {(simFuelPrice / (simAvgConsumption || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-sans tracking-wide">Sobra por Turno</p>
                <p className="text-emerald-700 text-xs font-black">R$ {(projectedNetMonthlyEarnings / (totalWorkedDaysPerMonth || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/dia</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                * Quer ver este planejamento no seu computador? Clique em Gravar para salvá-lo na nuvem!
              </p>
              <button
                type="button"
                onClick={handleSaveSimulatorState}
                className="w-full sm:w-auto shrink-0 py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition cursor-pointer text-[11px] flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                Gravar & Sincronizar Planejamento
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
