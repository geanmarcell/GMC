import React, { useState } from 'react';
import { 
  Car, 
  Settings, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Navigation, 
  ListFilter, 
  Activity, 
  BadgeAlert,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Vehicle, Maintenance, FuelType, MaintenanceType } from '../types';

interface VehicleManagerProps {
  vehicle: Vehicle;
  maintenanceLog: Maintenance[];
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onAddMaintenance: (m: Maintenance) => void;
  onDeleteMaintenance: (id: string) => void;
}

export default function VehicleManager({ 
  vehicle, 
  maintenanceLog, 
  onUpdateVehicle, 
  onAddMaintenance,
  onDeleteMaintenance 
}: VehicleManagerProps) {
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit Vehicle Form States
  const [brand, setBrand] = useState(vehicle.brand);
  const [model, setModel] = useState(vehicle.model);
  const [year, setYear] = useState(vehicle.year);
  const [licensePlate, setLicensePlate] = useState(vehicle.licensePlate);
  const [fuelType, setFuelType] = useState<FuelType>(vehicle.fuelType);
  const [avgConsumption, setAvgConsumption] = useState(vehicle.avgConsumption);
  const [currentOdometer, setCurrentOdometer] = useState(vehicle.currentOdometer);
  const [oilChangeInterval, setOilChangeInterval] = useState(vehicle.oilChangeInterval);
  const [lastOilChangeOdometer, setLastOilChangeOdometer] = useState(vehicle.lastOilChangeOdometer);

  // New Maintenance Form States
  const [mDate, setMDate] = useState(new Date().toISOString().substring(0, 10));
  const [mType, setMType] = useState<MaintenanceType>('Troca de Óleo');
  const [mOdometer, setMOdometer] = useState(vehicle.currentOdometer);
  const [mDescription, setMDescription] = useState('');
  const [mCost, setMCost] = useState<number>(150.00);
  const [mNextAlert, setMNextAlert] = useState<number>(vehicle.currentOdometer + 10000);

  const maintenanceTypes: MaintenanceType[] = [
    'Troca de Óleo',
    'Pastilhas/Discos de Freio',
    'Pneus',
    'Suspensão/Amortecedores',
    'Filtros',
    'Correia Dentada',
    'Alinhamento/Balanceamento',
    'Elétrica/Ar Condicionado',
    'Outros'
  ];

  // Calculations for Oil Change Alert
  const nextOilChangeAt = vehicle.lastOilChangeOdometer + vehicle.oilChangeInterval;
  const remainingKmForOil = nextOilChangeAt - vehicle.currentOdometer;

  const handleUpdateVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVehicle({
      brand,
      model,
      year,
      licensePlate,
      fuelType,
      avgConsumption: Number(avgConsumption),
      currentOdometer: Number(currentOdometer),
      oilChangeInterval: Number(oilChangeInterval),
      lastOilChangeOdometer: Number(lastOilChangeOdometer)
    });
    setShowEditVehicle(false);
  };

  const handleAddMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mOdometer < 0 || mCost < 0) {
      alert("Erro: Odômetro ou custos não podem ser negativos!");
      return;
    }

    const newM: Maintenance = {
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      date: mDate,
      type: mType,
      odometer: Number(mOdometer),
      description: mDescription,
      cost: Number(mCost),
      nextOdometerAlert: mType === 'Troca de Óleo' ? Number(mOdometer) + Number(vehicle.oilChangeInterval) : Number(mNextAlert),
      isCompleted: true
    };

    // If it's a new Completed Oil Change, automatically update lastOilChangeOdometer and increment currentOdometer if needed
    if (mType === 'Troca de Óleo') {
      const updatedVehicle = { ...vehicle };
      updatedVehicle.lastOilChangeOdometer = Number(mOdometer);
      if (Number(mOdometer) > updatedVehicle.currentOdometer) {
        updatedVehicle.currentOdometer = Number(mOdometer);
      }
      onUpdateVehicle(updatedVehicle);
    } else if (Number(mOdometer) > vehicle.currentOdometer) {
      // Just update odometer
      onUpdateVehicle({ ...vehicle, currentOdometer: Number(mOdometer) });
    }

    onAddMaintenance(newM);
    setShowAddMaintenanceModal(false);

    // Reset Form
    setMDescription('');
    setMCost(150.0);
  };

  const totalMaintenanceExpense = maintenanceLog.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="space-y-6">
      
      {/* 1. MASTER SHIFT CAR STATS & REVISIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CAR DETAILS CARD */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-black tracking-widest text-slate-400">Meu Veículo de Trabalho</span>
              <button
                onClick={() => setShowEditVehicle(!showEditVehicle)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer no-print"
              >
                <Settings className="w-4 h-4" /> {showEditVehicle ? 'Fechar' : 'Editar Ficha'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-900 text-white rounded-xl">
                <Car className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 leading-tight">{vehicle.brand} {vehicle.model}</h4>
                <p className="text-[10px] text-slate-400 font-mono font-semibold uppercase mt-0.5">Placa: {vehicle.licensePlate} • Ano {vehicle.year}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between items-center text-[10px] uppercase text-slate-400 font-bold">
                <span>Combustível Padrão</span>
                <span className="text-slate-800 font-mono">{vehicle.fuelType}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase text-slate-400 font-bold">
                <span>Odômetro Acumulado</span>
                <span className="text-slate-800 font-mono text-xs">{vehicle.currentOdometer.toLocaleString('pt-BR')} KM</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase text-slate-400 font-bold">
                <span>Consumo Médio (Cidade)</span>
                <span className="text-slate-800 font-mono">{vehicle.avgConsumption} Km/{vehicle.fuelType === 'GNV' ? 'm³' : 'L'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] font-medium text-slate-500 leading-relaxed font-sans">
            Mantenha a rodagem do veículo calibrada. O GMC usa esses dados para calcular consumo de combustível por quilômetro e emitir avisos de segurança preventiva.
          </div>
        </div>

        {/* OIL CHANGE ALERT METER CONTROL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-mono font-black tracking-widest text-slate-400 block">Monitoramento de Óleo Lubrificante</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* Status bar */}
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Próxima Troca Agendada em:</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{nextOilChangeAt.toLocaleString('pt-BR')} KM</p>
              
              <div className="mt-3 text-xs">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Última Troca: {vehicle.lastOilChangeOdometer.toLocaleString('pt-BR')} km</span>
                  <span>Limite: {nextOilChangeAt.toLocaleString('pt-BR')} km</span>
                </div>
                {/* Horizontal status line */}
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      remainingKmForOil <= 0 ? 'bg-red-600' :
                      remainingKmForOil <= 1000 ? 'bg-yellow-500' :
                      'bg-blue-600'
                    }`}
                    style={{ 
                      width: `${Math.max(0, Math.min(100, (1 - (remainingKmForOil / vehicle.oilChangeInterval)) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Smart Alarm Panel message */}
            <div className="p-4 rounded-xl border flex items-start gap-3 text-[11px] font-sans font-semibold leading-relaxed">
              {remainingKmForOil <= 0 ? (
                <div className="bg-red-50 border border-red-200 text-red-900 p-3 rounded-xl flex items-start gap-2.5 w-full">
                  <BadgeAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <h5 className="font-extrabold uppercase text-xs text-red-700">Óleo Vencido! Recomenda-se Revisão</h5>
                    <p className="mt-0.5">Sua troca de óleo venceu há {Math.abs(remainingKmForOil).toLocaleString('pt-BR')} KM. Risco alto de fadiga ou quebra mecânica do cabeçote!</p>
                  </div>
                </div>
              ) : remainingKmForOil <= 1000 ? (
                <div className="bg-yellow-50 border border-yellow-250 text-yellow-905 p-3 rounded-xl flex items-start gap-2.5 w-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5 text-yellow-700 font-bold" />
                  <div>
                    <h5 className="font-black uppercase text-[11px] text-yellow-800">Troca de Óleo muito Próxima!</h5>
                    <p className="mt-0.5">Faltam apenas {remainingKmForOil.toLocaleString('pt-BR')} KM para o vencimento do lubrificante de 10.000Km. Agende a visita ao autocenter.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl flex items-start gap-2.5 w-full">
                  <CheckCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-extrabold uppercase text-[11px] text-blue-700">Lubrificante do Motor Saudável</h5>
                    <p className="mt-0.5">Seu óleo lubrificante está no nível ideal. Você ainda pode rodar mais {remainingKmForOil.toLocaleString('pt-BR')} KM antes da próxima manutenção preventiva.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 2. UPDATE VEHICLE DETAILS (IF OPEN) */}
      {showEditVehicle && (
        <form onSubmit={handleUpdateVehicleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 animate-fade-in text-xs no-print">
          <h4 className="text-[10px] uppercase font-mono font-black text-slate-400 block border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" /> Atualizar Informações Físicas do Carro
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Marca do Veículo</label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-600 font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Modelo Comercial</label>
              <input type="text" value={model} onChange={e => setModel(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-600 font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Ano Fabricação/Modelo</label>
              <input type="text" value={year} onChange={e => setYear(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-600 font-mono font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Placa Oficial do Carro</label>
              <input type="text" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-705 text-slate-700 focus:outline-blue-600 uppercase font-mono font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="text-slate-600 font-bold block mb-1">Tipo de Combustível</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value as FuelType)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-600">
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="Flex">Flex (Gasolina/Álcool)</option>
                <option value="GNV">GNV (Gás Natural)</option>
                <option value="Diesel">Diesel</option>
                <option value="Elétrico">Elétrico</option>
              </select>
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Consumo Cidade (Km/L ou m³)</label>
              <input type="number" step="0.1" value={avgConsumption} onChange={e => setAvgConsumption(Number(e.target.value))} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-600 font-mono font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Odômetro Atual do Carro (KM)</label>
              <input type="number" value={currentOdometer} onChange={e => setCurrentOdometer(Number(e.target.value))} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-600 font-mono font-bold" />
            </div>
            <div>
              <label className="text-slate-600 font-bold block mb-1">Troca Óleo a cada quanto (KM)</label>
              <input type="number" value={oilChangeInterval} onChange={e => setOilChangeInterval(Number(e.target.value))} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-705 text-slate-700 focus:outline-blue-600 font-mono font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-slate-600 font-bold block mb-1">KM da Última Troca de Óleo Registrada</label>
              <input type="number" value={lastOilChangeOdometer} onChange={e => setLastOilChangeOdometer(Number(e.target.value))} required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-blue-600 font-mono font-bold" />
            </div>
            <div className="flex items-end justify-end gap-3.5 font-bold pt-3.5">
              <button type="button" onClick={() => setShowEditVehicle(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer">Defensivo Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer">Salvar Informações</button>
            </div>
          </div>
        </form>
      )}

      {/* 3. LIST OF COMPLETED MAINTENANCE LOGS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-650" /> Histórico Geral de Manutenções
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Sua frota saudável garante maior vida útil e valor de revenda. Trackeie aqui as revisões programadas.
            </p>
          </div>
          <button
            onClick={() => setShowAddMaintenanceModal(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-xl px-4 py-2.5 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer no-print"
          >
            <Plus className="w-4 h-4" /> Registrar Manutenção
          </button>
        </div>

        {/* Maintenance Log Table list */}
        <div className="bg-white border border-slate-205 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 text-[10px] uppercase">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Revisão Efetuada</th>
                <th className="py-3 px-4">Odomêtro (KM)</th>
                <th className="py-3 px-4">Descrição das Peças / Serviços</th>
                <th className="py-3 px-4 text-right">Custo total</th>
                <th className="py-3 px-4 text-center no-print w-20">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-705">
              {maintenanceLog.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 transition">
                  {/* Date */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">
                    {new Date(log.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>

                  {/* Icon + Type */}
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      {log.type}
                    </span>
                  </td>

                  {/* Odometer */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {log.odometer.toLocaleString('pt-BR')} KM
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 font-normal text-slate-600">
                    {log.description}
                  </td>

                  {/* Cost */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                    R$ {log.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Delete */}
                  <td className="py-3 px-4 text-center no-print">
                    {deletingId === log.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteMaintenance(log.id);
                            setDeletingId(null);
                          }}
                          className="px-2 py-1 bg-red-650 hover:bg-red-700 text-white font-extrabold text-[9px] uppercase rounded-lg transition cursor-pointer"
                        >
                          Apagar?
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-705 font-bold text-[9px] uppercase rounded-lg transition cursor-pointer"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDeletingId(log.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-105 rounded-md transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TO ADD NEW MAINTENANCE */}
      {showAddMaintenanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl border border-slate-205 w-full max-w-md shadow-xl overflow-hidden block">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Registrar Nova Revisão Mecânica</h4>
              </div>
              <button 
                onClick={() => setShowAddMaintenanceModal(false)}
                className="text-slate-405 hover:text-white font-extrabold text-sm uppercase cursor-pointer"
              >
                X
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddMaintenanceSubmit} className="p-6 text-xs space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Data do Serviço</label>
                  <input
                    type="date"
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-blue-600 font-mono"
                  />
                </div>
                {/* Odometer */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Odomêtro na Oficina</label>
                  <input
                    type="number"
                    required
                    value={mOdometer}
                    onChange={(e) => setMOdometer(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl focus:outline-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Serviço Principal Executado</label>
                <select
                  value={mType}
                  onChange={(e) => setMType(e.target.value as MaintenanceType)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-blue-600"
                >
                  {maintenanceTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Lista de Peças Trocadas / Descrição Curta</label>
                <textarea
                  required
                  placeholder="Ex: Óleo sintético 5w30 GM, filtro de combustível, filtro de cabine e higienização interna..."
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-blue-600"
                  rows={3}
                />
              </div>

              {/* Cost */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Custo Total das Peças + Mão de Obra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={mCost}
                  onChange={(e) => setMCost(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-black rounded-xl focus:outline-blue-600 font-mono text-base text-blue-600"
                />
              </div>

              {/* Alert note */}
              {mType === 'Troca de Óleo' ? (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-800 leading-snug">
                  <strong>Aviso Inteligente:</strong> Por se tratar de uma <strong>Troca de Óleo</strong>, o sistema calculará preventivamente a validade de 10.000Km em relação a este odômetro, atualizando a ficha oficial do veículo.
                </div>
              ) : (
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Previsão KM de Próxima Troca (Se relevante)</label>
                  <input
                    type="number"
                    value={mNextAlert}
                    onChange={(e) => setMNextAlert(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl focus:outline-blue-600 font-mono"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddMaintenanceModal(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer text-center"
                >
                  Gravar Serviço
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
