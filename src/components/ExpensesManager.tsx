import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Tag, 
  Search, 
  Filter, 
  AlertTriangle,
  Receipt,
  Edit2
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpensesManager({ expenses, onAddExpense, onDeleteExpense }: ExpensesManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Expense Form States
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>('Outros');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number>(50.00);

  const categories: ExpenseCategory[] = [
    'Combustível',
    'Aluguel',
    'Financiamento',
    'Seguro',
    'IPVA/Impostos',
    'Manutenção',
    'Limpeza/Lava-jato',
    'Alimentação',
    'Celular/Internet',
    'Outros'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (value <= 0) {
      alert("Erro: O valor da despesa deve ser maior que zero!");
      return;
    }

    const newExpense: Expense = {
      id: 'e-' + Math.random().toString(36).substring(2, 9),
      date,
      category,
      description,
      value: Number(value)
    };

    onAddExpense(newExpense);
    setShowAddModal(false);

    // Reset values
    setDate(new Date().toISOString().substring(0, 10));
    setCategory('Outros');
    setDescription('');
    setValue(50.00);
  };

  // Filter & Search
  const filteredExpenses = expenses.filter(e => {
    const textMatches = `${e.description} ${e.category}`.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatches = filterCategory === 'all' || e.category === filterCategory;
    return textMatches && categoryMatches;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Compute stats of general expenses
  const totalExpensesSum = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-205 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-red-600" /> Registro de Despesas Fixas e Avulsas
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Gerencie parcelas de financiamento, aluguel de veículo, seguro de terceiros, planos de internet de mapas e lava-jato.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-slate-905 hover:bg-slate-950 bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl px-4 py-2.5 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Lançar Despesa
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-red-700">Somatório das Despesas Filtradas</span>
            <p className="text-2xl font-black text-red-800 font-mono mt-0.5">R$ {totalExpensesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[9px] text-red-600 font-medium">Equivale à soma do histórico listado abaixo</p>
          </div>
          <DollarSign className="w-10 h-10 text-red-400 opacity-60" />
        </div>
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">Total de Registros Lançados</span>
            <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{filteredExpenses.length} Lançamentos</p>
            <p className="text-[9px] text-slate-500 font-medium">Comprovantes guardados para dedução</p>
          </div>
          <Receipt className="w-10 h-10 text-slate-400 opacity-60" />
        </div>
      </div>

      {/* CONTROLS (SEARCH & CATEGORY MAPPING) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-210">
        <div className="col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquise por descrição ou categoria da despesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-red-600 focus:bg-white font-semibold"
          />
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-red-650"
          >
            <option value="all">Filtro: Todas as Categorias</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* EXPENSE LOG TABLE LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 text-[10px] uppercase">
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Descrição do Lançamento</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-4 text-center no-print w-20">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-705">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                  {/* Date */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                    {new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  
                  {/* Category badge */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase border ${
                      exp.category === 'Combustível' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      exp.category === 'Aluguel' || exp.category === 'Financiamento' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      exp.category === 'Seguro' ? 'bg-blue-50 text-blue-700 border-blue-105' :
                      exp.category === 'Manutenção' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      exp.category === 'Limpeza/Lava-jato' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                      'bg-slate-150/40 text-slate-600 border-slate-200'
                    }`}>
                      {exp.category}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-800">
                    {exp.description || 'Despesa Administrativa do Carro'}
                  </td>

                  {/* Value */}
                  <td className="py-3.5 px-4 text-right font-mono font-black text-red-650">
                    R$ {exp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-center no-print">
                    {deletingId === exp.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteExpense(exp.id);
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
                          setDeletingId(exp.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-md transition cursor-pointer inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                  <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto mb-2" />
                  Nenhuma despesa administrativa cadastrada com estes termos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FOR NEW EXPENSE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl overflow-hidden block">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Lançar Nova Despesa de Carro</h4>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-extrabold text-sm uppercase cursor-pointer"
              >
                X
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 text-xs space-y-4">
              
              {/* Date */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Data da Compra</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-red-600 font-mono"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-red-600"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Descrição / Estabelecimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mensalidade Localiza Aluguel do Carro..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-red-600"
                />
              </div>

              {/* Value */}
              <div>
                <label className="text-slate-600 font-bold block mb-1">Valor da Despesa (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.1"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-black rounded-xl focus:outline-red-600 font-mono text-base text-red-650"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition cursor-pointer text-center"
                >
                  Confirmar Lançamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
