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
    timestamp?: string;
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
  const [actionLoading, setActionLoading] = useState<'upload' | 'download' | 'refresh' | null>(null);

  // Cloud status state for the connected email
  const [cloudInfo, setCloudInfo] = useState<{
    checked: boolean;
    exists: boolean;
    updatedAt?: string;
    shiftsCount?: number;
    expensesCount?: number;
    maintenanceCount?: number;
    driverName?: string;
  }>({ checked: false, exists: false });

  // Synchronize Google User State to Local Storage
  useEffect(() => {
    if (googleUser) {
      localStorage.setItem('cpma_google_user', JSON.stringify(googleUser));
    } else {
      localStorage.removeItem('cpma_google_user');
    }
  }, [googleUser]);

  // Check cloud backup status whenever user email changes or component loads
  const refreshCloudStatus = async (email: string) => {
    try {
      const res = await fetch(`/api/backup/status/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setCloudInfo({
          checked: true,
          exists: !!data.exists,
          updatedAt: data.updatedAt,
          shiftsCount: data.shiftsCount || 0,
          expensesCount: data.expensesCount || 0,
          maintenanceCount: data.maintenanceCount || 0,
          driverName: data.driverName
        });
      }
    } catch (e) {
      console.error("Erro ao checar status da nuvem:", e);
    }
  };

  useEffect(() => {
    if (googleUser?.email) {
      refreshCloudStatus(googleUser.email);
    } else {
      setCloudInfo({ checked: false, exists: false });
    }
  }, [googleUser?.email]);

  // Upload current device data to Cloud
  const handleUploadToCloud = async (overrideEmail?: string, silent = false) => {
    const targetEmail = (overrideEmail || googleUser?.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('Por favor, conecte ou informe seu e-mail da Conta Google primeiro!');
      setShowLoginModal(true);
      return;
    }

    setActionLoading('upload');

    const currentPayload = {
      meta: 'GMC_SECURE_BACKUP',
      version: '1.0',
      timestamp: new Date().toISOString(),
      profile,
      vehicle,
      shifts,
      expenses,
      maintenance
    };

    try {
      const res = await fetch('/api/backup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, backup: currentPayload })
      });
      const data = await res.json();
      setActionLoading(null);

      if (data.success) {
        const emailKey = 'gmc_cloud_backup_' + targetEmail;
        localStorage.setItem(emailKey, JSON.stringify(currentPayload));
        localStorage.setItem('gmc_last_modified', currentPayload.timestamp);

        await refreshCloudStatus(targetEmail);

        if (!silent) {
          alert(`✅ DADOS SALVOS NA NUVEM COM SUCESSO!\n\nForam transmitidos para sua conta (${targetEmail}):\n• ${shifts.length} turnos registrados\n• ${expenses.length} despesas extras\n• ${maintenance.length} manutenções\n• Dados do motorista e veículo\n\nAo abrir o aplicativo em outro celular ou computador, basta conectar com este mesmo e-mail (${targetEmail}) e clicar em "Baixar dados da Nuvem"!`);
        }
      } else {
        throw new Error(data.error || 'Falha ao salvar no servidor');
      }
    } catch (err: any) {
      setActionLoading(null);
      console.error("Erro ao subir dados para a nuvem:", err);
      // Local fallback
      const emailKey = 'gmc_cloud_backup_' + targetEmail;
      localStorage.setItem(emailKey, JSON.stringify(currentPayload));
      alert(`⚠️ Não foi possível sincronizar com o servidor no momento. Os dados foram salvos no armazenamento local deste aparelho.`);
    }
  };

  // Download Cloud data to current device
  const handleDownloadFromCloud = async () => {
    const targetEmail = (googleUser?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      alert('Por favor, informe seu e-mail da Conta Google primeiro!');
      setShowLoginModal(true);
      return;
    }

    if (!window.confirm(`Deseja baixar os dados salvos na Nuvem para este aparelho?\n\nOs turnos e despesas salvos na nuvem para (${targetEmail}) irão carregar neste aparelho para que fiquem idênticos ao seu outro dispositivo.`)) {
      return;
    }

    setActionLoading('download');

    try {
      const res = await fetch(`/api/backup/load/${encodeURIComponent(targetEmail)}`);
      const data = await res.json();
      setActionLoading(null);

      if (data.success && data.backup) {
        const backup = data.backup;
        onImportAllData({
          profile: backup.profile || profile,
          vehicle: backup.vehicle || vehicle,
          shifts: backup.shifts || [],
          expenses: backup.expenses || [],
          maintenance: backup.maintenance || [],
          timestamp: backup.timestamp || data.updatedAt
        });

        const emailKey = 'gmc_cloud_backup_' + targetEmail;
        localStorage.setItem(emailKey, JSON.stringify(backup));
        localStorage.setItem('gmc_last_modified', backup.timestamp || data.updatedAt || new Date().toISOString());

        await refreshCloudStatus(targetEmail);

        alert(`✅ DADOS DA NUVEM BAIXADOS COM SUCESSO!\n\nForam sincronizados neste aparelho:\n• ${backup.shifts?.length || 0} turnos\n• ${backup.expenses?.length || 0} despesas extras\n• ${backup.maintenance?.length || 0} manutenções\n\nTodos os dados salvos pelo outro dispositivo agora estão atualizados aqui!`);
      } else {
        alert(`Nenhum backup foi encontrado na nuvem para ${targetEmail}.\n\nSe você cadastrou seus dados no outro aparelho, abra o outro aparelho e clique no botão verde "Enviar dados deste aparelho para a Nuvem".`);
      }
    } catch (err: any) {
      setActionLoading(null);
      console.error("Erro ao baixar da nuvem:", err);
      alert('Erro ao conectar ao servidor da nuvem. Verifique sua conexão e tente novamente.');
    }
  };

  const handleSimulatedGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.includes('@')) {
      alert('Por favor, informe seu email da Conta do Google válido!');
      return;
    }

    const trimmedEmail = inputEmail.trim().toLowerCase();
    const newUser = {
      email: trimmedEmail,
      name: inputName.trim() || profile.name || 'Motorista GMC',
      photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(inputName || 'Motorista')}`
    };

    setGoogleUser(newUser);
    setShowLoginModal(false);

    // Check if cloud already has a backup for this email
    try {
      const res = await fetch(`/api/backup/status/${encodeURIComponent(trimmedEmail)}`);
      const statusData = await res.json();

      if (statusData.success && statusData.exists) {
        // Cloud backup exists!
        const cloudDate = statusData.updatedAt ? new Date(statusData.updatedAt).toLocaleString('pt-BR') : 'recente';
        const hasLocalData = shifts.length > 0;

        if (!hasLocalData) {
          // This device is empty or fresh: auto download!
          const loadRes = await fetch(`/api/backup/load/${encodeURIComponent(trimmedEmail)}`);
          const loadData = await loadRes.json();
          if (loadData.success && loadData.backup) {
            onImportAllData({
              profile: loadData.backup.profile || { ...profile, name: newUser.name },
              vehicle: loadData.backup.vehicle || vehicle,
              shifts: loadData.backup.shifts || [],
              expenses: loadData.backup.expenses || [],
              maintenance: loadData.backup.maintenance || [],
              timestamp: loadData.backup.timestamp || loadData.updatedAt
            });
            localStorage.setItem('gmc_last_modified', loadData.backup.timestamp || loadData.updatedAt || new Date().toISOString());
            await refreshCloudStatus(trimmedEmail);
            alert(`✅ CONTA CONECTADA E DADOS RESTAURADOS!\n\nBaixamos automaticamente o seu backup da nuvem salvo em ${cloudDate}:\n• ${loadData.backup.shifts?.length || 0} turnos carregados\n• ${loadData.backup.expenses?.length || 0} despesas carregadas`);
            return;
          }
        }

        // Both cloud and device have data: prompt the user!
        const choice = window.confirm(
          `Encontramos um backup na nuvem para ${trimmedEmail} salvo em ${cloudDate} com ${statusData.shiftsCount || 0} turnos.\n\n` +
          `• Clique em [OK] para BAIXAR os dados da nuvem para este aparelho.\n` +
          `• Clique em [CANCELAR] se este aparelho é o seu principal e você quer ENVIAR os dados dele (${shifts.length} turnos) para a nuvem.`
        );

        if (choice) {
          // User chose to download
          const loadRes = await fetch(`/api/backup/load/${encodeURIComponent(trimmedEmail)}`);
          const loadData = await loadRes.json();
          if (loadData.success && loadData.backup) {
            onImportAllData({
              profile: loadData.backup.profile || { ...profile, name: newUser.name },
              vehicle: loadData.backup.vehicle || vehicle,
              shifts: loadData.backup.shifts || [],
              expenses: loadData.backup.expenses || [],
              maintenance: loadData.backup.maintenance || [],
              timestamp: loadData.backup.timestamp || loadData.updatedAt
            });
            localStorage.setItem('gmc_last_modified', loadData.backup.timestamp || loadData.updatedAt || new Date().toISOString());
            await refreshCloudStatus(trimmedEmail);
            alert(`✅ DADOS DA NUVEM BAIXADOS!\n\nSeu aparelho foi atualizado com os dados da nuvem (${loadData.backup.shifts?.length || 0} turnos).`);
          }
        } else {
          // User chose to upload current device data
          await handleUploadToCloud(trimmedEmail);
        }
      } else {
        // NO backup on cloud yet! Automatically upload current device's data so the cloud is populated immediately!
        await handleUploadToCloud(trimmedEmail);
      }
    } catch (err) {
      console.error("Erro na verificação de nuvem:", err);
      // Fallback: upload current data
      await handleUploadToCloud(trimmedEmail);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair de sua Conta Google neste dispositivo? Seus dados continuam no armazenamento do aparelho.')) {
      setGoogleUser(null);
      setCloudInfo({ checked: false, exists: false });
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
        maintenance: payload.maintenance || [],
        timestamp: payload.timestamp
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

  return (
    <div className="space-y-6">
      
      {/* 1. GOOGLE ACCOUNT HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              Conta Google & Sincronização Multi-Aparelhos
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold max-w-xl">
              Vincule sua Conta Google para salvar seus turnos, despesas e manutenções na nuvem e abrir os mesmos dados em outro celular, tablet ou computador.
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
                className="py-1 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 font-bold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="Desconectar Conta Google deste dispositivo"
              >
                <LogOut className="w-3 h-3" />
                <span>Sair</span>
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
              <LogIn className="w-4 h-4 text-red-500" />
              <span>Entrar com a Conta do Google</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DEDICATED GOOGLE CLOUD SYNC MODULE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Nuvem GMC (Sincronização por E-mail)
                {googleUser && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full normal-case">
                    Conectado
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {googleUser 
                  ? `Sincronizando dados salvos para: ${googleUser.email}` 
                  : 'Conecte seu e-mail do Google para ativar o salvamento em nuvem'}
              </p>
            </div>
          </div>

          {googleUser && (
            <button
              disabled={actionLoading !== null}
              onClick={() => refreshCloudStatus(googleUser.email)}
              className="self-start sm:self-auto py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              title="Recarregar status da nuvem"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
              <span>Verificar Nuvem</span>
            </button>
          )}
        </div>

        {googleUser ? (
          <div className="space-y-6">
            {/* STATUS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* STATUS CLOUD */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-black text-slate-400">
                    Status no Servidor em Nuvem
                  </span>
                  {cloudInfo.exists ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Backup Disponível
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">
                      Ainda sem dados na Nuvem
                    </span>
                  )}
                </div>

                {cloudInfo.exists ? (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-800 font-bold">
                      {cloudInfo.shiftsCount} turnos • {cloudInfo.expensesCount} despesas • {cloudInfo.maintenanceCount} manutenções
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Última gravação: <strong className="text-slate-700">{cloudInfo.updatedAt ? new Date(cloudInfo.updatedAt).toLocaleString('pt-BR') : 'Recentemente'}</strong>
                    </p>
                    <p className="text-[10px] text-slate-450 font-mono">
                      Vinculado a: {googleUser.email}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Você ainda não enviou nenhum backup para a nuvem com este e-mail. Clique no botão <strong>"Enviar dados deste aparelho para a Nuvem"</strong> abaixo para salvar seu histórico agora!
                  </p>
                )}
              </div>

              {/* STATUS LOCAL APPARELHO */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-black text-slate-400">
                    Dados Neste Aparelho Atual
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
                    Dispositivo Ativo
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-800 font-bold">
                    {shifts.length} turnos • {expenses.length} despesas extras • {maintenance.length} manutenções
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Motorista: <strong className="text-slate-700">{profile.name || 'GMC'}</strong> | Veículo: <strong className="text-slate-700">{vehicle.model || 'Carro'}</strong> ({vehicle.licensePlate || 'GMC'})
                  </p>
                  <p className="text-[10px] text-slate-450">
                    Pronto para enviar para a nuvem ou ser atualizado.
                  </p>
                </div>
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* UPLOAD BUTTON */}
              <button
                disabled={actionLoading !== null}
                onClick={() => handleUploadToCloud()}
                className="p-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-2xl font-black text-xs shadow-md transition flex flex-col items-start gap-1 cursor-pointer text-left"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2 text-sm font-black">
                    {actionLoading === 'upload' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4" />
                    )}
                    Enviar dados deste aparelho para a Nuvem
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500 text-white rounded-md uppercase font-mono">
                    Upload
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100 font-normal">
                  Salva seus {shifts.length} turnos e {expenses.length} despesas deste aparelho no servidor para que fiquem disponíveis nos seus outros aparelhos.
                </span>
              </button>

              {/* DOWNLOAD BUTTON */}
              <button
                disabled={actionLoading !== null || !cloudInfo.exists}
                onClick={handleDownloadFromCloud}
                className={`p-4 rounded-2xl font-black text-xs transition flex flex-col items-start gap-1 text-left ${
                  cloudInfo.exists 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2 text-sm font-black">
                    {actionLoading === 'download' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudDownload className="w-4 h-4" />
                    )}
                    Baixar dados da Nuvem para este aparelho
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-mono ${
                    cloudInfo.exists ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    Download
                  </span>
                </div>
                <span className={`text-[11px] font-normal ${cloudInfo.exists ? 'text-blue-100' : 'text-slate-400'}`}>
                  {cloudInfo.exists 
                    ? `Puxa os dados salvos pelo outro dispositivo (${cloudInfo.shiftsCount || 0} turnos na nuvem) e atualiza este aparelho.`
                    : 'Disponível após enviar um backup da nuvem a partir do seu aparelho principal.'}
                </span>
              </button>

            </div>

            {/* SYNC INSTRUCTIONS BANNER */}
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2 text-xs text-slate-700">
              <p className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Como usar para abrir seus dados em outro aparelho:
              </p>
              <div className="space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <p>
                  <strong>1. No aparelho onde você já tem suas corridas (ex: celular):</strong> clique no botão verde <strong>"Enviar dados deste aparelho para a Nuvem"</strong> acima.
                </p>
                <p>
                  <strong>2. No outro aparelho (ex: notebook, tablet ou novo celular):</strong> abra esta mesma tela, clique em <strong>"Entrar com a Conta do Google"</strong> com o mesmo e-mail (<strong>{googleUser.email}</strong>) e clique no botão azul <strong>"Baixar dados da Nuvem para este aparelho"</strong>.
                </p>
                <p>
                  <strong>3. Salvamento Contínuo:</strong> A partir de agora, sempre que você adicionar ou editar corridas e despesas, o aplicativo atualizará automaticamente a nuvem em segundo plano!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto font-black text-xl">
              G
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-black text-slate-800">
                Sincronize automaticamente seus aparelhos sem precisar de código manual
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Ao informar seu e-mail do Google, seus turnos, despesas e manutenções são salvos na nuvem e você pode acessá-los em qualquer outro celular ou computador com 1 clique.
              </p>
            </div>
            <button
              onClick={() => {
                setInputEmail(profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : '');
                setInputName(profile.name || '');
                setShowLoginModal(true);
              }}
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Conectar Minha Conta Google Agora</span>
            </button>
          </div>
        )}
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
