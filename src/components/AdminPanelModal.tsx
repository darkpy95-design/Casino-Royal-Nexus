import React, { useState, useEffect } from 'react';
import { X, UserPlus, Coins, Users, Trash2, Search, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface AdminUserItem {
  id: string;
  password: string;
  role: 'admin' | 'client';
  balance: number;
  createdAt: string;
  totalSpins: number;
  totalPointsBet: number;
  totalPointsWon: number;
}

interface AdminPanelModalProps {
  adminId: string;
  onClose: () => void;
  onUserBalanceUpdated: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  adminId,
  onClose,
  onUserBalanceUpdated,
}) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Credit Points Form State
  const [creditTargetId, setCreditTargetId] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('10000');

  // New User Form State
  const [newUserId, setNewUserId] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newInitialBalance, setNewInitialBalance] = useState<string>('');
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  // House Advantage / RTP Control State
  const [houseRtpTarget, setHouseRtpTarget] = useState<number>(75);
  const [isSavingRtp, setIsSavingRtp] = useState<boolean>(false);

  // User Deletion Modal State
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  // Load User Accounts List & RTP Config
  const fetchUsers = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?adminId=${encodeURIComponent(adminId)}`);
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch {
      if (showLoading) {
        setStatusMsg({ type: 'error', text: 'Error al cargar la lista de usuarios del servidor' });
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchRtpConfig = async () => {
    try {
      const res = await fetch('/api/admin/rtp');
      const data = await res.json();
      if (data.rtpTarget) {
        setHouseRtpTarget(data.rtpTarget);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsers(true);
    fetchRtpConfig();

    // Auto-refresh user stats every 3 seconds for real-time monitoring
    const timer = setInterval(() => {
      fetchUsers(false);
    }, 3000);

    return () => clearInterval(timer);
  }, [adminId]);

  const handleSaveRtp = async (targetRtp: number) => {
    setIsSavingRtp(true);
    try {
      const res = await fetch('/api/admin/set-rtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, rtpTarget: targetRtp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHouseRtpTarget(data.rtpTarget);
        setStatusMsg({ type: 'success', text: data.message });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Error al guardar configuración' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setIsSavingRtp(false);
    }
  };

  // Handle Credit or Debit Points
  const handleCreditPoints = async (action: 'add' | 'subtract' | 'set', targetId?: string, customAmt?: number) => {
    const finalTarget = targetId || creditTargetId;
    const finalAmt = customAmt !== undefined ? customAmt : (Number(creditAmount) || 0);

    if (!finalTarget.trim()) {
      setStatusMsg({ type: 'error', text: 'Selecciona o ingresa el ID del usuario' });
      return;
    }

    try {
      const res = await fetch('/api/admin/credit-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          targetUserId: finalTarget.trim(),
          amount: finalAmt,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.error || 'Error al actualizar puntos' });
        return;
      }

      setStatusMsg({ type: 'success', text: data.message });
      fetchUsers();
      onUserBalanceUpdated();
    } catch {
      setStatusMsg({ type: 'error', text: 'Error al procesar acreditación' });
    }
  };

  // Handle Create New Client User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserPassword.trim()) {
      setStatusMsg({ type: 'error', text: 'Ingresa un ID y Contraseña para el nuevo cliente' });
      return;
    }

    setIsCreatingUser(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          newUserId: newUserId.trim(),
          newPassword: newUserPassword.trim(),
          initialBalance: Number(newInitialBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.error || 'Error al crear el usuario' });
        setIsCreatingUser(false);
        return;
      }

      setStatusMsg({ type: 'success', text: data.message });
      setNewUserId('');
      setNewUserPassword('');
      setNewInitialBalance('');
      fetchUsers();
      onUserBalanceUpdated();
    } catch {
      setStatusMsg({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetId: string) => {
    setIsDeletingUser(true);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, targetUserId: targetId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMsg({ type: 'error', text: data.error || 'Error al eliminar usuario' });
        return;
      }

      setStatusMsg({ type: 'success', text: data.message });
      setUserToDelete(null);
      fetchUsers();
      onUserBalanceUpdated();
    } catch {
      setStatusMsg({ type: 'error', text: 'Error al eliminar usuario' });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-sans text-slate-100">
      <div className="bg-slate-900 border border-purple-500/40 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[95dvh] sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Full-screen Casino Background Wallpaper in Admin Panel */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src={logoImg} 
            alt="Royal Nexus Casino Background" 
            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            className="w-full h-full object-cover opacity-10 filter blur-[2px] scale-105" 
          />
          <div className="absolute inset-0 bg-slate-950/85 mix-blend-multiply" />
        </div>
        
        {/* Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 relative z-10 gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <img 
              src={logoImg} 
              alt="Royal Nexus Logo" 
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-lg shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-base font-black text-purple-300 font-mono uppercase tracking-wider truncate">
                PANEL DE ADMINISTRACIÓN
              </h2>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono truncate">
                Gestión de Clientes y Puntos Virtuales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors shrink-0 active:scale-95"
            title="Cerrar Panel Admin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10">
          {/* Status Toast Message */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono animate-fade-in ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/80 border-red-500/50 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button
                onClick={() => setStatusMsg(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Grid Layout: Form 1 Acreditar Puntos + Form 2 Crear Usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Acreditar Puntos por ID */}
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-amber-300 font-mono uppercase">
                  1. ACREDITAR PUNTOS POR ID
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 font-mono uppercase mb-1">
                    Seleccionar o Escribir ID del Cliente
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: cliente1"
                      value={creditTargetId}
                      onChange={e => setCreditTargetId(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-base sm:text-xs font-mono text-slate-100 focus:outline-none"
                    />
                    <select
                      onChange={e => setCreditTargetId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-base sm:text-xs font-mono text-slate-300 rounded-xl px-2 focus:outline-none"
                    >
                      <option value="">-- Lista --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.id} ({u.balance.toLocaleString()} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 font-mono uppercase mb-1">
                    Cantidad de Puntos
                  </label>
                  <input
                    type="number"
                    placeholder="Escribe el monto a acreditar..."
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[5000, 10000, 50000, 100000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCreditAmount(String(amt))}
                      className="p-1.5 bg-slate-900 hover:bg-amber-950 border border-slate-800 hover:border-amber-500/40 text-[10px] font-mono text-amber-300 rounded-lg transition-colors"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleCreditPoints('add')}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl font-mono uppercase text-xs transition-colors flex items-center justify-center gap-1 shadow-md shadow-emerald-900/20"
                  >
                    ➕ Acreditar (+)
                  </button>
                  <button
                    onClick={() => handleCreditPoints('subtract')}
                    className="py-2.5 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold rounded-xl font-mono uppercase text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    ➖ Descontar (-)
                  </button>
                </div>
              </div>
            </div>

            {/* Box 2: Crear Nuevo Usuario Cliente */}
            <form onSubmit={handleCreateUser} className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <UserPlus className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-purple-300 font-mono uppercase">
                  2. CREAR NUEVO CLIENTE
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 font-mono uppercase mb-1">
                    ID del Usuario (Nombre de Cliente)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: cliente_juan"
                    value={newUserId}
                    onChange={e => setNewUserId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 font-mono uppercase mb-1">
                    Contraseña
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 123456"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 font-mono uppercase mb-1">
                    Puntos Iniciales
                  </label>
                  <input
                    type="number"
                    placeholder="Monto de puntos iniciales..."
                    value={newInitialBalance}
                    onChange={e => setNewInitialBalance(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl font-mono uppercase text-xs transition-all shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Registrar Cliente
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: House Advantage & RTP Control (Ajuste de Ganancia del Dueño) */}
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-lg">🏛️</span>
                <div>
                  <h3 className="font-bold text-sm text-emerald-300 font-mono uppercase">
                    3. CONTROL DE MARGEN Y GANANCIA DE LA CASA (RTP)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Ajusta la probabilidad a favor del dueño para garantizar ganancias en Puertas del Olimpo.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950 border border-emerald-500/50 px-3 py-1 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-mono block">MARGEN DE LA CASA</span>
                <span className="text-base font-black text-emerald-300 font-mono">{100 - houseRtpTarget}% GANANCIA</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleSaveRtp(70)}
                disabled={isSavingRtp}
                className={`p-3 rounded-xl border text-left font-mono transition-all ${
                  houseRtpTarget === 70
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/50 scale-102'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-black text-xs text-amber-300 uppercase">🔥 CASA RIGUROSA</div>
                <div className="text-[10px] text-slate-400 mt-1">30% Margen Dueño • 70% RTP</div>
                <div className="text-[9px] text-emerald-400 font-bold mt-1">Máxima ganancia garantizada</div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveRtp(75)}
                disabled={isSavingRtp}
                className={`p-3 rounded-xl border text-left font-mono transition-all ${
                  houseRtpTarget === 75
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/50 scale-102'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-black text-xs text-emerald-300 uppercase">⚖️ CASA ESTÁNDAR</div>
                <div className="text-[10px] text-slate-400 mt-1">25% Margen Dueño • 75% RTP</div>
                <div className="text-[9px] text-emerald-400 font-bold mt-1">Balance óptimo de retención</div>
              </button>

              <button
                type="button"
                onClick={() => handleSaveRtp(80)}
                disabled={isSavingRtp}
                className={`p-3 rounded-xl border text-left font-mono transition-all ${
                  houseRtpTarget === 80
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/50 scale-102'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-black text-xs text-blue-300 uppercase">🛡️ CASA MODERADA</div>
                <div className="text-[10px] text-slate-400 mt-1">20% Margen Dueño • 80% RTP</div>
                <div className="text-[9px] text-blue-400 font-bold mt-1">Retención suave</div>
              </button>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-300 font-bold block">Ajuste Personalizado de Retorno al Jugador (RTP):</span>
                <span className="text-slate-400 text-[11px] block">
                  Actualmente el jugador recibe en promedio el <strong className="text-amber-300">{houseRtpTarget}%</strong> de lo apostado, reteniendo el casino el <strong className="text-emerald-300">{100 - houseRtpTarget}%</strong>.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="85"
                  value={houseRtpTarget}
                  onChange={e => setHouseRtpTarget(Number(e.target.value))}
                  className="w-32 accent-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRtp(houseRtpTarget)}
                  disabled={isSavingRtp}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase"
                >
                  Guardar ({houseRtpTarget}% RTP)
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Registered Clients Table */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-sm text-slate-200 font-mono uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" /> CLIENTES REGISTRADOS ({users.length})
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Monitoreo En Vivo (3s)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => fetchUsers(true)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                  title="Recargar usuarios"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mobile Card View (shown on screens < sm) */}
            <div className="sm:hidden space-y-3">
              {filteredUsers.map(u => {
                const netGains = u.totalPointsWon - u.totalPointsBet;
                return (
                  <div key={u.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">👤</span>
                        <span className="font-bold text-amber-300 text-sm">{u.id}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Clave: {u.password}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Puntos Actuales:</span>
                        <span className="font-bold text-emerald-400 text-sm">{u.balance.toLocaleString()} pts</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Resultado (G/P):</span>
                        {netGains > 0 ? (
                          <span className="font-bold text-emerald-400">+{netGains.toLocaleString()} pts</span>
                        ) : netGains < 0 ? (
                          <span className="font-bold text-amber-400">{netGains.toLocaleString()} pts</span>
                        ) : (
                          <span className="text-slate-500">0 pts</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => {
                          setCreditTargetId(u.id);
                        }}
                        className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        ➕/➖ Cargar Puntos
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => setUserToDelete(u.id)}
                          className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          title="Eliminar Cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="p-6 text-center text-slate-500 italic bg-slate-950 border border-slate-800 rounded-2xl">
                  No se encontraron usuarios
                </div>
              )}
            </div>

            {/* Desktop Table View (hidden on screens < sm) */}
            <div className="hidden sm:block overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID Usuario</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Contraseña</th>
                    <th className="p-3">Puntos Actuales</th>
                    <th className="p-3">Apostado</th>
                    <th className="p-3">Ganado</th>
                    <th className="p-3">Resultado (G/P)</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map(u => {
                    const netGains = u.totalPointsWon - u.totalPointsBet;

                    return (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-amber-300 flex items-center gap-1.5">
                          <span>👤</span> {u.id}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{u.password}</td>
                        <td className="p-3 font-bold text-emerald-400 text-sm">
                          {u.balance.toLocaleString()} pts
                        </td>
                        <td className="p-3 text-slate-300">{u.totalPointsBet.toLocaleString()}</td>
                        <td className="p-3 text-slate-300">{u.totalPointsWon.toLocaleString()}</td>
                        <td className="p-3 font-bold">
                          {netGains > 0 ? (
                            <span className="text-emerald-400">+{netGains.toLocaleString()} pts</span>
                          ) : netGains < 0 ? (
                            <span className="text-amber-400">{netGains.toLocaleString()} pts</span>
                          ) : (
                            <span className="text-slate-500">0 pts</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setCreditTargetId(u.id);
                            }}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition-colors"
                            title="Seleccionar usuario para cargar o descontar puntos"
                          >
                            ➕/➖ Cargar
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => setUserToDelete(u.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                              title="Eliminar Cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200 relative">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 uppercase tracking-wide">¿Confirmar Eliminación?</h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente la cuenta del usuario <span className="font-bold text-amber-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-amber-500/30">{userToDelete}</span>?
              </p>
              <p className="text-xs text-red-400/80 mt-1.5 italic">
                Esta acción no se puede deshacer y borrará todos sus puntos e historial.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors border border-slate-700 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                disabled={isDeletingUser}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/40 text-sm flex items-center justify-center gap-2"
              >
                {isDeletingUser ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
