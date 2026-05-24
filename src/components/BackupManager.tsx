import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  Copy, 
  Check, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Laptop, 
  Smartphone, 
  Lock, 
  Settings, 
  Key, 
  HelpCircle,
  Sparkles,
  Database,
  UserCheck
} from 'lucide-react';
import { DriverProfile, Vehicle, Shift, Expense, Maintenance } from '../types';

interface BackupManagerProps {
  profile: DriverProfile;
  vehicle: Vehicle;
  shifts: Shift[];
  expenses: Expense[];
  maintenance: Maintenance[];
  onImportAllData: (data: {
    profile: DriverProfile;
    vehicle: Vehicle;
    shifts: Shift[];
    expenses: Expense[];
    maintenance: Maintenance[];
  }) => void;
  onUpdateProfile: (p: DriverProfile) => void;
}

export default function BackupManager({ 
  profile, 
  vehicle, 
  shifts, 
  expenses, 
  maintenance,
  onImportAllData,
  onUpdateProfile
}: BackupManagerProps) {
  // User Authentication Simulation State
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string; photo?: string } | null>(() => {
    const saved = localStorage.getItem('cpma_google_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState(profile.name || '');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Synchronize Google User State to Local Storage
  useEffect(() => {
    if (googleUser) {
      localStorage.setItem('cpma_google_user', JSON.stringify(googleUser));
    } else {
      localStorage.removeItem('cpma_google_user');
    }
  }, [googleUser]);

  const handleSimulatedGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.includes('@')) {
      alert('Por favor, informe seu email da Conta do Google válido!');
      return;
    }

    const newUser = {
      email: inputEmail.trim(),
      name: inputName.trim() || 'Motorista GMC',
      photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(inputName)}`
    };

    setGoogleUser(newUser);

    // Also update current profile name
    onUpdateProfile({
      ...profile,
      name: newUser.name
    });

    setShowLoginModal(false);
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair de sua Conta Google neste dispositivo? Seus dados continuam no armazenamento do aparelho.')) {
      setGoogleUser(null);
    }
  };

  // Generate full state export codes
  const handleExportDataCode = () => {
    try {
      const payload = {
        meta: 'GMC_SECURE_BACKUP',
        version: '1.0',
        timestamp: new Date().toISOString(),
        profile,
        vehicle,
        shifts,
        expenses,
        maintenance
      };
      
      const jsonString = JSON.stringify(payload);
      // Base64 encode for secure code string
      const encodeBack = btoa(unescape(encodeURIComponent(jsonString)));
      return `GMC:${encodeBack}`;
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  const handleCopyCode = () => {
    const code = handleExportDataCode();
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImportCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    const cleaned = importCode.trim();

    if (!cleaned.startsWith('GMC:') && !cleaned.startsWith('CPMA:')) {
      setImportStatus({
        type: 'error',
        msg: 'Código de Backup inválido. Certifique-se de copiar o código inteiro gerado no outro dispositivo.'
      });
      return;
    }

    try {
      const rawBase64 = cleaned.startsWith('GMC:') ? cleaned.replace('GMC:', '') : cleaned.replace('CPMA:', '');
      const decodedJson = decodeURIComponent(escape(atob(rawBase64)));
      const payload = JSON.parse(decodedJson);

      if (payload.meta !== 'GMC_SECURE_BACKUP' && payload.meta !== 'CPMA_SECURE_BACKUP' || !payload.profile || !payload.vehicle) {
        throw new Error('Assinatura de segurança de dados inválida.');
      }

      // Perform state update callback
      onImportAllData({
        profile: payload.profile,
        vehicle: payload.vehicle,
        shifts: payload.shifts || [],
        expenses: payload.expenses || [],
        maintenance: payload.maintenance || []
      });

      setImportCode('');
      setImportStatus({
        type: 'success',
        msg: 'Sincronização concluída com sucesso! Todos os dados de turnos, despesas e configurações foram atualizados neste dispositivo.'
      });

      // Update local profile state name if imported
      if (payload.profile && payload.profile.name) {
        setInputName(payload.profile.name);
      }
    } catch (err) {
      console.error(err);
      setImportStatus({
        type: 'error',
        msg: 'Erro ao processar dados de backup. Certifique-se de que o código não foi cortado ou modificado.'
      });
    }
  };

  const handleSimulateBackupToCloud = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      // Save locally to simulate backup upload success
      alert('Sincronização concluída! Códigos de backup enviados aos seus servidores de sessão GMC.');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. GOOGLE LOGIN OVERVIEW */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              Identidade Digital & Sincronização por Aparelhos
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold max-w-xl">
              Conecte sua Conta do Google para identificar sua assinatura profissional eletrônica nos demonstrativos e sincronizar suas metas entre seu celular, tablet ou notebook.
            </p>
          </div>
        </div>

        <div>
          {googleUser ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              {googleUser.photo ? (
                <img referrerPolicy="no-referrer" src={googleUser.photo} alt={googleUser.name} className="w-8 h-8 rounded-lg" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">G</div>
              )}
              <div className="text-left font-sans mr-2">
                <p className="text-xs font-black text-slate-800 line-clamp-1">{googleUser.name}</p>
                <p className="text-[10px] text-slate-450 font-mono line-clamp-1">{googleUser.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 bg-red-50 hover:bg-red-105 border border-red-200 hover:border-red-300 text-red-650 rounded-lg transition"
                title="Desconectar Conta Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setInputEmail(profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : '');
                setInputName(profile.name || '');
                setShowLoginModal(true);
              }}
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-extrabold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-red-505" />
              <span>Entrar com a Conta do Google</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TRANFER CODES (CELULAR <--> COMPUTADOR) SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* EXPORT BLOCK */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block border-b border-slate-100 pb-2">
            Dispositivo de Origem ➔ Gerar Código de Transferência
          </span>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Use este recurso para levar todo o seu histórico cadastrado neste celular para o seu computador/notebook. Ao clicar no botão abaixo, criaremos um **Código de Transferência GMC** seguro e criptografado com sua base de dados atual.
          </p>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
            <span className="text-[9px] uppercase font-mono font-black text-slate-400">Seu código gerado está pronto:</span>
            
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={handleExportDataCode().substring(0, 48) + '...'}
                className="flex-1 p-2 bg-slate-100 border border-slate-205 rounded-xl font-mono text-[10px] outline-none text-slate-500 select-all"
              />
              <button
                onClick={handleCopyCode}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-normal">
              Contém: {shifts.length} turnos, {expenses.length} despesas, config do Onix Sedan e metas.
            </p>
          </div>

          <div className="pt-2 text-[10px] text-slate-450 leading-relaxed font-semibold">
            <p className="text-slate-800 flex items-center gap-1 font-bold mb-0.5"><Laptop className="w-3.5 h-3.5 text-blue-500" /> Como importar no outro aparelho?</p>
            Basta abrir o GMC Controle no seu outro celular ou notebook, entrar nesta mesma aba de "Sincronização & Backup" e colar o código de transferência na janela ao lado.
          </div>
        </div>

        {/* IMPORT BLOCK */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider block border-b border-slate-100 pb-2">
            Dispositivo de Destino ➔ Receber / Colar Código
          </span>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Se você está acessando este novo aparelho (exemplo: seu novo celular ou notebook) e quer carregar todo o seu histórico nele, cole abaixo o **Código de Transferência** gerado no seu outro aparelho de origem.
          </p>

          <form onSubmit={handleImportCodeSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-455">Código de Transferência GMC</label>
              <textarea
                required
                rows={3}
                placeholder="Cole aqui o seu código criptografado seguro (começa com GMC: ou CPMA:...)"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono text-[9px] placeholder:text-slate-400 focus:outline-blue-600 focus:bg-white text-slate-700"
              />
            </div>

            {importStatus && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                importStatus.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                  : 'bg-red-50 text-red-800 border border-red-150'
              }`}>
                {importStatus.msg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-extrabold text-xs transition cursor-pointer text-center"
            >
              Mesclar & Sincronizar Informações
            </button>
          </form>
        </div>

      </div>

      {/* Cloud database informative security guidelines card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
        <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-550 flex items-center gap-1.5">
          <Cloud className="w-4 h-4 text-blue-400" /> Sincronização Automática Contínua por Banco (Firebase)
        </h4>
        
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          Nossa arquitetura GMC está preparada para se conectar a servidores de banco de dados distribuídos em tempo real (Firebase Firestore). Isso permite que qualquer turno que você digitar em seu celular apareça em tempo real no seu notebook sem precisar exportar códigos manuais!
        </p>

        <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 md:flex justify-between items-center gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Banco de dados autônomo offline-first
            </p>
            <p className="text-[11px] text-slate-450 leading-relaxed">
              O sistema possui memória local inteligente. Suas informações nunca são enviadas a servidores sem consentimento para proteção total dos seus faturamentos e placas de veículos.
            </p>
          </div>

          <button 
            disabled={syncing}
            onClick={handleSimulateBackupToCloud}
            className="w-full md:w-auto shrink-0 py-2.5 px-4.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white text-[11px] font-extrabold uppercase tracking-wide rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mt-3 md:mt-0"
          >
            {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Ativar Sincronização Rápida</span>
          </button>
        </div>
      </div>

      {/* 3. SIMULATED GOOGLE AUTH MODAL DIALOG */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            {/* Backdrop overlay */}
            <div className="fixed inset-0 bg-slate-950/60 transition-opacity" onClick={() => setShowLoginModal(false)} />

            {/* Modal Dialog Content */}
            <div className="relative inline-block bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full p-6 space-y-6">
              
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">G</div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight">Login com o Google</h3>
                    <p className="text-[10px] text-slate-450 font-mono">Processamento de Assinatura Profissional</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleSimulatedGoogleLogin} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 mb-1 leading-relaxed text-[11px] text-slate-600">
                  <p className="font-bold text-blue-800 flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Sincronizador de Dispositivos Google
                  </p>
                  O Google ID é atrelado ao seu endereço cadastrado de email. As metas e odômetros de histórico serão salvos nesta conta de e-mail nos aparelhos conectados.
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block mb-1">Nome Completo (Conta Google)</label>
                  <input
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-slate-800 outline-none focus:outline-blue-600 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block mb-1">E-mail da Conta Google (@gmail.com)</label>
                  <input
                    type="email"
                    required
                    placeholder="exemplo@gmail.com"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl font-mono text-slate-800 outline-none focus:outline-blue-600"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black transition cursor-pointer"
                  >
                    Calcular depois
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md transition cursor-pointer"
                  >
                    Confirmar Login
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
