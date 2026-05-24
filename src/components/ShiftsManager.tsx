import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Navigation, 
  DollarSign, 
  TrendingUp, 
  ChevronRight, 
  Edit3, 
  PlusCircle, 
  AlertTriangle,
  FileCheck,
  Search,
  Filter
} from 'lucide-react';
import { Shift, Vehicle, DriverProfile } from '../types';

interface ShiftsManagerProps {
  shifts: Shift[];
  vehicle: Vehicle;
  profile: DriverProfile;
  onAddShift: (shift: Shift) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteShift: (id: string) => void;
  onUpdateVehicleOdometer: (km: number) => void;
}

export default function ShiftsManager({ 
  shifts, 
  vehicle, 
  profile, 
  onAddShift, 
  onUpdateShift, 
  onDeleteShift,
  onUpdateVehicleOdometer
}: ShiftsManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Modal Form States
  const [isEditing, setIsEditing] = useState<string | null>(null); // Shift ID if editing
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [hoursWorked, setHoursWorked] = useState(8.0);
  const [startOdometer, setStartOdometer] = useState(vehicle.currentOdometer);
  const [endOdometer, setEndOdometer] = useState(vehicle.currentOdometer);
  const [uberEarnings, setUberEarnings] = useState(0.0);
  const [earnings99, setEarnings99] = useState(0.0);
  const [indriveEarnings, setIndriveEarnings] = useState(0.0);
  const [privateEarnings, setPrivateEarnings] = useState(0.0);
  const [otherEarnings, setOtherEarnings] = useState(0.0);
  const [fuelExpense, setFuelExpense] = useState(0.0);
  const [foodExpense, setFoodExpense] = useState(0.0);
  const [otherExpenses, setOtherExpenses] = useState(0.0);
  const [notes, setNotes] = useState('');

  // Open modal for new shift
  const handleOpenAdd = () => {
    setIsEditing(null);
    setDate(new Date().toISOString().substring(0, 10));
    setHoursWorked(8.0);
    setStartOdometer(vehicle.currentOdometer);
    setEndOdometer(vehicle.currentOdometer);
    setUberEarnings(0.0);
    setEarnings99(0.0);
    setIndriveEarnings(0);
    setPrivateEarnings(0);
    setOtherEarnings(0);
    setFuelExpense(0.0);
    setFoodExpense(0.0);
    setOtherExpenses(0);
    setNotes('');
    setShowAddModal(true);
  };

  // Open modal for editing existing shift
  const handleOpenEdit = (s: Shift) => {
    setIsEditing(s.id);
    setDate(s.date);
    setHoursWorked(s.hoursWorked);
    setStartOdometer(s.startOdometer);
    setEndOdometer(s.endOdometer);
    setUberEarnings(s.uberEarnings);
    setEarnings99(s.earnings99);
    setIndriveEarnings(s.indriveEarnings);
    setPrivateEarnings(s.privateEarnings);
    setOtherEarnings(s.otherEarnings);
    setFuelExpense(s.fuelExpense);
    setFoodExpense(s.foodExpense);
    setOtherExpenses(s.otherExpenses);
    setNotes(s.notes || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (endOdometer < startOdometer) {
      alert("Erro: O odômetro final não pode ser menor que o odômetro inicial!");
      return;
    }

    const totalKm = endOdometer - startOdometer;

    const newShift: Shift = {
      id: isEditing || 's-' + Math.random().toString(36).substring(2, 9),
      date,
      hoursWorked,
      startOdometer,
      endOdometer,
      totalKm,
      uberEarnings: Number(uberEarnings),
      earnings99: Number(earnings99),
      indriveEarnings: Number(indriveEarnings),
      privateEarnings: Number(privateEarnings),
      otherEarnings: Number(otherEarnings),
      fuelExpense: Number(fuelExpense),
      foodExpense: Number(foodExpense),
      otherExpenses: Number(otherExpenses),
      notes
    };

    if (isEditing) {
      onUpdateShift(newShift);
    } else {
      onAddShift(newShift);
      // Increment the vehicle odometer with the newest reading if it exceeds current
      if (endOdometer > vehicle.currentOdometer) {
        onUpdateVehicleOdometer(endOdometer);
      }
    }

    setShowAddModal(false);
  };

  // Filter shifts based on search/filters
  const filteredShifts = shifts.filter(s => {
    const searchString = `${s.date} ${s.notes}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterPlatform === 'uberOnly') matchesFilter = s.uberEarnings > 0;
    else if (filterPlatform === '99Only') matchesFilter = s.earnings99 > 0;
    else if (filterPlatform === 'indriveOnly') matchesFilter = s.indriveEarnings > 0;
    else if (filterPlatform === 'privateOnly') matchesFilter = s.privateEarnings > 0;
    else if (filterPlatform === 'other') matchesFilter = s.otherEarnings > 0;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      
      {/* 1. OPERATIONS HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-205 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
            Seu Diário de Corrida (Turnos Registrados)
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Registre suas horas, ganhos e KMs imediatamente após o término do turno para alimentar as métricas do painel.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Novo Turno
        </button>
      </div>

      {/* 2. ACTIONS FILTERS & SEARCH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="col-span-1 md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquise por observações ou data (Ex: 2026-05)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-blue-600 focus:bg-white font-semibold"
          />
        </div>
        <div>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-blue-600"
          >
            <option value="all">Sinalizar: Todas as Plataformas</option>
            <option value="uberOnly">Presença de Viagens Uber</option>
            <option value="99Only">Presença de Viagens 99</option>
            <option value="indriveOnly">Presença de Viagens InDrive</option>
            <option value="privateOnly">Presença de Viagens Particulares</option>
            <option value="other">Outros Lançamentos</option>
          </select>
        </div>
      </div>

      {/* 3. SHIFTS GRID CARD LIST */}
      <div className="grid grid-cols-1 gap-4">
        {filteredShifts.length > 0 ? (
          filteredShifts.map((s) => {
            const shiftGross = s.uberEarnings + s.earnings99 + s.indriveEarnings + s.privateEarnings + s.otherEarnings;
            const shiftCost = s.fuelExpense + s.foodExpense + s.otherExpenses;
            const shiftNet = shiftGross - shiftCost;
            const realFormattedDate = new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric', weekday: 'short'
            });

            // Unit metrics for shift
            const ratePerKm = s.totalKm > 0 ? (shiftGross / s.totalKm) : 0;
            const ratePerHour = s.hoursWorked > 0 ? (shiftGross / s.hoursWorked) : 0;

            return (
              <div 
                key={s.id} 
                className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-sm hover:border-slate-300 transition-all overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100"
              >
                
                {/* Visual Time Indicator banner left */}
                <div className="p-5 md:w-56 shrink-0 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Data do Trabalho</span>
                    <h4 className="text-sm font-black text-slate-850 mt-1 capitalize leading-snug">{realFormattedDate}</h4>
                    <p className="text-[9px] font-mono text-slate-500 font-bold mt-1 uppercase text-blue-600">ID: {s.id.toUpperCase()}</p>
                  </div>
                  
                  {/* Summary performance badges */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex gap-4 text-[10px] font-bold text-slate-600">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {s.hoursWorked}h rodadas</span>
                    <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-orange-500" /> {s.totalKm} KM</span>
                  </div>
                </div>

                {/* Earnings Division */}
                <div className="p-5 flex-1 space-y-3">
                  <div>
                    <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Detalhamento dos Canais (Bruto)</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {s.uberEarnings > 0 && (
                        <div className="p-1 px-2.5 bg-slate-900 text-white rounded-lg text-[9px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Uber: R$ {s.uberEarnings.toFixed(2)}
                        </div>
                      )}
                      {s.earnings99 > 0 && (
                        <div className="p-1 px-2.5 bg-yellow-100 text-yellow-800 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-yellow-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                          99: R$ {s.earnings99.toFixed(2)}
                        </div>
                      )}
                      {s.indriveEarnings > 0 && (
                        <div className="p-1 px-2.5 bg-teal-50 text-teal-800 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-teal-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                          InDrive: R$ {s.indriveEarnings.toFixed(2)}
                        </div>
                      )}
                      {s.privateEarnings > 0 && (
                        <div className="p-1 px-2.5 bg-blue-50 text-blue-800 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Particular: R$ {s.privateEarnings.toFixed(2)}
                        </div>
                      )}
                      {s.otherEarnings > 0 && (
                        <div className="p-1 px-2.5 bg-orange-50 text-orange-850 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-orange-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Outros: R$ {s.otherEarnings.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes / Comments */}
                  {s.notes && (
                    <div className="p-2 px-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-semibold text-slate-500 italic max-w-lg mt-1">
                      "{s.notes}"
                    </div>
                  )}

                  {/* Odometers */}
                  <p className="text-[10px] text-slate-400 font-mono">
                    Odômetro: <strong className="text-slate-600 font-bold">{s.startOdometer} km</strong> a <strong className="text-slate-600 font-bold">{s.endOdometer} km</strong> (Total {s.totalKm} km)
                  </p>
                </div>

                {/* Output Ledger & Actions */}
                <div className="p-5 md:w-64 shrink-0 bg-slate-50/40 flex flex-col justify-between space-y-4">
                  {/* Calculations breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                      <span>Receita Bruta:</span>
                      <span className="text-emerald-700 font-semibold font-mono">R$ {shiftGross.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
                      <span>Custos Diretos:</span>
                      <span className="text-red-650 font-semibold font-mono">R$ {shiftCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-850 border-t border-slate-200 pt-1 uppercase">
                      <span>Rendimento Líquido:</span>
                      <span className="text-blue-650 font-black font-mono">R$ {shiftNet.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Profit speedometers (R$/KM, R$/Hour) */}
                  <div className="grid grid-cols-2 gap-1.5 bg-white p-2 rounded-xl border border-slate-150 text-[10px] text-center font-bold font-mono">
                    <div>
                      <p className="text-[8px] text-slate-400 font-sans tracking-wide uppercase">R$ / KM</p>
                      <p className="text-slate-800 text-xs font-black">R$ {ratePerKm.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 font-sans tracking-wide uppercase">R$ / HORA</p>
                      <p className="text-slate-800 text-xs font-black">R$ {ratePerHour.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Buttons for management */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 no-print">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="flex-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    {deletingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteShift(s.id);
                            setDeletingId(null);
                          }}
                          className="py-1.5 px-2 bg-red-650 hover:bg-red-700 text-white font-black text-[9px] uppercase rounded-lg transition cursor-pointer shrink-0"
                        >
                          Apagar?
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-705 font-bold text-[9px] uppercase rounded-lg transition cursor-pointer"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDeletingId(s.id);
                        }}
                        className="py-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-650 rounded-lg transition cursor-pointer"
                        title="Apagar turno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        ) : (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800 uppercase">Nenhum turno cadastrado nesta busca</h4>
            <p className="text-[11px] text-slate-550 max-w-md mx-auto">
              Experimente ajustar os filtros ou clique em "Registrar Novo Turno" para computar os dados de hoje!
            </p>
          </div>
        )}
      </div>

      {/* 4. MODAL DRAWER FOR ADD / EDIT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-xl overflow-hidden block">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {isEditing ? 'Editar Registro de Turno' : 'Registrar Novo Turno de Trabalho'}
                </h4>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-extrabold text-sm uppercase cursor-pointer"
              >
                fechar X
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 text-xs space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Data da Jornada</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-blue-600 font-mono"
                  />
                </div>
                {/* Worked Hours */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Horas Rodadas (Online)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min="0.1"
                    max="24"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-705 text-slate-700 font-semibold rounded-xl focus:outline-blue-600 font-mono"
                  />
                </div>
                {/* Start Odometer */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Odomêtro Inicial (KM)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-blue-600 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                {/* End Odometer */}
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Odomêtro Final (KM)</label>
                  <input
                    type="number"
                    required
                    min={startOdometer}
                    value={endOdometer}
                    onChange={(e) => setEndOdometer(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-blue-600 font-mono font-bold"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">KM parcial total: {endOdometer >= startOdometer ? endOdometer - startOdometer : 0} KM</p>
                </div>
                <div colSpan={2} className="col-span-1 sm:col-span-2 p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] text-blue-800 leading-snug font-medium">
                    Se este for o maior odômetro lançado até hoje, o odômetro consolidado do veículo herdará automaticamente o valor para facilitar as próximas vistorias!
                  </p>
                </div>
              </div>

              {/* EARNINGS GRID */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-2.5">Ganhos Brutos por Plataforma (R$)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Uber</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={uberEarnings}
                      onChange={(e) => setUberEarnings(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">99</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={earnings99}
                      onChange={(e) => setEarnings99(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">InDrive</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={indriveEarnings}
                      onChange={(e) => setIndriveEarnings(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Particular</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={privateEarnings}
                      onChange={(e) => setPrivateEarnings(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Outros/Tips</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={otherEarnings}
                      onChange={(e) => setOtherEarnings(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-right text-emerald-800 font-bold mt-1">Soma Bruta Estimada: R$ {(uberEarnings + earnings99 + indriveEarnings + privateEarnings + otherEarnings).toFixed(2)}</p>
              </div>

              {/* DIRECT COSTS */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-2.5">Despesas Imediatas do Turno (R$)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Combustível Abastecido no Turno</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fuelExpense}
                      onChange={(e) => setFuelExpense(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Alimentação na Rua (Lanches)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={foodExpense}
                      onChange={(e) => setFoodExpense(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-bold block mb-1">Outras Despesas (Pedágios, etc.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={otherExpenses}
                      onChange={(e) => setOtherExpenses(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl focus:outline-blue-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Anotações do Dia (Eventos importantes, trânsito)</label>
                <textarea
                  placeholder="Ex: Trânsito intenso no centro por causa de chuva..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-blue-600"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer text-center"
                >
                  {isEditing ? 'Salvar Edições' : 'Gravar Turno de Trabalho'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
