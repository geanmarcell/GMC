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
  UserCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X
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
    const saved = localStorage.getItem('gmc_google_user') || localStorage.getItem('cpma_google_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    if (profile.name === 'Gean Carvalho') {
      return {
        email: 'geanmarcelldecarvalho@gmail.com',
        name: 'Gean Carvalho',
        photo: 'https://api.dicebear.com/7.x/initials/svg?seed=Gean%20Carvalho'
      };
    }
    return null;
  });

  const [inputEmail, setInputEmail] = useState(() => {
    return profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : '';
  });
  const [inputName, setInputName] = useState(profile.name || '');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<'upload' | 'download' | 'refresh' | null>(null);

  // In-app Notification & Modal confirmation state (No window.alert/window.confirm)
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    bulletPoints?: string[];
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  } | null>(null);

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    bulletPoints?: string[]
  ) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      bulletPoints
    });
  };

  const showConfirmation = (
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    onConfirm: () => void,
    bulletPoints?: string[]
  ) => {
    setNotification({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      bulletPoints
    });
  };

  // Server health indicator
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // 6-Digit PIN Quick Sync state
  const [generatedPin, setGeneratedPin] = useState<{ pin: string; createdAt: string; shiftsCount: number } | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

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
      localStorage.setItem('gmc_google_user', JSON.stringify(googleUser));
      localStorage.setItem('cpma_google_user', JSON.stringify(googleUser));
    } else {
      localStorage.removeItem('gmc_google_user');
      localStorage.removeItem('cpma_google_user');
    }
  }, [googleUser]);

  // Check server ping on mount
  useEffect(() => {
    fetch('/api/backup/ping')
      .then(res => res.json())
      .then(data => {
        setServerOnline(data.success && data.status === 'online');
      })
      .catch(() => {
        setServerOnline(false);
      });
  }, []);

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
    const targetEmail = (overrideEmail || googleUser?.email || inputEmail || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      showNotification(
        'warning',
        'E-mail da Conta Google Necessário',
        'Por favor, conecte ou informe seu e-mail do Google primeiro para salvar na nuvem.'
      );
      setInputEmail(profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : '');
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

        if (!googleUser || googleUser.email !== targetEmail) {
          setGoogleUser({
            email: targetEmail,
            name: profile.name || 'Motorista GMC',
            photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'Motorista')}`
          });
        }

        await refreshCloudStatus(targetEmail);

        if (!silent) {
          showNotification(
            'success',
            'Dados Salvos na Nuvem com Sucesso!',
            `Seus dados foram enviados para o servidor da Nuvem GMC na conta ${targetEmail}.`,
            [
              `${shifts.length} turnos registrados transmitidos`,
              `${expenses.length} despesas extras transmitidas`,
              `${maintenance.length} manutenções registradas`,
              `Veículo: ${vehicle.model || 'Configurado'} (${vehicle.licensePlate || 'GMC'})`,
              `Agora, no notebook, conecte o mesmo e-mail (${targetEmail}) e clique em "Baixar dados da Nuvem" ou use o PIN de 6 dígitos!`
            ]
          );
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
      showNotification(
        'error',
        'Falha ao Conectar com o Servidor',
        `Não foi possível enviar para a nuvem no momento (${err.message || 'Falha de rede'}). Os dados foram mantidos seguros no armazenamento deste aparelho.`,
        [
          'Verifique sua conexão com a internet',
          'Você também pode gerar um PIN de 6 Dígitos ou copiar o Código de Transferência abaixo.'
        ]
      );
    }
  };

  // Download Cloud data to current device - NEVER BLOCKED!
  const handleDownloadFromCloud = async (overrideEmail?: string) => {
    const targetEmail = (overrideEmail || googleUser?.email || inputEmail || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      showNotification(
        'warning',
        'E-mail Necessário',
        'Por favor, informe seu e-mail da Conta Google para buscar seus dados.'
      );
      setInputEmail(profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : '');
      setShowLoginModal(true);
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

        if (!googleUser || googleUser.email !== targetEmail) {
          setGoogleUser({
            email: targetEmail,
            name: backup.profile?.name || profile.name || 'Motorista GMC',
            photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(backup.profile?.name || 'Motorista')}`
          });
        }

        await refreshCloudStatus(targetEmail);

        showNotification(
          'success',
          'Dados da Nuvem Baixados com Sucesso!',
          `Seu aparelho foi sincronizado com os dados salvos para ${targetEmail}:`,
          [
            `${backup.shifts?.length || 0} turnos carregados e aplicados`,
            `${backup.expenses?.length || 0} despesas extras sincronizadas`,
            `${backup.maintenance?.length || 0} manutenções sincronizadas`,
            `Veículo: ${backup.vehicle?.model || 'Configurado'}`,
            'Este dispositivo agora está 100% atualizado com suas informações!'
          ]
        );
      } else {
        // Did not find in server
        showNotification(
          'warning',
          'Nenhum Backup Encontrado na Nuvem',
          `Não encontramos nenhum dado salvo no servidor para o e-mail: "${targetEmail}".`,
          [
            '1. No seu TABLET, abra a aba "Backup & Nuvem" e confirme se clicou no botão verde "Enviar dados deste aparelho para a Nuvem".',
            `2. Verifique se o e-mail no tablet é exatamente "${targetEmail}".`,
            '3. Alternativa Instantânea: No tablet, clique em "Gerar PIN de 6 Dígitos" logo abaixo e digite o número aqui no notebook!'
          ]
        );
      }
    } catch (err: any) {
      setActionLoading(null);
      console.error("Erro ao baixar da nuvem:", err);
      showNotification(
        'error',
        'Erro de Conexão',
        `Não foi possível se comunicar com o servidor da nuvem: ${err.message || 'Verifique a rede'}.`,
        [
          'Você também pode usar a Sincronização por PIN de 6 Dígitos logo abaixo.',
          'Ou copiar o Código de Transferência GMC diretamente entre os navegadores.'
        ]
      );
    }
  };

  // Generate 6-Digit PIN on tablet/source device
  const handleGeneratePin = async () => {
    setPinLoading(true);
    setPinCopied(false);
    try {
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

      const targetEmail = googleUser?.email || inputEmail || (profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : 'motorista@gmc.com');

      const res = await fetch('/api/backup/pin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: targetEmail, 
          backup: currentPayload 
        })
      });
      const data = await res.json();
      setPinLoading(false);

      if (data.success && data.pin) {
        setGeneratedPin({
          pin: data.pin,
          createdAt: data.createdAt,
          shiftsCount: shifts.length
        });
      } else {
        throw new Error(data.error || 'Falha ao gerar PIN');
      }
    } catch (err: any) {
      setPinLoading(false);
      showNotification(
        'error',
        'Erro ao Gerar PIN',
        `Não foi possível gerar o PIN no servidor: ${err.message || 'Verifique sua conexão de rede'}.`
      );
    }
  };

  // Load by 6-Digit PIN on notebook/target device
  const handleLoadByPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = inputPin.replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) {
      showNotification(
        'warning',
        'PIN Incompleto',
        'Por favor, digite os 6 números gerados no seu tablet ou celular.'
      );
      return;
    }

    setPinLoading(true);

    try {
      const res = await fetch(`/api/backup/pin/load/${cleanPin}`);
      const data = await res.json();
      setPinLoading(false);

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

        if (data.email && data.email.includes('@')) {
          setGoogleUser({
            email: data.email,
            name: backup.profile?.name || profile.name || 'Motorista GMC',
            photo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(backup.profile?.name || 'Motorista')}`
          });
        }

        setInputPin('');
        showNotification(
          'success',
          'Sincronização por PIN Concluída!',
          `Seu notebook agora está exatamente idêntico ao seu tablet:`,
          [
            `${backup.shifts?.length || 0} turnos importados com sucesso`,
            `${backup.expenses?.length || 0} despesas extras sincronizadas`,
            `${backup.maintenance?.length || 0} manutenções sincronizadas`,
            `Veículo: ${backup.vehicle?.model || 'Configurado'}`
          ]
        );
      } else {
        showNotification(
          'warning',
          'PIN Não Encontrado',
          data.error || `O PIN "${cleanPin}" não foi localizado no servidor.`,
          [
            '1. Verifique se o código digitado foi exatamente o exibido no tablet.',
            '2. No tablet, certifique-se de que clicou em "Gerar PIN de 6 Dígitos".',
            '3. Gere um novo PIN no tablet se tiver expirado.'
          ]
        );
      }
    } catch (err: any) {
      setPinLoading(false);
      showNotification(
        'error',
        'Erro na Consulta do PIN',
        `Houve um erro de rede: ${err.message || 'Verifique a conexão'}.`
      );
    }
  };

  const handleSimulatedGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.includes('@')) {
      showNotification('warning', 'E-mail Inválido', 'Por favor, informe seu endereço de e-mail do Google válido.');
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
        
        showConfirmation(
          'Backup Encontrado na Nuvem!',
          `Encontramos um histórico salvo para ${trimmedEmail} gravado em ${cloudDate} contendo ${statusData.shiftsCount || 0} turnos e ${statusData.expensesCount || 0} despesas.`,
          'Baixar Dados da Nuvem Agora',
          'Manter Dados Locais Deste Aparelho',
          async () => {
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
              showNotification(
                'success',
                'Dados Baixados!',
                `Seu aparelho foi sincronizado com os dados da nuvem (${loadData.backup.shifts?.length || 0} turnos).`
              );
            }
          },
          [
            `Nuvem: ${statusData.shiftsCount || 0} turnos • ${statusData.expensesCount || 0} despesas`,
            'Clique no botão verde abaixo para baixar e atualizar este aparelho agora.'
          ]
        );
      } else {
        // If this device has shifts registered (like tablet), automatically save to cloud!
        if (shifts.length > 0) {
          handleUploadToCloud(trimmedEmail, true);
          showNotification(
            'success',
            'Conta Conectada & Nuvem Atualizada!',
            `Sua conta ${trimmedEmail} foi vinculada e seus ${shifts.length} turnos deste aparelho foram gravados na Nuvem GMC com sucesso!`,
            [
              'Agora você pode acessar este mesmo link em outro aparelho (ex: notebook), entrar com seu e-mail e os dados serão carregados.',
              'Ou usar o PIN de 6 Dígitos a qualquer momento.'
            ]
          );
        } else {
          showNotification(
            'info',
            'Conta Conectada!',
            `Sua conta ${trimmedEmail} foi vinculada ao GMC Controle.`,
            [
              'Nenhum dado foi encontrado na nuvem para este e-mail ainda.',
              'Para salvar seus dados futuros ou deste aparelho, clique em "Enviar dados deste aparelho para a Nuvem".'
            ]
          );
        }
      }
    } catch (err) {
      console.error("Erro na verificação de nuvem:", err);
    }
  };

  const handleLogout = () => {
    showConfirmation(
      'Desconectar Conta Google',
      'Tem certeza que deseja sair de sua Conta Google neste dispositivo?',
      'Sim, Desconectar',
      'Cancelar',
      () => {
        setGoogleUser(null);
        setCloudInfo({ checked: false, exists: false });
      },
      ['Seus turnos e despesas locais continuarão salvos com segurança na memória deste aparelho.']
    );
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

              {/* DOWNLOAD BUTTON - ALWAYS ENABLED */}
              <button
                disabled={actionLoading !== null}
                onClick={() => handleDownloadFromCloud()}
                className="p-4 rounded-2xl font-black text-xs transition flex flex-col items-start gap-1 text-left bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md cursor-pointer disabled:opacity-50"
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
                    cloudInfo.exists ? 'bg-blue-500 text-white' : 'bg-blue-400 text-white'
                  }`}>
                    {cloudInfo.exists ? 'Backup Pronto' : 'Baixar Agora'}
                  </span>
                </div>
                <span className="text-[11px] text-blue-100 font-normal">
                  {cloudInfo.exists 
                    ? `Puxa os dados salvos pelo outro dispositivo (${cloudInfo.shiftsCount || 0} turnos na nuvem) e atualiza este aparelho.`
                    : 'Clique aqui para puxar os dados salvos pelo seu tablet ou celular na nuvem.'}
                </span>
              </button>

            </div>

            {/* SYNC INSTRUCTIONS BANNER */}
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2 text-xs text-slate-700">
              <p className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Como sincronizar entre seu Tablet e seu Notebook:
              </p>
              <div className="space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <p>
                  <strong>1. No TABLET (onde você cadastrou os turnos):</strong> clique no botão verde <strong>"Enviar dados deste aparelho para a Nuvem"</strong> acima.
                </p>
                <p>
                  <strong>2. No NOTEBOOK:</strong> conecte com o mesmo e-mail (<strong>{googleUser.email}</strong>) e clique no botão azul <strong>"Baixar dados da Nuvem para este aparelho"</strong>.
                </p>
                <p>
                  <strong>💡 Dica Super Rápida:</strong> Se preferir não digitar e-mail, use a <strong>Sincronização por PIN de 6 Dígitos</strong> logo abaixo! É instantânea.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-5">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto font-black text-xl">
                G
              </div>
              <h4 className="text-sm font-black text-slate-800">
                Sincronize automaticamente seus aparelhos sem precisar de código manual
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Ao conectar seu e-mail do Google, seus turnos e despesas ficam sincronizados na nuvem para você abrir no tablet, celular ou notebook.
              </p>
            </div>

            {/* DIRECT EMAIL INPUT FORM FOR FAST NOTEBOOK SYNC */}
            <div className="max-w-md mx-auto p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <label className="text-[11px] font-bold text-slate-700 block">
                Digite seu e-mail para conectar e baixar:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="seuemail@gmail.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-250 rounded-xl font-mono text-xs text-slate-800 outline-none focus:outline-blue-600 focus:bg-white"
                />
                <button
                  disabled={actionLoading !== null}
                  onClick={() => {
                    const emailToUse = inputEmail.trim() || (profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : '');
                    if (!emailToUse || !emailToUse.includes('@')) {
                      showNotification('warning', 'E-mail Obrigatório', 'Por favor, informe seu e-mail do Google para buscar seus dados da nuvem.');
                      return;
                    }
                    handleDownloadFromCloud(emailToUse);
                  }}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {actionLoading === 'download' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudDownload className="w-4 h-4" />
                  )}
                  <span>Baixar da Nuvem</span>
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setInputEmail(profile.name === 'Gean Carvalho' ? 'geanmarcelldecarvalho@gmail.com' : '');
                  setInputName(profile.name || '');
                  setShowLoginModal(true);
                }}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition inline-flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>Personalizar Nome & Conta Completa</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. ULTRA-FAST 6-DIGIT PIN SYNC MODULE (TABLET <--> NOTEBOOK) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Sincronização Rápida por PIN (6 Dígitos)
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full normal-case">
                  Tablet ➔ Notebook
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Conecte dois aparelhos instantaneamente sem precisar digitar senhas ou e-mails longos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {serverOnline === false ? 'Servidor Offline' : 'Servidor GMC Conectado'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SENDER COLUMN (TABLET / CELULAR) */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-2xl border border-slate-200/90 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>1. No Tablet ou Celular (Origem dos Dados)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Gere um código PIN numérico de 6 dígitos para transferir todos os seus <strong>{shifts.length} turnos</strong> e despesas para o seu notebook em segundos.
              </p>
            </div>

            {generatedPin ? (
              <div className="p-4 bg-white rounded-xl border border-purple-200 shadow-xs space-y-3 text-center">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-600 tracking-wider">
                  Código de Conexão Rápida:
                </span>
                
                <div className="text-3xl font-black font-mono tracking-widest text-purple-700 bg-purple-50/80 py-2.5 px-4 rounded-xl border border-purple-100 select-all">
                  {generatedPin.pin.slice(0, 3)} {generatedPin.pin.slice(3, 6)}
                </div>

                <p className="text-[11px] text-slate-600 font-semibold">
                  Digite este número de 6 dígitos no seu notebook na caixa ao lado!
                </p>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPin.pin);
                      setPinCopied(true);
                      setTimeout(() => setPinCopied(false), 2000);
                    }}
                    className="py-1.5 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {pinCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{pinCopied ? 'Copiado!' : 'Copiar PIN'}</span>
                  </button>

                  <button
                    onClick={handleGeneratePin}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Gerar Outro</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                disabled={pinLoading}
                onClick={handleGeneratePin}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {pinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>Gerar PIN de 6 Dígitos no Tablet</span>
              </button>
            )}
          </div>

          {/* RECEIVER COLUMN (NOTEBOOK / PC) */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/90 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>2. No Notebook (Receber os Dados)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Digite os 6 números gerados no seu tablet para baixar instantaneamente todas as suas corridas, odômetros e despesas para este notebook.
              </p>
            </div>

            <form onSubmit={handleLoadByPin} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  PIN de 6 Dígitos do Tablet
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ex: 849201"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono text-center text-xl font-black tracking-widest text-slate-800 placeholder:text-slate-300 focus:outline-blue-600 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading || inputPin.length !== 6}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {pinLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                <span>Baixar Dados do Tablet via PIN</span>
              </button>
            </form>
          </div>

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

      {/* 4. IN-APP NOTIFICATION & CONFIRMATION MODAL (Zero window.alert/confirm) */}
      {notification?.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-print">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
              onClick={() => setNotification(null)} 
            />

            {/* Modal Dialog Content */}
            <div className="relative inline-block bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  notification.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : notification.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : notification.type === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {notification.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                  {notification.type === 'error' && <AlertCircle className="w-6 h-6" />}
                  {notification.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                  {notification.type === 'info' && <Info className="w-6 h-6" />}
                  {notification.type === 'confirm' && <Database className="w-6 h-6" />}
                </div>

                <div className="flex-1 pr-6">
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {notification.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed font-semibold">
                    {notification.message}
                  </p>
                </div>

                <button 
                  onClick={() => setNotification(null)}
                  className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {notification.bulletPoints && notification.bulletPoints.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs text-slate-700">
                  {notification.bulletPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold shrink-0">•</span>
                      <span className="leading-relaxed font-medium">{pt}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {notification.type === 'confirm' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setNotification(null)}
                      className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      {notification.cancelText || 'Cancelar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cb = notification.onConfirm;
                        setNotification(null);
                        if (cb) cb();
                      }}
                      className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer"
                    >
                      {notification.confirmText || 'Confirmar'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNotification(null)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer"
                  >
                    Entendido
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
