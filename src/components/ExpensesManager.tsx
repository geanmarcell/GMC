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
import { Expense, ExpenseCategory, DriverProfile } from '../types';

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense?: (expense: Expense) => void;
  profile?: DriverProfile;
  onUpdateProfile?: (profile: DriverProfile) => void;
}

export default function ExpensesManager({ 
  expenses, 
  onAddExpense, 
  onDeleteExpense, 
  onUpdateExpense,
  profile,
  onUpdateProfile
}: ExpensesManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // New Expense Form States
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>('Outros');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number>(50.00);

  // Custom categories setup
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [localCustomCategories, setLocalCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('gmc_fallback_custom_categories');
    return saved ? JSON.parse(saved) : [];
  });

  const defaultCategories: string[] = [
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

  const customCategoriesList = profile?.customCategories ?? localCustomCategories;
  const categories: ExpenseCategory[] = [
    ...defaultCategories,
    ...customCategoriesList
  ];

  const handleStartEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setDescription(exp.description);
    setValue(exp.value);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingExpense(null);
    setDate(new Date().toISOString().substring(0, 10));
    setCategory('Outros');
    setDescription('');
    setValue(50.00);
    setShowNewCatInput(false);
    setNewCatName('');
  };

  const handleAddCustomCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (defaultCategories.includes(trimmed) || customCategoriesList.includes(trimmed)) {
      alert("Esta categoria já existe!");
      return;
    }

    if (onUpdateProfile && profile) {
      const updatedCustom = [...(profile.customCategories || []), trimmed];
      onUpdateProfile({
        ...profile,
        customCategories: updatedCustom
      });
    } else {
      const updatedLocal = [...localCustomCategories, trimmed];
      setLocalCustomCategories(updatedLocal);
      localStorage.setItem('gmc_fallback_custom_categories', JSON.stringify(updatedLocal));
    }

    setCategory(trimmed);
    setNewCatName('');
    setShowNewCatInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (value <= 0) {
      alert("Erro: O valor da despesa deve ser maior que zero!");
      return;
    }

    if (editingExpense) {
      const updatedExpense: Expense = {
        ...editingExpense,
        date,
        category,
        description,
        value: Number(value)
      };
      if (onUpdateExpense) {
        onUpdateExpense(updatedExpense);
      }
    } else {
      const newExpense: Expense = {
        id: 'e-' + Math.random().toString(36).substring(2, 9),
        date,
        category,
        description,
        value: Number(value)
      };
      onAddExpense(newExpense);
    }

    handleCloseModal();
  };

  // Extract all unique YYYY-MM from expenses to build options dynamically
  const uniqueMonths = Array.from(
    new Set([
      new Date().toISOString().substring(0, 7), // Ensure current month is always an option
      ...expenses.map(e => e.date.substring(0, 7))
    ])
  ).sort((a, b) => b.localeCompare(a));

  const formatMonthYearLabel = (yM: string) => {
    const [year, month] = yM.split('-');
    const monthsPt = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthsPt[parseInt(month) - 1]} de ${year}`;
  };

  // Filter & Search
  const filteredExpenses = expenses.filter(e => {
    const textMatches = `${e.description} ${e.category}`.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatches = filterCategory === 'all' || e.category === filterCategory;
    const monthMatches = filterMonth === 'all' || e.date.startsWith(filterMonth);
    return textMatches && categoryMatches && monthMatches;
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

      {/* CONTROLS (SEARCH & CATEGORY MAPPING & MONTH FILTER) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-210">
        <div className="md:col-span-2 relative">
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
        <div>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-red-650"
          >
            <option value="all">Filtro: Todos os Meses</option>
            {uniqueMonths.map(m => (
              <option key={m} value={m}>{formatMonthYearLabel(m)}</option>
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
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(exp)}
                        className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 hover:bg-blue-100 rounded-md transition cursor-pointer inline-flex items-center justify-center"
                        title="Editar Despesa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setExpenseToDelete(exp)}
                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-md transition cursor-pointer inline-flex items-center justify-center"
                        title="Excluir Despesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* MODAL FOR NEW OR EDIT EXPENSE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl overflow-hidden block">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {editingExpense ? 'Editar Despesa Lançada' : 'Lançar Nova Despesa de Carro'}
                </h4>
              </div>
              <button 
                type="button"
                onClick={handleCloseModal}
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
                {!showNewCatInput ? (
                  <>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl focus:outline-red-600"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="flex justify-end items-center mt-1">
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(true)}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold hover:underline cursor-pointer flex items-center gap-1 p-1 bg-blue-50/50 rounded-md"
                      >
                        <Plus className="w-2.5 h-2.5 text-blue-600" /> Cadastrar Outra Categoria...
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 mt-1">
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Nova Categoria de Despesa</p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Ex: Pedágio, Licenciamento..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-red-600"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Gravar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCatInput(false);
                          setNewCatName('');
                        }}
                        className="py-2 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        X
                      </button>
                    </div>
                  </div>
                )}
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
                  onClick={handleCloseModal}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition cursor-pointer text-center"
                >
                  {editingExpense ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL FOR CONFIRM DELETION */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm shadow-xl overflow-hidden block">
            <div className="px-6 py-4 bg-red-650 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Confirmar Exclusão</h4>
              </div>
              <button 
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="text-white/80 hover:text-white font-extrabold text-sm uppercase cursor-pointer"
              >
                X
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-600">
                Tem certeza de que deseja excluir permanentemente esta despesa lançada? Esta ação não poderá ser desfeita.
              </p>
              
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Data:</span>
                  <span className="font-mono font-bold">{new Date(expenseToDelete.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Categoria:</span>
                  <span className="font-extrabold text-slate-800">{expenseToDelete.category}</span>
                </div>
                {expenseToDelete.description && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Descrição:</span>
                    <span className="font-medium text-slate-800 max-w-[200px] truncate text-right">{expenseToDelete.description}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-200">
                  <span className="font-bold text-red-600">Valor:</span>
                  <span className="font-mono font-black text-red-650">R$ {expenseToDelete.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteExpense(expenseToDelete.id);
                    setExpenseToDelete(null);
                  }}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition cursor-pointer text-center"
                >
                  Excluir Despesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
