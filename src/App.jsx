import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      signOut,
      onAuthStateChanged,
      sendPasswordResetEmail
} from 'firebase/auth';
// --- IMPORTAÇÕES DO FIRESTORE ---
import {
      getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where // Adicionado where para query
} from 'firebase/firestore';
// --- FIM IMPORTAÇÕES DO FIRESTORE ---
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
// jsPDF e autoTable são carregados globalmente no index.html
import {
      LayoutGrid, Calendar as CalendarIcon, Wallet, Box, Settings, X, Menu,
      TrendingUp, ArrowLeftRight, CreditCard, DollarSign,
      AlertTriangle, CheckCircle2, Search, Trash2, FilePenLine, Info, Check, AlertCircle, LogOut, Download, Users, FilePlus, FileText, Loader2,
      Filter, SlidersHorizontal // Ícones para o botão de filtros
} from 'lucide-react';

// Registra componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale);

// --- Mapeamentos de Status ---
const statusMap = {
      'Agendado': 'bg-blue-100 text-blue-800',
      'Confirmado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800'
};

const financialStatusMap = {
      'Recebido': 'bg-green-100 text-green-800',
      'A Receber': 'bg-yellow-100 text-yellow-800',
      'Pago': 'bg-gray-200 text-gray-800',
      'A Pagar': 'bg-red-100 text-red-800'
};

// --- Configuração do Firebase (ATUALIZADA COM OS SEUS DADOS) ---
const firebaseConfig = {
      apiKey: "AIzaSyDbMWkQDM70GGqsuqTgdeYbNhi8unPApeQ",
      authDomain: "clinica-ameld-app.firebaseapp.com",
      projectId: "clinica-ameld-app",
      storageBucket: "clinica-ameld-app.appspot.com", // CORRIGIDO
      messagingSenderId: "326580479289",
      appId: "1:326580479289:web:40f4d93b4056a504aaf4e8",
      measurementId: "G-PXZWZVF581"
};


// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// --- INICIALIZA FIRESTORE ---
const db = getFirestore(app);
// --- FIM INICIALIZA FIRESTORE ---

// --- Estilos Base para Botões ---
const baseButtonStyles = "inline-flex items-center justify-center px-5 py-2 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] active:translate-y-px shadow-md hover:shadow-xl transform hover:-translate-y-px";
const primaryButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 focus:ring-pink-500`;
const secondaryButtonStyles = `${baseButtonStyles} bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400 border border-gray-200 hover:border-gray-300`;
const destructiveButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-500`;
const infoButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 focus:ring-blue-500`;
const linkButtonStyles = "text-pink-600 hover:text-pink-500 font-medium focus:outline-none focus:ring-1 focus:ring-pink-400 rounded transition-colors duration-150";
const iconButtonStyles = "p-1.5 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:bg-gray-100";

// --- Componentes Auxiliares ---

const LoadingSpinner = () => (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
);

const EmptyState = ({ icon, title, message, actionButton }) => (
      <div className="text-center py-12 px-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="mx-auto h-16 w-16 flex items-center justify-center bg-pink-50 rounded-full text-pink-400 mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
            {actionButton && typeof actionButton.onClick === 'function' && (
                  <div className="mt-6">
                        <button onClick={actionButton.onClick} className={primaryButtonStyles}>{actionButton.label}</button>
                  </div>
            )}
      </div>
);

const Toast = ({ id, message, type, removeToast }) => { // Removido onClose não usado
      const [isExiting, setIsExiting] = useState(false);

      useEffect(() => {
            const exitTimer = setTimeout(() => {
                  setIsExiting(true);
                  const removeTimer = setTimeout(() => {
                        removeToast(id);
                  }, 400); // Duração da animação de saída
                  return () => clearTimeout(removeTimer);
            }, 4600); // Tempo antes de começar a sair (5000ms total - 400ms animação)

            return () => clearTimeout(exitTimer);
      }, [id, removeToast]);

      const toastStyles = {
            success: { bg: 'bg-green-500', icon: <Check size={20} /> },
            error: { bg: 'bg-red-500', icon: <AlertCircle size={20} /> },
            info: { bg: 'bg-blue-500', icon: <Info size={20} /> },
      };
      const style = toastStyles[type] || { bg: 'bg-gray-500', icon: <Info size={20} /> };

      const handleManualClose = () => {
            setIsExiting(true);
            setTimeout(() => {
                  removeToast(id);
            }, 400); // Duração da animação de saída
      };

      return (
            <div className={`flex items-start text-white p-4 rounded-lg shadow-lg transition-all duration-500 ease-out ${style.bg} ${isExiting ? 'animate-fade-out' : 'animate-fade-in-up'}`}>
                  <div className="mr-3 flex-shrink-0 pt-1">{style.icon}</div>
                  <p className="flex-grow">{message}</p>
                  <button onClick={handleManualClose} className="ml-4 -mr-2 -my-2 p-2 rounded hover:bg-black/20 focus:outline-none focus:ring-1 focus:ring-white" aria-label="Fechar toast">&times;</button>
            </div>
      );
};

const ToastContainer = ({ toasts, removeToast }) => (
      <div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-xs sm:max-w-sm">
            {toasts.map(toast => <Toast key={toast.id} {...toast} removeToast={removeToast} />)}
      </div>
);

const Modal = ({ show, onClose, title, children }) => {
      useEffect(() => {
            if (show) document.body.style.overflow = 'hidden';
            else document.body.style.overflow = 'unset';
            return () => { document.body.style.overflow = 'unset'; };
      }, [show]);

      if (!show) return null;

      return (
            <div className="fixed inset-0 bg-black/70 z-40 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
                  <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transition-transform transform scale-95 z-50 max-h-[90vh] overflow-y-auto"
                        style={{ animation: 'scale-in 0.3s ease-out forwards' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 sticky top-0 bg-white pt-2 -mt-2">
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h3>
                              <button onClick={onClose} className={`${iconButtonStyles} text-gray-400 hover:text-gray-600 focus:ring-gray-400 -mr-2`} aria-label="Fechar modal"><X size={24} /></button>
                        </div>
                        {children}
                  </div>
            </div>
      );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmLabel = "Apagar", confirmIcon = <Trash2 size={18} />, cancelLabel = "Cancelar", cancelIcon = <X size={18} />, isDestructive = true }) => {
      if (!show) return null;
      return (
            <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
                  <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transition-transform transform scale-95"
                        style={{ animation: 'scale-in 0.3s ease-out forwards' }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center mb-4">
                              <div className={`mr-3 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-blue-100'} sm:h-12 sm:w-12`}>
                                    {isDestructive ? <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" /> : <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />}
                              </div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h3>
                        </div>
                        <p className="text-gray-600 mb-8 ml-13 sm:ml-15">{message}</p>
                        <div className="flex justify-end space-x-3">
                              <button type="button" onClick={onClose} className={secondaryButtonStyles}><span className="mr-1">{cancelIcon}</span>{cancelLabel}</button>
                              <button type="button" onClick={onConfirm} className={isDestructive ? destructiveButtonStyles : primaryButtonStyles}><span className="mr-1">{confirmIcon}</span>{confirmLabel}</button>
                        </div>
                  </div>
            </div>
      );
};

const FormModal = ({ show, onClose, title, children, onSubmit, isSubmitting }) => (
      <Modal show={show} onClose={onClose} title={title}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5">
                  {children}
                  <div className="flex justify-end space-x-3 pt-5 border-t border-gray-100 mt-8">
                        <button type="button" onClick={onClose} className={secondaryButtonStyles} disabled={isSubmitting}><X size={18} className="mr-1.5" /> Cancelar</button>
                        <button type="submit" className={primaryButtonStyles} disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Check size={18} className="mr-1.5" />}
                              {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                  </div>
            </form>
      </Modal>
);

const FormInput = ({ id, label, type = "text", value, onChange, required = false, autoComplete, placeholder, list, inputMode, min }) => (
      <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
            <input
                  id={id}
                  name={id}
                  type={type}
                  value={value}
                  onChange={onChange}
                  required={required}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  list={list}
                  inputMode={inputMode}
                  min={min} // Adicionado min
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-150 ease-in-out"
            />
            {list && <datalist id={list}>{/* Options devem ser passadas externamente se necessário */}</datalist>}
      </div>
);

const FormSelect = ({ id, label, value, onChange, children, required = false }) => (
      <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <select
                  id={id}
                  name={id}
                  value={value}
                  onChange={onChange}
                  required={required}
                  className="mt-1 block w-full pl-4 pr-10 py-2.5 border border-gray-300 bg-white text-gray-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-150 ease-in-out"
            >
                  {children}
            </select>
      </div>
);


// --- Componentes Específicos das Páginas ---

// ** AuthPage **
const AuthPage = ({ showToast }) => {
      const [page, setPage] = useState('login');
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);

      const handleAuthAction = async (actionFn, successMsg, errorMsgBase) => {
            setLoading(true); setError('');
            try {
                  const args = actionFn === sendPasswordResetEmail ? [auth, email] : [auth, email, password];
                  await actionFn(...args);
                  showToast(successMsg, 'success');
                  if (actionFn === sendPasswordResetEmail) setPage('login');
            } catch (err) {
                  console.error(`${errorMsgBase} error:`, err);
                  let friendlyError = `${errorMsgBase} inválido(s).`;
                  if (err.code === 'auth/invalid-email') friendlyError = 'Formato de e-mail inválido.';
                  else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') friendlyError = 'E-mail ou senha incorreto(s).'; // Mensagem genérica
                  else if (err.code === 'auth/wrong-password') friendlyError = 'Senha incorreta.';
                  else if (err.code === 'auth/weak-password') friendlyError = 'Senha muito fraca (mínimo 6 caracteres).';
                  else if (err.code === 'auth/email-already-in-use') friendlyError = 'Este e-mail já está em uso.';
                  setError(friendlyError);
                  showToast(`Falha: ${friendlyError}`, 'error'); // Mostra erro mais específico no Toast
            } finally { setLoading(false); }
      };

      const handleLogin = (e) => { e.preventDefault(); handleAuthAction(signInWithEmailAndPassword, 'Login bem-sucedido!', 'login'); };
      const handleRegister = (e) => { e.preventDefault(); handleAuthAction(createUserWithEmailAndPassword, 'Conta criada com sucesso!', 'registro'); };
      const handlePasswordReset = (e) => { e.preventDefault(); handleAuthAction(sendPasswordResetEmail, 'E-mail de recuperação enviado!', 'envio de e-mail'); };

      const renderFormFields = (isRegister = false) => (
            <>
                  <FormInput
                        id={`email-${page}`}
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                  />
                  {page !== 'forgot' && (
                        <FormInput
                              id={`password-${page}`}
                              label="Senha"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={isRegister ? "Mínimo 6 caracteres" : ""}
                              required={page !== 'forgot'}
                              autoComplete={isRegister ? "new-password" : "current-password"}
                        />
                  )}
            </>
      );

      const renderSubmitButton = (label, loadingLabel) => (
            <div>
                  <button type="submit" disabled={loading} className={`${primaryButtonStyles} w-full py-3`}>
                        {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                        {loading ? loadingLabel : label}
                  </button>
            </div>
      );

      const renderContent = () => {
            switch (page) {
                  case 'register': return (
                        <>
                              <h2 className="text-xl font-bold text-center mb-6">Criar Conta</h2>
                              <form className="space-y-6" onSubmit={handleRegister}>
                                    {renderFormFields(true)}
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    {renderSubmitButton('Registrar', 'Registrando...')}
                              </form>
                              <div className="text-sm text-center mt-6"><span className="text-gray-500">Já tem uma conta? </span><button onClick={() => { setPage('login'); setError(''); }} className={linkButtonStyles}>Entrar</button></div>
                        </>
                  );
                  case 'forgot': return (
                        <>
                              <h2 className="text-xl font-bold text-center mb-4">Recuperar Senha</h2>
                              <p className="text-center text-gray-600 mb-6 text-sm">Insira o seu e-mail para receber um link de recuperação.</p>
                              <form className="space-y-6" onSubmit={handlePasswordReset}>
                                    {renderFormFields()}
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    {renderSubmitButton('Enviar E-mail', 'Enviando...')}
                              </form>
                              <div className="text-sm text-center mt-6"><button onClick={() => { setPage('login'); setError(''); }} className={linkButtonStyles}>Voltar para o Login</button></div>
                        </>
                  );
                  default: return ( // Login page
                        <>
                              <h2 className="text-xl font-bold text-center mb-6">Login</h2>
                              <form className="space-y-6" onSubmit={handleLogin}>
                                    {renderFormFields()}
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    <div className="text-sm text-right"><button type="button" onClick={() => { setPage('forgot'); setError(''); }} className={linkButtonStyles}>Esqueceu a senha?</button></div>
                                    {renderSubmitButton('Entrar', 'Entrando...')}
                              </form>
                              <div className="text-sm text-center mt-6"><span className="text-gray-500">Não tem uma conta? </span><button onClick={() => { setPage('register'); setError(''); }} className={linkButtonStyles}>Registre-se</button></div>
                        </>
                  );
            }
      };

      return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
                  <div className="w-full max-w-md p-8 sm:p-10 space-y-6 bg-white rounded-2xl shadow-xl">
                        <div className="text-center">
                              <img src="/logo(2).png" alt="AMELDY logo" className="h-14 mx-auto mb-4" />
                              {page === 'login' && <p className="text-gray-500">Bem-vindo(a)! Faça login para continuar.</p>}
                        </div>
                        {renderContent()}
                  </div>
            </div>
      );
};


// ** Sidebar **
const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen, onLogout }) => {
      const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-5 w-5 mr-3" /> },
            { id: 'atendimentos', label: 'Atendimentos', icon: <CalendarIcon className="h-5 w-5 mr-3" /> },
            { id: 'pacientes', label: 'Pacientes', icon: <Users className="h-5 w-5 mr-3" /> },
            { id: 'financeiro', label: 'Financeiro', icon: <Wallet className="h-5 w-5 mr-3" /> },
            { id: 'estoque', label: 'Estoque', icon: <Box className="h-5 w-5 mr-3" /> },
            { id: 'configuracoes', label: 'Configurações', icon: <Settings className="h-5 w-5 mr-3" /> },
      ];
      const linkClasses = (id) => `flex items-center px-4 py-3 text-gray-700 hover:text-pink-600 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-1 ${currentPage === id ? 'bg-pink-100 text-pink-600 font-semibold shadow-sm' : 'hover:bg-gray-50'}`;
      const sidebarClasses = `fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
      const handleLinkClick = (pageId) => { setCurrentPage(pageId); if (window.innerWidth < 1024) setIsOpen(false); };

      return (
            <aside className={sidebarClasses}>
                  <div className="h-20 flex items-center px-4 border-b border-gray-100 relative">
                        <img src="/logo(2).png" alt="AMELDY (logo rosa)" className="h-10" />
                        <button onClick={() => setIsOpen(false)} className={`${iconButtonStyles} text-gray-500 lg:hidden focus:ring-gray-400 absolute right-4 top-1/2 -translate-y-1/2`} aria-label="Fechar menu lateral">
                              <X className="h-6 w-6" />
                        </button>
                  </div>
                  <nav className="flex-1 px-4 py-6 space-y-1.5">
                        {navItems.map(item => <button key={item.id} className={`${linkClasses(item.id)} w-full text-left`} onClick={() => handleLinkClick(item.id)}>{item.icon}{item.label}</button>)}
                  </nav>
                  <div className="p-4 border-t border-gray-100">
                        <button onClick={onLogout} className={`flex items-center w-full text-red-600 font-medium rounded-lg hover:bg-red-50 focus:ring-red-400 justify-start px-4 py-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1`}>
                              <LogOut className="h-5 w-5 mr-3" />Sair
                        </button>
                  </div>
            </aside>
      );
};


// ** Header **
const Header = ({ onMenuClick, title }) => (
      <header className="lg:hidden bg-white sticky top-0 z-10 flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 border-b border-gray-100 shadow-sm">
            <button onClick={onMenuClick} className={`${iconButtonStyles} text-gray-600 focus:ring-gray-400`} aria-label="Abrir menu lateral"><Menu className="h-6 w-6" /></button>
            <span className="flex-grow text-center text-lg font-semibold text-gray-700 truncate px-2">
                  {title}
            </span>
            <div className="w-10"></div> {/* Espaçador */}
      </header>
);

// ** AtendimentosChart **
const AtendimentosChart = ({ atendimentos }) => {
      const chartRef = useRef(null);
      const chartInstance = useRef(null);

      useEffect(() => {
            ChartJS.defaults.color = '#64748b';
            ChartJS.defaults.borderColor = '#e2e8f0';
            const canvas = chartRef.current; if (!canvas) return;
            const ctx = canvas.getContext('2d'); if (!ctx) return;
            if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }

            const atendimentosPorSetor = (atendimentos || []).reduce((acc, curr) => {
                  const setor = curr.setor || 'Não especificado'; acc[setor] = (acc[setor] || 0) + 1; return acc;
            }, {});
            const labels = Object.keys(atendimentosPorSetor); const dataValues = Object.values(atendimentosPorSetor);

            if (labels.length > 0) {
                  chartInstance.current = new ChartJS(ctx, {
                        type: 'doughnut',
                        data: { labels: labels, datasets: [{ label: 'Atendimentos por Setor', data: dataValues, backgroundColor: ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d'], borderColor: '#fff', borderWidth: 4, hoverOffset: 8 }] },
                        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } } } }
                  });
            }
            return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
      }, [atendimentos]);

      return (
            <div className="relative w-full h-64 sm:h-80">
                  <canvas ref={chartRef}></canvas>
                  {(!atendimentos || atendimentos.length === 0) && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Sem dados para exibir.</div>}
            </div>
      );
};

// ** DailyRevenueChart **
const DailyRevenueChart = ({ data }) => {
      const chartRef = useRef(null);
      const chartInstance = useRef(null);

      useEffect(() => {
            ChartJS.defaults.color = '#64748b'; ChartJS.defaults.borderColor = '#e2e8f0';
            const canvas = chartRef.current; if (!canvas) return;
            const ctx = canvas.getContext('2d'); if (!ctx) return;
            if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }

            if (data && data.labels && data.values && data.values.some(v => v > 0)) {
                  chartInstance.current = new ChartJS(ctx, {
                        type: 'bar',
                        data: { labels: data.labels, datasets: [{ label: 'Faturamento Diário', data: data.values, backgroundColor: '#f9a8d4', borderColor: '#f472b6', borderWidth: 1, borderRadius: 8 }] },
                        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.dataset.label || ''}: ${c.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` } } } }
                  });
            }
            return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
      }, [data]);

      return (
            <div className="relative w-full h-64 sm:h-80">
                  <canvas ref={chartRef}></canvas>
                  {(!data || !data.values || !data.values.some(v => v > 0)) && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Sem dados para exibir.</div>}
            </div>
      );
};

// ** StatCard **
const StatCard = ({ icon, title, value, subtitle, colorClass }) => (
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-100 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 transition-all duration-300 hover:shadow-lg min-h-[100px] sm:min-h-[90px]">
            <div className={`rounded-lg p-2.5 flex-shrink-0 mx-auto sm:mx-0 ${colorClass?.bg || 'bg-gray-100'}`}>
                  {React.isValidElement(icon) ? React.cloneElement(icon, { size: 20 }) : icon}
            </div>
            <div className="flex-grow overflow-hidden text-center sm:text-left">
                  <p className="text-xs font-medium text-gray-500 truncate">{title || 'Título'}</p>
                  <p className={`text-base sm:text-lg font-bold ${colorClass?.text || 'text-gray-800'}`}>{value || '0'}</p>
                  {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
      </div>
);

// ** Dashboard **
const Dashboard = ({ estoque, atendimentos, financeiro, repasses }) => {
      const today = new Date();
      const dateString = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const formatCurrency = (v) => (typeof v !== 'number' || isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      // Cálculos
      const totals = useMemo(() => {
            let faturamentoBruto = 0, despesaPaga = 0, repassesRecebidos = 0;
            (financeiro || []).forEach(t => {
                  const valor = Number(t.valor) || 0;
                  if (t.tipo === 'Entrada' && t.status === 'Recebido') faturamentoBruto += valor;
                  if (t.tipo === 'Saída' && t.status === 'Pago') despesaPaga += valor;
                  const regra = (repasses || []).find(r => r.servico === t.descricao);
                  if (regra && t.tipo === 'Entrada' && t.status === 'Recebido') {
                        if (regra.tipo === 'Percentual') {
                              const percent = parseFloat(String(regra.valor).replace(/[^0-9,.-]+/g, "").replace(",", ".")) / 100;
                              if (!isNaN(percent)) repassesRecebidos += valor * percent;
                        } else if (regra.tipo === 'Fixo') {
                              const fixo = parseFloat(String(regra.valor).replace(/[^0-9,.-]+/g, "").replace(",", "."));
                              if (!isNaN(fixo)) repassesRecebidos += Math.min(fixo, valor);
                        }
                  }
            });
            const resultadoClinica = repassesRecebidos - despesaPaga;
            const fluxoCaixa = faturamentoBruto - despesaPaga;

            return { faturamentoBruto, despesaPaga, repassesRecebidos, fluxoCaixa, resultadoClinica };
      }, [financeiro, repasses]);

      // Dados para gráficos
      const dailyRevenueData = useMemo(() => {
            const labels = []; const values = []; const today = new Date();
            for (let i = 6; i >= 0; i--) {
                  const date = new Date(today); date.setDate(today.getDate() - i);
                  const dateStr = date.toISOString().slice(0, 10);
                  labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
                  const revenue = (financeiro || [])
                        .filter(t => t.data === dateStr && t.tipo === 'Entrada' && t.status === 'Recebido')
                        .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
                  values.push(revenue);
            } return { labels, values };
      }, [financeiro]);
      const itensParaComprar = useMemo(() => {
            return (estoque || []).filter(item => {
                  const consumo = Number(item.consumoMedio) || 0; const atual = Number(item.atual) || 0;
                  const minimo = Math.ceil(consumo * 0.3); return consumo > 0 && atual <= minimo;
            })
      }, [estoque]);

      // Renderização do Dashboard
      return (
            <div className="space-y-6">
                  {/* Título e Data */}
                  <div className="text-center sm:text-left hidden lg:block">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Olá, Bem-vindo(a)!</h1>
                        <p className="text-gray-500">{dateString}</p>
                  </div>

                  {/* Cards de Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        <StatCard title="Faturamento Bruto" value={formatCurrency(totals.faturamentoBruto)} subtitle="Total de entradas" icon={<TrendingUp className="text-blue-600" />} colorClass={{ bg: "bg-blue-100", text: "text-blue-600" }} />
                        <StatCard title="Comissão Clínica" value={formatCurrency(totals.repassesRecebidos)} subtitle="Valor da clínica (bruto)" icon={<ArrowLeftRight className="text-orange-600" />} colorClass={{ bg: "bg-orange-100", text: "text-orange-600" }} />
                        <StatCard title="Despesa Paga" value={formatCurrency(totals.despesaPaga)} subtitle="Total de saídas pagas" icon={<CreditCard className="text-red-600" />} colorClass={{ bg: "bg-red-100", text: "text-red-600" }} />
                        <StatCard title="Fluxo de Caixa" value={formatCurrency(totals.fluxoCaixa)} subtitle="Entradas - Saídas" icon={<DollarSign className="text-gray-600" />} colorClass={{ bg: "bg-gray-100", text: "text-gray-600" }} />
                        <StatCard title="Resultado da Clínica" value={formatCurrency(totals.resultadoClinica)} subtitle="Comissão - Despesas Pagas" icon={<CheckCircle2 className="text-green-600" />} colorClass={{ bg: "bg-green-100", text: "text-green-600" }} />
                  </div>

                  {/* Avisos de Estoque e Gráficos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm">
                              <h3 className="text-base font-semibold text-amber-800 mb-3 flex items-center"><AlertTriangle className="h-5 w-5 mr-1.5 text-amber-500" /> Avisos de Estoque</h3>
                              {itensParaComprar.length > 0 ? (<div className="space-y-2"> <p className="text-xs text-amber-700 mb-2">Itens com estoque baixo:</p> <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-2"> {itensParaComprar.map(item => (<li key={item.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white hover:shadow-sm border border-amber-100"><span className="text-gray-700 font-medium truncate mr-2" title={item.item}>{item.item}</span><span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full text-[10px] flex-shrink-0">{item.atual} unid.</span></li>))} </ul> </div>) : (<div className="text-center py-4"><CheckCircle2 className="h-8 w-8 mx-auto text-green-400" /><p className="text-xs text-gray-500 mt-2 font-medium">Estoque em dia!</p><p className="text-[11px] text-gray-400">Nenhum item abaixo do mínimo.</p></div>)}
                        </div>
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                              <h3 className="text-base font-semibold text-gray-700 mb-4">Faturamento (Recebido) - Últimos 7 Dias</h3> <DailyRevenueChart data={dailyRevenueData} />
                        </div>
                        <div className="md:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                              <h3 className="text-base font-semibold text-gray-700 mb-4">Atendimentos por Setor</h3> <AtendimentosChart atendimentos={atendimentos} />
                        </div>
                  </div>
            </div>
      );
};

// ** AgendamentoModal **
const AgendamentoModal = ({ show, onClose, servicos = [], onAddAtendimento, pacientes = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ data: new Date().toISOString().slice(0, 10), paciente: '', profissional: 'Enf.ª Andreia', servico: '', valor: '', setor: 'Consultório', status: 'Agendado' });
      const uniquePacientes = useMemo(() => [...new Set((pacientes || []).map(p => p.nome))], [pacientes]);
      const uniqueServicos = useMemo(() => (servicos || []), [servicos]);
      // Reset form when modal opens or closes
      useEffect(() => { if (show) { setFormData({ data: new Date().toISOString().slice(0, 10), paciente: '', profissional: 'Enf.ª Andreia', servico: '', valor: '', setor: 'Consultório', status: 'Agendado' }); } }, [show]);

      const handleChange = (e) => {
            const { name, value } = e.target;
            if (name === 'servico') {
                  const servicoSelecionado = servicos.find(s => s.nome === value);
                  if (servicoSelecionado && servicoSelecionado.valorPadrao && !formData.valor) {
                        setFormData(prev => ({ ...prev, [name]: value, valor: servicoSelecionado.valorPadrao }));
                  } else { setFormData(prev => ({ ...prev, [name]: value })); }
            } else { setFormData(prev => ({ ...prev, [name]: value })); }
      };

      const handleSubmit = () => {
            const valorNumerico = parseFloat(String(formData.valor).replace(',', '.')) || 0;
            const newAtendimento = { data: formData.data || new Date().toISOString().slice(0, 10), paciente: formData.paciente, profissional: formData.profissional, tipo: formData.servico, valor: valorNumerico.toFixed(2), setor: formData.setor || 'Consultório', status: formData.status || 'Agendado' };
            onAddAtendimento(newAtendimento).then(onClose).catch(err => console.error("Erro modal agendamento (já tratado):", err));
      };

      const servicoOptions = uniqueServicos.map(s => <option key={s.id || s.nome} value={s.nome} />);
      const pacienteOptions = uniquePacientes.map(p => <option key={p} value={p} />);

      return (
            <FormModal show={show} onClose={onClose} title="Novo Agendamento" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <FormInput id="data" label="Data do Atendimento" type="date" value={formData.data} onChange={handleChange} required />
                  <FormInput id="paciente" label="Paciente" value={formData.paciente} onChange={handleChange} list="pacientes-sugestoes" placeholder="Digite o nome" required /> <datalist id="pacientes-sugestoes">{pacienteOptions}</datalist>
                  <FormSelect id="profissional" label="Profissional" value={formData.profissional} onChange={handleChange}> <option>Enf.ª Andreia</option> <option>Tec. Bruno</option> <option>Enf.ª Ana</option> <option>Tec. Marilia</option> <option>Dr Ciarline</option> </FormSelect>
                  <FormInput id="servico" label="Serviço" value={formData.servico} onChange={handleChange} list="servicos-sugestoes" placeholder="Digite o nome do serviço" required /> <datalist id="servicos-sugestoes">{servicoOptions}</datalist>
                  <FormInput id="valor" label="Valor (R$)" value={formData.valor} onChange={handleChange} placeholder="0,00" required inputMode="decimal" />
            </FormModal>
      );
};

// ** AtendimentoList **
const AtendimentoList = ({ items, handleUpdateStatus, handleDeleteClick, openAgendamentoModal }) => {
      if (!items || items.length === 0) { return <EmptyState icon={<CalendarIcon size={32} />} title="Nenhum atendimento" message="Não há atendimentos para exibir." actionButton={{ label: "Novo Agendamento", onClick: openAgendamentoModal }} />; }
      return (
            <div className="space-y-3">
                  {items.map(at => (
                        <div key={at.id} className="p-4 bg-white border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/80">
                              <div className="flex-1 mb-3 sm:mb-0">
                                    <p className="font-semibold text-gray-800 text-base">{at.paciente}</p>
                                    <p className="text-sm text-gray-600">{at.tipo} - {at.profissional}</p>
                                    <p className="text-xs text-gray-400 mt-1">{at.data ? new Date(at.data + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data inválida'} - {at.setor}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap justify-end">
                                    <span className="text-base font-bold text-gray-700">{(Number(at.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusMap[at.status] || 'bg-gray-100'}`}>{at.status?.toUpperCase() || 'N/A'}</span>
                                    {at.status === 'Agendado' && (<div className="flex gap-2"> <button onClick={() => handleUpdateStatus(at, 'Confirmado')} className={`${secondaryButtonStyles} bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs px-2.5 py-1`}><Check size={14} className="mr-1" />Confirmar</button> <button onClick={() => handleUpdateStatus(at, 'Cancelado')} className={`${secondaryButtonStyles} bg-red-50 text-red-700 border-red-200 hover:bg-red-100 text-xs px-2.5 py-1`}><X size={14} className="mr-1" />Cancelar</button> </div>)}
                                    <button onClick={() => handleDeleteClick(at)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-4 w-4" /></button>
                              </div>
                        </div>
                  ))}
            </div>
      );
};

// ** Atendimentos **
const Atendimentos = ({ servicos = [], atendimentos = [], onUpdateAtendimento, onAddAtendimento, onDeleteAtendimento, onAddTransaction, financeiro = [], showToast, pacientes = [] }) => {
      const [showAgendamentoModal, setShowAgendamentoModal] = useState(false); const [showDeleteModal, setShowDeleteModal] = useState(false); const [itemToDelete, setItemToDelete] = useState(null); const [activeTab, setActiveTab] = useState('proximos'); const [isSubmitting, setIsSubmitting] = useState(false);
      const handleDeleteClick = (i) => { setItemToDelete(i); setShowDeleteModal(true); }; const confirmDelete = () => { if (itemToDelete) onDeleteAtendimento(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };
      const handleUpdateStatus = async (at, newStatus) => { const updated = { ...at, status: newStatus }; try { await onUpdateAtendimento(updated); if (newStatus === 'Confirmado') { const q = query(collection(db, 'financeiro'), where("atendimentoId", "==", at.id)); const snap = await getDocs(q); if (snap.empty) { const trans = { data: at.data, descricao: at.tipo, pagador: at.paciente, categoria: 'Atendimento Clínico', tipo: 'Entrada', valor: parseFloat(at.valor) || 0, status: 'A Receber', atendimentoId: at.id }; await onAddTransaction(trans); showToast('"A Receber" criado.', 'info'); } else { console.log("Transação já existe:", at.id); } } } catch (e) { console.error("Erro update status/criar trans:", e); } };
      const handleAddAtendimentoWrapper = async (newAt) => { setIsSubmitting(true); try { await onAddAtendimento(newAt); return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); } };
      const exportToPDF = () => { }; const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
      const proximos = useMemo(() => (atendimentos || []).filter(a => a.data >= today).sort((x, y) => new Date(x.data) - new Date(y.data)), [atendimentos, today]);
      const historico = useMemo(() => (atendimentos || []).filter(a => a.data < today).sort((x, y) => new Date(y.data) - new Date(x.data)), [atendimentos, today]);
      const openAgendamentoModal = () => setShowAgendamentoModal(true);

      return (<div className="space-y-4 sm:space-y-6"> <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Atendimentos</h1> <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto"> <button onClick={exportToPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button> <button onClick={openAgendamentoModal} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Agendamento</button> </div> </div> <div className="border-b"> <nav className="-mb-px flex space-x-6 sm:space-x-8"> {['proximos', 'historico'].map(t => (<button key={t} onClick={() => setActiveTab(t)} className={`${activeTab === t ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`} aria-current={activeTab === t ? 'page' : undefined}>{t === 'proximos' ? 'Próximos' : 'Histórico'}</button>))} </nav> </div> <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border min-h-[300px]"> {activeTab === 'proximos' ? <AtendimentoList items={proximos} handleUpdateStatus={handleUpdateStatus} handleDeleteClick={handleDeleteClick} openAgendamentoModal={openAgendamentoModal} /> : <AtendimentoList items={historico} handleUpdateStatus={handleUpdateStatus} handleDeleteClick={handleDeleteClick} openAgendamentoModal={openAgendamentoModal} />} </div> <AgendamentoModal show={showAgendamentoModal} onClose={() => setShowAgendamentoModal(false)} servicos={servicos} onAddAtendimento={handleAddAtendimentoWrapper} pacientes={pacientes} isSubmitting={isSubmitting} /> <ConfirmationModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar atendimento de "${itemToDelete?.paciente}"?`} /> </div>);
};

// ** PacienteModalForm **
const PacienteModalForm = ({ show, onClose, onSave, paciente, isSubmitting }) => {
      const [formData, setFormData] = useState({ nome: '', telefone: '', dataNascimento: '' }); useEffect(() => { if (show) { setFormData(paciente ? { nome: paciente.nome || '', telefone: paciente.telefone || '', dataNascimento: paciente.dataNascimento || '' } : { nome: '', telefone: '', dataNascimento: '' }); } }, [paciente, show]); const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value })); const handleSubmit = () => { const payload = paciente ? { ...paciente, ...formData } : formData; onSave(payload).then(() => { setFormData({ nome: '', telefone: '', dataNascimento: '' }); onClose(); }).catch(err => { }); };
      return (<FormModal show={show} onClose={onClose} title={paciente ? "Editar Paciente" : "Novo Paciente"} onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="nome" label="Nome Completo" value={formData.nome} onChange={handleChange} required /> <FormInput id="telefone" label="Telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" /> <FormInput id="dataNascimento" label="Data de Nascimento" type="date" value={formData.dataNascimento} onChange={handleChange} max={new Date().toISOString().split("T")[0]} /> </FormModal>);
};

// ** Pacientes **
const Pacientes = ({ pacientes = [], onAddPaciente, onUpdatePaciente, onDeletePaciente, showToast }) => {
      const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null); const [showDel, setShowDel] = useState(false); const [toDelete, setToDelete] = useState(null); const [isSubmitting, setIsSubmitting] = useState(false);
      const handleEdit = (p) => { setEditing(p); setShowModal(true); }; const handleClose = () => { setEditing(null); setShowModal(false); }; const handleSave = async (data) => { setIsSubmitting(true); try { if (editing) { await onUpdatePaciente({ ...editing, ...data }); } else { await onAddPaciente(data); } return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); } };
      const handleDeleteClick = (p) => { setToDelete(p); setShowDel(true); }; const confirmDelete = () => { if (toDelete) onDeletePaciente(toDelete.id); setShowDel(false); setToDelete(null); };
      const exportPDF = () => { }; const openNew = () => { setEditing(null); setShowModal(true); };
      const sorted = useMemo(() => [...(pacientes || [])].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), [pacientes]);

      return (<div className="space-y-4 sm:space-y-6"> <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Pacientes</h1> <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto"> <button onClick={exportPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button> <button onClick={openNew} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Paciente</button> </div> </div> <div className="bg-white rounded-2xl shadow-sm border overflow-hidden min-h-[300px]"> {sorted.length > 0 ? (<table className="w-full text-sm text-left"> <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"> <tr> <th className="px-6 py-3 font-semibold">Nome</th> <th className="px-6 py-3 font-semibold hidden sm:table-cell">Telefone</th> <th className="px-6 py-3 font-semibold hidden md:table-cell">Nascimento</th> <th className="px-6 py-3 font-semibold text-right">Ações</th> </tr> </thead> <tbody className="text-gray-700 divide-y"> {sorted.map((p) => (<tr key={p.id} className="hover:bg-gray-50"> <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{p.nome}</td> <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap">{p.telefone || '-'}</td> <td className="px-6 py-4 hidden md:table-cell whitespace-nowrap">{p.dataNascimento ? new Date(p.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td> <td className="px-6 py-4 text-right whitespace-nowrap"> <button onClick={() => handleEdit(p)} className={`${iconButtonStyles} text-blue-500 hover:text-blue-700`}><FilePenLine className="inline h-5 w-5" /></button> <button onClick={() => handleDeleteClick(p)} className={`${iconButtonStyles} text-red-500 hover:text-red-700 ml-4`}><Trash2 className="inline h-5 w-5" /></button> </td> </tr>))} </tbody> </table>) : (<EmptyState icon={<Users size={32} />} title="Nenhum paciente" message="Adicione o primeiro paciente." actionButton={{ label: "Novo Paciente", onClick: openNew }} />)} </div> <PacienteModalForm show={showModal} onClose={handleClose} onSave={handleSave} paciente={editing} isSubmitting={isSubmitting} /> <ConfirmationModal show={showDel} onClose={() => setShowDel(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar paciente "${toDelete?.nome}"?`} /> </div>);
};

// ** NovaTransacaoModal **
const NovaTransacaoModal = ({ show, onClose, onAddTransaction, servicos = [], pacientes = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: '', atendimentoId: null });
      useEffect(() => { if (show) { setFormData(p => ({ ...p, status: p.tipo === 'Entrada' ? 'Recebido' : 'Pago' })); } else { setFormData({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: 'Recebido', atendimentoId: null }); } }, [show]);
      const handleChange = (e) => { const { name, value } = e.target; setFormData(p => { const nS = { ...p, [name]: value }; if (name === 'tipo') { nS.status = value === 'Entrada' ? 'Recebido' : 'Pago'; } return nS; }); };
      const handleSubmit = () => { const v = parseFloat(String(formData.valor).replace(',', '.')) || 0; const p = { ...formData, valor: v, atendimentoId: formData.atendimentoId || null }; onAddTransaction(p, true).then(onClose).catch(err => { }); };
      const sOpts = useMemo(() => (servicos || []).map(s => <option key={s.id || s.nome} value={s.nome} />), [servicos]);
      const pOpts = useMemo(() => [...new Set((pacientes || []).map(p => p.nome))].map(p => <option key={p} value={p} />), [pacientes]);
      const stOpts = useMemo(() => (formData.tipo === 'Entrada' ? ['Recebido', 'A Receber'] : ['Pago', 'A Pagar']), [formData.tipo]);

      return (<FormModal show={show} onClose={onClose} title="Nova Transação" onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="data" label="Data" type="date" value={formData.data} onChange={handleChange} required /> <FormInput id="descricao" label="Descrição" value={formData.descricao} onChange={handleChange} list="servicos-fin-sug" placeholder="Serviço ou motivo" required /> <datalist id="servicos-fin-sug">{sOpts}</datalist> <FormInput id="pagador" label="Cliente/Origem" value={formData.pagador} onChange={handleChange} list="pacientes-fin-sug" placeholder="Nome" required /> <datalist id="pacientes-fin-sug">{pOpts}</datalist> <FormInput id="categoria" label="Categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Consulta, Despesa" required /> <div className="grid grid-cols-2 gap-4"> <FormSelect id="tipo" label="Tipo" value={formData.tipo} onChange={handleChange}><option>Entrada</option><option>Saída</option></FormSelect> <FormInput id="valor" label="Valor (R$)" value={formData.valor} onChange={handleChange} inputMode="decimal" placeholder="0,00" required /> </div> <FormSelect id="status" label="Status" value={formData.status} onChange={handleChange}>{stOpts.map(s => <option key={s} value={s}>{s}</option>)}</FormSelect> </FormModal>);
};

// ** Financeiro **
const Financeiro = ({ financeiro = [], onUpdateTransaction, onDeleteTransaction, servicos = [], onAddTransaction, showToast, pacientes = [] }) => {
      const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [showDel, setShowDel] = useState(false); const [toDelete, setToDelete] = useState(null); const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); const [showFilters, setShowFilters] = useState(false);
      const handleAdd = async (data, alert) => { setIsSubmitting(true); try { await onAddTransaction(data, alert); return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); } };
      const handleDeleteClick = (i) => { setToDelete(i); setShowDel(true); }; const confirmDelete = () => { if (toDelete) onDeleteTransaction(toDelete.id); setShowDel(false); setToDelete(null); };
      const handleUpdateStatus = async (id) => { const i = (financeiro || []).find(x => x.id === id); if (!i) return; let ns = i.status; if (i.status === 'A Receber') ns = 'Recebido'; else if (i.status === 'A Pagar') ns = 'Pago'; if (ns === i.status) return; try { await onUpdateTransaction({ id: i.id, status: ns }); } catch (e) { } };
      const filtered = useMemo(() => { const s = [...(financeiro || [])].sort((a, b) => new Date(b.data) - new Date(a.data)); return s.filter(f => { const t = search.toLowerCase(); const txt = !t || f.descricao?.toLowerCase().includes(t) || f.categoria?.toLowerCase().includes(t) || f.pagador?.toLowerCase().includes(t); const date = (!start || f.data >= start) && (!end || f.data <= end); return txt && date; }); }, [financeiro, search, start, end]);
      const clearFilters = () => { setSearch(''); setStart(''); setEnd(''); }; const exportCSV = () => { }; const exportPDF = () => { };
      const openNew = () => setShowModal(true); const toggleFilters = () => setShowFilters(p => !p);
      const totals = useMemo(() => { let e = 0, s = 0; filtered.forEach(t => { const v = Number(t.valor) || 0; if (t.tipo === 'Entrada' && t.status === 'Recebido') e += v; if (t.tipo === 'Saída' && t.status === 'Pago') s += v; }); return { entradas: e, saidas: s, saldo: e - s }; }, [filtered]);
      const formatCurrency = (v) => (typeof v !== 'number' || isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      return (<div className="space-y-4 sm:space-y-6"> <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Financeiro</h1> <div className="flex flex-row items-center flex-wrap gap-2 sm:gap-3 justify-center sm:justify-end w-full lg:w-auto"> <button onClick={toggleFilters} className={`${secondaryButtonStyles} px-3 py-1.5 text-xs sm:hidden`}>{showFilters ? <X size={16} className="mr-1" /> : <Filter size={16} className="mr-1" />} Filtros</button> <button onClick={exportPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button> <button onClick={exportCSV} className={`${infoButtonStyles} hidden sm:inline-flex px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><Download size={16} className="mr-1 sm:mr-1.5" /> CSV</button> <button onClick={openNew} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Nova Transação</button> </div> </div> <div className={`bg-white p-4 sm:p-6 rounded-2xl shadow-sm border ${showFilters ? 'block' : 'hidden'} sm:block`}> <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"> <div className="md:col-span-2"><FormInput id="search-fin" label="Pesquisar" placeholder="Descrição, categoria, cliente..." value={search} onChange={(e) => setSearch(e.target.value)} /></div> <FormInput id="startDate-fin" label="De" type="date" value={start} onChange={e => setStart(e.target.value)} /> <FormInput id="endDate-fin" label="Até" type="date" value={end} onChange={e => setEnd(e.target.value)} /> <div className="md:col-span-4 flex justify-end"><button onClick={clearFilters} className={`${secondaryButtonStyles} mt-2 md:mt-0 w-full md:w-auto text-sm py-2`}>Limpar</button></div> </div> </div> <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 bg-white p-4 rounded-2xl shadow-sm border"> <div><p className="text-xs font-medium text-gray-500">Entradas Recebidas</p><p className="text-lg font-bold text-green-600">{formatCurrency(totals.entradas)}</p></div> <div><p className="text-xs font-medium text-gray-500">Saídas Pagas</p><p className="text-lg font-bold text-red-600">{formatCurrency(totals.saidas)}</p></div> <div><p className="text-xs font-medium text-gray-500">Saldo no Período</p><p className={`text-lg font-bold ${totals.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(totals.saldo)}</p></div> </div> <div className="bg-white rounded-2xl shadow-sm border overflow-hidden min-h-[300px]"> {filtered.length > 0 ? (<> {/* Mobile */} <div className="sm:hidden divide-y">{filtered.map((tr) => { const c = tr.status === 'A Receber' || tr.status === 'A Pagar'; return (<div key={tr.id} className="p-4 space-y-1.5 hover:bg-gray-50"><div className="flex justify-between items-start gap-2"><span className="font-semibold text-gray-800 text-sm flex-grow truncate mr-2">{tr.descricao}</span><span className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200'} ${c ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => c && handleUpdateStatus(tr.id)}>{tr.status}</span></div><div className="flex justify-between items-center text-sm"><span className={`font-bold text-base ${tr.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(tr.valor)}</span><span className="text-gray-500 text-xs">{new Date(tr.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div><div className="text-xs text-gray-500 flex flex-wrap gap-x-4 pt-1">{tr.pagador && <span>Origem: <span className="text-gray-600">{tr.pagador}</span></span>} {tr.categoria && <span>Cat: <span className="text-gray-600">{tr.categoria}</span></span>}</div><div className="flex justify-end pt-1"><button onClick={() => handleDeleteClick(tr)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-4 w-4" /></button></div></div>); })}</div> {/* Desktop */} <div className="overflow-x-auto hidden sm:block"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Data</th><th className="px-6 py-3 font-semibold">Descrição</th><th className="px-6 py-3 font-semibold hidden md:table-cell">Cliente/Origem</th><th className="px-6 py-3 font-semibold hidden md:table-cell">Categoria</th><th className="px-6 py-3 font-semibold hidden sm:table-cell">Tipo</th><th className="px-6 py-3 font-semibold">Valor</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{filtered.map((tr) => { const c = tr.status === 'A Receber' || tr.status === 'A Pagar'; return (<tr key={tr.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap">{new Date(tr.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td className="px-6 py-4 font-medium text-gray-800">{tr.descricao}</td><td className="px-6 py-4 hidden md:table-cell">{tr.pagador}</td><td className="px-6 py-4 hidden md:table-cell">{tr.categoria}</td><td className="px-6 py-4 hidden sm:table-cell"><span className={`px-3 py-1 text-xs font-bold rounded-full ${tr.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{tr.tipo}</span></td><td className="px-6 py-4 font-bold whitespace-nowrap">{formatCurrency(tr.valor)}</td><td className="px-6 py-4 whitespace-nowrap"><span onClick={() => c && handleUpdateStatus(tr.id)} className={`px-3 py-1 text-xs font-semibold rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200'} ${c ? 'cursor-pointer hover:scale-105 hover:opacity-80' : ''}`}>{tr.status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteClick(tr)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-5 w-5" /></button></td></tr>); })}</tbody></table></div></>) : (<EmptyState icon={<Wallet size={32} />} title="Nenhuma transação" message="Crie uma nova ou ajuste os filtros." actionButton={{ label: "Nova Transação", onClick: openNew }} />)} </div> <NovaTransacaoModal show={showModal} onClose={() => setShowModal(false)} onAddTransaction={handleAdd} servicos={servicos} pacientes={pacientes} isSubmitting={isSubmitting} /> <ConfirmationModal show={showDel} onClose={() => setShowDel(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar transação "${toDelete?.descricao}"?`} /> </div>);
};

// ** NovoEstoqueModal **
const NovoEstoqueModal = ({ show, onClose, onAddItem, isSubmitting }) => {
      const [formData, setFormData] = useState({ item: '', categoria: '', consumoMedio: '', atual: '' }); useEffect(() => { if (!show) setFormData({ item: '', categoria: '', consumoMedio: '', atual: '' }); }, [show]); const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value })); const handleSubmit = () => { const c = parseInt(formData.consumoMedio, 10); const a = parseInt(formData.atual, 10); if (isNaN(c) || c < 0 || isNaN(a) || a < 0) { return; } onAddItem({ ...formData, consumoMedio: c, atual: a }).then(onClose).catch(err => { }); };
      return (<FormModal show={show} onClose={onClose} title="Novo Item de Estoque" onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="item" label="Nome do Item" value={formData.item} onChange={handleChange} required /> <FormInput id="categoria" label="Categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Material Escritório, Limpeza" required /> <div className="grid grid-cols-2 gap-4"><FormInput id="consumoMedio" label="Consumo Médio (Mensal)" type="number" value={formData.consumoMedio} onChange={handleChange} required inputMode="numeric" min="0" /> <FormInput id="atual" label="Estoque Atual" type="number" value={formData.atual} onChange={handleChange} required inputMode="numeric" min="0" /></div> </FormModal>);
};

// ** Estoque **
const Estoque = ({ estoque = [], onUpdateItem, onAddItem, onDeleteItem, showToast }) => {
      const [editing, setEditing] = useState(null); const [editV, setEditV] = useState(''); const [search, setSearch] = useState(''); const [showNew, setShowNew] = useState(false); const [showDel, setShowDel] = useState(false); const [toDelete, setToDelete] = useState(null); const [isSubmitting, setIsSubmitting] = useState(false);
      const handleAdd = async (item) => { setIsSubmitting(true); try { await onAddItem(item); return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); } };
      const handleDeleteClick = (i) => { setToDelete(i); setShowDel(true); }; const confirmDelete = () => { if (toDelete) onDeleteItem(toDelete.id); setShowDel(false); setToDelete(null); };
      const handleEdit = (i, f) => { setEditing({ item: i, field: f }); setEditV(String(i[f] ?? '')); }; const handleInlineChange = (e) => setEditV(e.target.value);
      const handleSave = async () => { if (!editing) return; const { item, field } = editing; const vS = editV.trim(); const vN = parseInt(vS, 10); if (vS === '' || isNaN(vN) || vN < 0) { showToast('Valor inválido.', 'error'); setEditing(null); return; } if (vN === item[field]) { setEditing(null); return; } try { await onUpdateItem({ id: item.id, [field]: vN }); } catch (e) { } finally { setEditing(null); } };
      const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } else if (e.key === 'Escape') { setEditing(null); } };
      const filtered = useMemo(() => { const f = (estoque || []).filter(i => i.item?.toLowerCase().includes(search.toLowerCase()) || i.categoria?.toLowerCase().includes(search.toLowerCase())); return f.sort((a, b) => (a.item || "").localeCompare(b.item || "")); }, [estoque, search]);
      const exportPDF = () => { }; const openNew = () => setShowNew(true);

      return (<div className="space-y-4 sm:space-y-6"> <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Estoque</h1> <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto"> <button onClick={exportPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button> <div className="relative flex-grow w-full sm:w-auto"><input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 sm:py-2.5 border rounded-lg w-full focus:ring-pink-400" /><Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /></div> <button onClick={openNew} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Item</button> </div> </div> <div className="bg-white rounded-2xl shadow-sm border overflow-hidden min-h-[300px]"> {filtered.length > 0 ? (<> {/* Mobile */} <div className="sm:hidden grid grid-cols-1 gap-3 p-4">{filtered.map((i) => { const c = Number(i.consumoMedio) || 0; const a = Number(i.atual) || 0; const m = Math.ceil(c * 0.3); const s = c > 0 && a <= m ? 'COMPRAR' : 'OK'; const isEA = editing?.item.id === i.id && editing?.field === 'atual'; const isEC = editing?.item.id === i.id && editing?.field === 'consumoMedio'; return (<div key={i.id} className="p-4 bg-white border rounded-xl shadow-sm space-y-2 hover:bg-gray-50"><div className="flex justify-between items-start gap-2"><span className="font-semibold text-gray-800 text-sm flex items-center"><Box size={14} className="mr-1.5 text-gray-400" />{i.item}</span><span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${s === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s}</span></div><div className="text-xs text-gray-500 pl-5">Cat: <span className="text-gray-600">{i.categoria}</span></div><div className="flex justify-between items-center text-sm pt-2 border-t mt-2"><div onClick={() => !isEC && handleEdit(i, 'consumoMedio')} className="cursor-pointer p-1 -m-1 rounded hover:bg-gray-100"><span className="text-xs text-gray-500">Cons. Médio: </span>{isEC ? (<input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-16 p-1 border rounded text-sm" autoFocus min="0" />) : (<span className="font-medium text-gray-700">{c}</span>)}</div><div onClick={() => !isEA && handleEdit(i, 'atual')} className="cursor-pointer p-1 -m-1 rounded hover:bg-gray-100"><span className="text-xs text-gray-500">Atual: </span>{isEA ? (<input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-16 p-1 border rounded text-sm" autoFocus min="0" />) : (<span className={`font-bold ${s === 'COMPRAR' ? 'text-red-600' : 'text-gray-800'}`}>{a}</span>)}</div></div><div className="flex justify-end pt-1"><button onClick={() => handleDeleteClick(i)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-4 w-4" /></button></div></div>); })}</div> {/* Desktop */} <div className="overflow-x-auto hidden sm:block"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Item</th><th className="px-6 py-3 font-semibold">Categoria</th><th className="px-6 py-3 font-semibold hidden sm:table-cell">Cons. Médio</th><th className="px-6 py-3 font-semibold">Atual</th><th className="px-6 py-3 font-semibold hidden md:table-cell">Mínimo (30%)</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{filtered.map((i) => { const c = Number(i.consumoMedio) || 0; const a = Number(i.atual) || 0; const m = Math.ceil(c * 0.3); const s = c > 0 && a <= m ? 'COMPRAR' : 'OK'; const isEA = editing?.item.id === i.id && editing?.field === 'atual'; const isEC = editing?.item.id === i.id && editing?.field === 'consumoMedio'; return (<tr key={i.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium text-gray-800">{i.item}</td><td className="px-6 py-4">{i.categoria}</td><td className="px-6 py-4 font-medium hidden sm:table-cell" onClick={() => !isEC && handleEdit(i, 'consumoMedio')}>{isEC ? <input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-20 p-1 border rounded" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-100 p-1 rounded-md">{c}</span>}</td><td className="px-6 py-4 font-medium" onClick={() => !isEA && handleEdit(i, 'atual')}>{isEA ? <input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-20 p-1 border rounded" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-100 p-1 rounded-md">{a}</span>}</td><td className="px-6 py-4 hidden md:table-cell text-gray-500">{m > 0 ? m : '-'}</td><td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${s === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteClick(i)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-5 w-5" /></button></td></tr>); })}</tbody></table></div></>) : (<EmptyState icon={<Box size={32} />} title="Nenhum item no estoque" message="Adicione itens para controlar." actionButton={{ label: "Novo Item", onClick: openNew }} />)} </div> <NovoEstoqueModal show={showNew} onClose={() => setShowNew(false)} onAddItem={handleAdd} isSubmitting={isSubmitting} /> <ConfirmationModal show={showDel} onClose={() => setShowDel(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar "${toDelete?.item}"?`} /> </div>);
};

// ** NovaRegraRepasseModal **
const NovaRegraRepasseModal = ({ show, onClose, onAddRepasse, servicosDisponivis = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ servico: '', tipo: 'Percentual', valor: '' }); useEffect(() => { if (!show) setFormData({ servico: '', tipo: 'Percentual', valor: '' }); }, [show]); const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value })); const handleSubmit = () => { if (!formData.valor || formData.valor.trim() === '') { return; } onAddRepasse({ ...formData }).then(onClose).catch(err => { }); };
      const sOpts = useMemo(() => (servicosDisponivis || []).map(s => <option key={s.id || s.nome} value={s.nome} />), [servicosDisponivis]);
      return (<FormModal show={show} onClose={onClose} title="Nova Regra de Repasse" onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="servico" label="Serviço" value={formData.servico} onChange={handleChange} list="serv-disp-sug" placeholder="Nome do serviço" required /> <datalist id="serv-disp-sug">{sOpts}</datalist> <div className="grid grid-cols-2 gap-4"><FormSelect id="tipo" label="Tipo (Comissão)" value={formData.tipo} onChange={handleChange}><option value="Percentual">Percentual</option><option value="Fixo">Fixo</option></FormSelect><FormInput id="valor" label="Valor" value={formData.valor} onChange={handleChange} placeholder={formData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: 50,00'} required /></div> </FormModal>);
};

// ** Configuracoes **
const Configuracoes = ({ servicos = [], onUpdateServico, repasses = [], onUpdateRepasse, onAddRepasse, onDeleteRepasse, onAddServico, onDeleteServico, showToast }) => {
      const [editing, setEditing] = useState(null); const [editData, setEditData] = useState({}); const [showNewRule, setShowNewRule] = useState(false); const [showDelRule, setShowDelRule] = useState(false); const [toDeleteRule, setToDeleteRule] = useState(null); const [newService, setNewService] = useState(''); const [isSubSvc, setIsSubSvc] = useState(false); const [isSubRuleModal, setIsSubRuleModal] = useState(false); const [isSubRuleInline, setIsSubRuleInline] = useState(false);
      const handleAddSvc = async (e) => { e.preventDefault(); if (newService.trim() === '') return; setIsSubSvc(true); try { await onAddServico({ nome: newService }); setNewService(''); } catch (e) { } finally { setIsSubSvc(false); } };
      const handleAddRule = async (data) => { setIsSubRuleModal(true); try { await onAddRepasse(data); return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubRuleModal(false); } };
      const handleDeleteRuleClick = (i) => { setToDeleteRule(i); setShowDelRule(true); }; const confirmDeleteRule = () => { if (toDeleteRule) onDeleteRepasse(toDeleteRule.id); setShowDelRule(false); setToDeleteRule(null); };
      const handleEditRule = (idx) => { setEditing(idx); setEditData({ ...(repasses[idx] || {}) }); }; const handleCancelEditRule = () => { setEditing(null); setEditData({}); }; const handleEditRuleChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });
      const handleSaveRule = async (idx) => { const item = repasses[idx]; const p = { id: item.id, ...editData }; if (!p.valor || String(p.valor).trim() === '') { showToast('Valor vazio.', 'error'); return; } setIsSubRuleInline(true); try { await onUpdateRepasse(p); } catch (e) { } finally { setEditing(null); setEditData({}); setIsSubRuleInline(false); } };
      const ruleServices = useMemo(() => new Set((repasses || []).map(r => r.servico)), [repasses]);
      const availableServices = useMemo(() => (servicos || []).filter(s => !ruleServices.has(s.nome)), [servicos, ruleServices]);
      const openNewRule = () => setShowNewRule(true);
      const sortedSvcs = useMemo(() => [...(servicos || [])].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), [servicos]);
      const sortedRules = useMemo(() => [...(repasses || [])].sort((a, b) => (a.servico || "").localeCompare(b.servico || "")), [repasses]);

      return (<div className="space-y-6 sm:space-y-8"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Configurações</h1> {/* Serviços */} <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border"> <h3 className="text-xl font-semibold text-gray-700 mb-5">Gestão de Serviços</h3> <form onSubmit={handleAddSvc} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"> <div className="flex-grow"><FormInput id="novo-servico" value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="Nome do novo serviço" required /></div> <button type="submit" className={`${primaryButtonStyles} w-full sm:w-auto py-2.5 text-sm`} disabled={isSubSvc}>{isSubSvc && <Loader2 className="animate-spin h-5 w-5 mr-1.5" />} Adicionar</button> </form> <div className="overflow-x-auto min-h-[150px]">{sortedSvcs.length > 0 ? (<table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Serviço</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{sortedSvcs.map((s) => (<tr key={s.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{s.nome}</td><td className="px-6 py-4 text-right"><button onClick={() => onDeleteServico(s.id)} className={`${iconButtonStyles} text-red-500 hover:text-red-700`}><Trash2 className="inline h-5 w-5" /></button></td></tr>))}</tbody></table>) : (<div className="pt-4"><EmptyState icon={<FilePlus size={32} />} title="Nenhum serviço" message="Adicione serviços." /></div>)}</div> </div> {/* Repasses */} <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border"> <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-4"> <h3 className="text-xl font-semibold text-gray-700">Regras de Repasse (Comissão)</h3> <button onClick={openNewRule} className={`${primaryButtonStyles} py-2 text-sm`}>Nova Regra</button> </div> <div className="overflow-x-auto min-h-[150px]">{sortedRules.length > 0 ? (<table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Serviço</th><th className="px-6 py-3 font-semibold">Tipo</th><th className="px-6 py-3 font-semibold">Valor</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{sortedRules.map((r, idx) => (<tr key={r.id} className={`hover:bg-gray-50 ${isSubRuleInline && editing === idx ? 'opacity-50' : ''}`}><td className="px-6 py-4 font-medium">{r.servico}</td>{editing === idx ? (<> <td className="px-6 py-4"><select name="tipo" value={editData.tipo} onChange={handleEditRuleChange} className="w-full p-1.5 border rounded" disabled={isSubRuleInline}><option value="Percentual">Percentual</option><option value="Fixo">Fixo</option></select></td> <td className="px-6 py-4"><input name="valor" type="text" value={editData.valor} onChange={handleEditRuleChange} placeholder={editData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: 50,00'} className="w-full p-1.5 border rounded" disabled={isSubRuleInline} /></td> <td className="px-6 py-4 text-right whitespace-nowrap"><button onClick={() => handleSaveRule(idx)} className={`${iconButtonStyles} text-green-600 hover:text-green-700`} disabled={isSubRuleInline}>{isSubRuleInline ? <Loader2 className="animate-spin h-5 w-5" /> : <Check size={20} />}</button><button onClick={handleCancelEditRule} className={`${iconButtonStyles} text-gray-500 hover:text-gray-700 ml-2`} disabled={isSubRuleInline}><X size={20} /></button></td></>) : (<> <td className="px-6 py-4">{r.tipo}</td><td className="px-6 py-4 font-bold">{r.valor}</td><td className="px-6 py-4 text-right whitespace-nowrap"><button onClick={() => handleEditRule(idx)} className={`${iconButtonStyles} text-blue-500 hover:text-blue-700`}><FilePenLine className="inline h-5 w-5" /></button><button onClick={() => handleDeleteRuleClick(r)} className={`${iconButtonStyles} text-red-500 hover:text-red-700 ml-4`}><Trash2 className="inline h-5 w-5" /></button></td></>)}</tr>))}</tbody></table>) : (<div className="pt-4"><EmptyState icon={<FilePlus size={32} />} title="Nenhuma regra" message="Adicione regras de comissão." actionButton={{ label: "Nova Regra", onClick: openNewRule }} /></div>)}</div> </div> {/* Modais */} <NovaRegraRepasseModal show={showNewRule} onClose={() => setShowNewRule(false)} onAddRepasse={handleAddRule} servicosDisponivis={availableServices} isSubmitting={isSubRuleModal} /> <ConfirmationModal show={showDelRule} onClose={() => setShowDelRule(false)} onConfirm={confirmDeleteRule} title="Confirmar Exclusão" message={`Apagar regra para "${toDeleteRule?.servico}"?`} /> </div>);
};


// --- Componente Principal App ---
// Adicionando a linha export default aqui
export default function App() {
      const [currentPage, setCurrentPage] = useState('dashboard');
      const [estoque, setEstoque] = useState(null); const [financeiro, setFinanceiro] = useState(null); const [servicos, setServicos] = useState(null); const [atendimentos, setAtendimentos] = useState(null); const [repasses, setRepasses] = useState(null); const [pacientes, setPacientes] = useState(null);
      const [isSidebarOpen, setIsSidebarOpen] = useState(false);
      const [loading, setLoading] = useState(true);
      const [toasts, setToasts] = useState([]);
      const [user, setUser] = useState(undefined);

      // --- Funções Toast ---
      const showToast = (message, type = 'info') => { const id = Date.now() + Math.random(); const msg = typeof message === 'string' ? message : 'Ok.'; setToasts(p => { if (p.some(t => t.message === msg && t.type === type)) return p; return [...p, { id, message: msg, type }]; }); };
      const removeToast = (id) => { setToasts(prev => prev.filter(toast => toast.id !== id)); };

      // --- Funções Firestore CRUD (Genéricas) ---
      const firestoreOps = (collectionName, stateSetter, sortFn = null) => ({
            add: async (item, successMessage) => { try { const { id, ...dataToAdd } = item; const docRef = await addDoc(collection(db, collectionName), dataToAdd); const newItem = { ...dataToAdd, id: docRef.id }; stateSetter(prev => { const newState = [newItem, ...(prev || [])]; return sortFn ? sortFn(newState) : newState; }); if (successMessage) showToast(successMessage, 'success'); return newItem; } catch (error) { console.error(`Add ${collectionName}:`, error); showToast(`Erro ao salvar ${collectionName.slice(0, -1)}.`, 'error'); throw error; } },
            update: async (item, successMessage) => { if (!item?.id) { const e = `ID inválido ${collectionName}`; console.error(e, item); showToast(e, 'error'); throw new Error(e); } try { const docRef = doc(db, collectionName, item.id); const { id, ...dataToUpdate } = item; await updateDoc(docRef, dataToUpdate); const updatedItem = { ...dataToUpdate, id: id }; stateSetter(prev => { const newState = (prev || []).map(i => i.id === id ? updatedItem : i); return sortFn ? sortFn(newState) : newState; }); if (successMessage) showToast(successMessage, 'success'); return updatedItem; } catch (error) { console.error(`Update ${collectionName} ${item.id}:`, error); showToast(`Erro ao atualizar ${collectionName.slice(0, -1)}.`, 'error'); throw error; } },
            remove: async (id, successMessage) => { if (!id) { const e = `ID inválido ${collectionName}`; console.error(e); showToast(e, 'error'); throw new Error(e); } try { await deleteDoc(doc(db, collectionName, id)); stateSetter(prev => (prev || []).filter(i => i.id !== id)); if (successMessage) showToast(successMessage, 'success'); } catch (error) { console.error(`Remove ${collectionName} ${id}:`, error); showToast(`Erro ao remover ${collectionName.slice(0, -1)}.`, 'error'); throw error; } }
      });

      // --- Sort Functions ---
      const sortAtendimentos = (a) => (a || []).sort((x, y) => new Date(y.data) - new Date(x.data)); const sortFinanceiro = (a) => (a || []).sort((x, y) => new Date(y.data) - new Date(x.data)); const sortEstoque = (a) => (a || []).sort((x, y) => (x.item || "").localeCompare(y.item || "")); const sortServicos = (a) => (a || []).sort((x, y) => (x.nome || "").localeCompare(y.nome || "")); const sortRepasses = (a) => (a || []).sort((x, y) => (x.servico || "").localeCompare(y.servico || "")); const sortPacientes = (a) => (a || []).sort((x, y) => (x.nome || "").localeCompare(y.nome || ""));

      // --- CRUD Ops Instances ---
      const atendimentoOps = useMemo(() => firestoreOps('atendimentos', setAtendimentos, sortAtendimentos), []);
      const financeiroOps = useMemo(() => firestoreOps('financeiro', setFinanceiro, sortFinanceiro), []);
      const estoqueOps = useMemo(() => firestoreOps('estoque', setEstoque, sortEstoque), []);
      const servicoOps = useMemo(() => firestoreOps('servicos', setServicos, sortServicos), []);
      const repasseOps = useMemo(() => firestoreOps('repasses', setRepasses, sortRepasses), []);
      const pacienteOps = useMemo(() => firestoreOps('pacientes', setPacientes, sortPacientes), []);

      // --- Handlers ---
      const handleAddAtendimento = (i) => atendimentoOps.add(i, 'Agendamento salvo!'); const handleAddTransaction = (i, a) => financeiroOps.add(i, a ? 'Transação adicionada!' : null); const handleAddItem = (i) => estoqueOps.add(i, 'Item adicionado!'); const handleAddRepasse = (i) => repasseOps.add(i, 'Regra adicionada!'); const handleAddServico = (i) => servicoOps.add(i, 'Serviço adicionado!'); const handleAddPaciente = (i) => pacienteOps.add(i, 'Paciente adicionado!');
      const handleUpdateAtendimento = (i) => atendimentoOps.update(i, null);
      const handleUpdateTransaction = (item) => { if (Object.keys(item).length === 2 && item.id && item.status) { const c = (financeiro || []).find(f => f.id === item.id); if (c) { return financeiroOps.update({ ...c, status: item.status }, 'Status atualizado!'); } else { const e = "Item não encontrado"; console.error(e, item.id); showToast(e, 'error'); return Promise.reject(new Error(e)); } } else { return financeiroOps.update(item, 'Transação atualizada!'); } };
      const handleUpdateItemEstoque = (i) => estoqueOps.update(i, 'Estoque atualizado!'); const handleUpdateRepasse = (i) => repasseOps.update(i, 'Regra atualizada!'); const handleUpdateServico = (i) => servicoOps.update(i, 'Serviço atualizado!'); const handleUpdatePaciente = (i) => pacienteOps.update(i, 'Paciente atualizado!');
      const handleDeleteAtendimento = (id) => atendimentoOps.remove(id, 'Atendimento apagado!'); const handleDeleteTransaction = (id) => financeiroOps.remove(id, 'Transação apagada!'); const handleDeleteItemEstoque = (id) => estoqueOps.remove(id, 'Item apagado!'); const handleDeleteRepasse = (id) => repasseOps.remove(id, 'Regra apagada!'); const handleDeleteServico = (id) => servicoOps.remove(id, 'Serviço apagado!'); const handleDeletePaciente = (id) => pacienteOps.remove(id, 'Paciente apagado!');

      // --- fetchData ---
      const fetchData = async () => {
            console.log("fetchData called");
            const collectionsMap = { atendimentos: { setter: setAtendimentos, sorter: orderBy('data', 'desc') }, financeiro: { setter: setFinanceiro, sorter: orderBy('data', 'desc') }, estoque: { setter: setEstoque, sorter: orderBy('item', 'asc') }, servicos: { setter: setServicos, sorter: orderBy('nome', 'asc') }, repasses: { setter: setRepasses, sorter: orderBy('servico', 'asc') }, pacientes: { setter: setPacientes, sorter: orderBy('nome', 'asc') } };
            try {
                  const promises = Object.entries(collectionsMap).map(async ([name, config]) => { try { const q = query(collection(db, name), config.sorter); const snap = await getDocs(q); const data = snap.docs.map(d => ({ id: d.id, ...d.data() })); config.setter(data); return { status: 'fulfilled' }; } catch (e) { console.error(`Fetch ${name}:`, e); config.setter([]); showToast(`Erro ${name}.`, 'error'); return { status: 'rejected' }; } });
                  await Promise.allSettled(promises); console.log("fetchData completed.");
            } catch (e) { console.error("fetchData setup error:", e); showToast('Erro crítico.', 'error'); Object.values(collectionsMap).forEach(c => c.setter([])); }
            // Loading é controlado no useEffect do Auth
      };

      // Efeito Tema
      useEffect(() => { document.documentElement.classList.remove('dark'); localStorage.removeItem('theme'); }, []);

      // Efeito Auth
      useEffect(() => {
            console.log("Auth listener setup."); setLoading(true); // Assume loading no início
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                  console.log("Auth state changed:", currentUser?.uid);
                  setUser(currentUser); // Atualiza ANTES de buscar
                  if (currentUser) {
                        console.log("User logged in. Fetching data...");
                        await fetchData(); // Busca dados
                        setLoading(false); // Para loading APÓS buscar dados
                  } else {
                        console.log("User logged out.");
                        setAtendimentos(null); setFinanceiro(null); setEstoque(null); setServicos(null); setRepasses(null); setPacientes(null); setLoading(false); // Limpa e para loading
                  }
            });
            return () => { console.log("Auth listener cleanup."); unsubscribe(); };
            // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []); // Roda só uma vez

      // --- Logout ---
      const handleLogout = async () => { try { await signOut(auth); showToast('Sessão terminada.', 'info'); setCurrentPage('dashboard'); } catch (e) { console.error("Logout:", e); showToast('Erro ao sair.', 'error'); } };

      // --- Renderização ---
      const pageTitles = { dashboard: "Dashboard", atendimentos: "Atendimentos", pacientes: "Pacientes", financeiro: "Financeiro", estoque: "Estoque", configuracoes: "Configurações" };

      const renderPage = () => {
            const safeEstoque = estoque || []; const safeAtendimentos = atendimentos || []; const safeFinanceiro = financeiro || []; const safeRepasses = repasses || []; const safeServicos = servicos || []; const safePacientes = pacientes || [];
            switch (currentPage) {
                  case 'dashboard': return <Dashboard estoque={safeEstoque} atendimentos={safeAtendimentos} financeiro={safeFinanceiro} repasses={safeRepasses} />;
                  case 'atendimentos': return <Atendimentos servicos={safeServicos} atendimentos={safeAtendimentos} onUpdateAtendimento={handleUpdateAtendimento} financeiro={safeFinanceiro} onAddAtendimento={handleAddAtendimento} onDeleteAtendimento={handleDeleteAtendimento} onAddTransaction={handleAddTransaction} showToast={showToast} pacientes={safePacientes} />;
                  case 'pacientes': return <Pacientes pacientes={safePacientes} onAddPaciente={handleAddPaciente} onDeletePaciente={handleDeletePaciente} onUpdatePaciente={handleUpdatePaciente} showToast={showToast} />;
                  case 'financeiro': return <Financeiro financeiro={safeFinanceiro} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} servicos={safeServicos} onAddTransaction={handleAddTransaction} showToast={showToast} pacientes={safePacientes} />;
                  case 'estoque': return <Estoque estoque={safeEstoque} onUpdateItem={handleUpdateItemEstoque} onAddItem={handleAddItem} onDeleteItem={handleDeleteItemEstoque} showToast={showToast} />;
                  case 'configuracoes': return <Configuracoes servicos={safeServicos} onUpdateServico={handleUpdateServico} repasses={safeRepasses} onUpdateRepasse={handleUpdateRepasse} onAddRepasse={handleAddRepasse} onDeleteRepasse={handleDeleteRepasse} onAddServico={handleAddServico} onDeleteServico={handleDeleteServico} showToast={showToast} />;
                  default: return <Dashboard estoque={safeEstoque} atendimentos={safeAtendimentos} financeiro={safeFinanceiro} repasses={safeRepasses} />;
            }
      };

      // Renderização condicional principal
      if (user === undefined || loading) { console.log("Render: Loading..."); return <LoadingSpinner />; }
      if (!user) { console.log("Render: AuthPage."); return <AuthPage showToast={showToast} />; }

      // Render App Logado
      console.log("Render: Main App.");
      return (
            <div className="flex min-h-screen bg-slate-50 font-sans text-gray-800">
                  <style>{`@keyframes fade-in-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes fade-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-10px)}}@keyframes fade-in{from{opacity:0}to{opacity:1}}.animate-fade-in-up{animation:fade-in-up .5s ease-out forwards}.animate-fade-out{animation:fade-out .4s ease-in forwards}.animate-fade-in{animation:fade-in .3s ease-out forwards}@keyframes scale-in{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#f1f1f1;border-radius:10px}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:10px}::-webkit-scrollbar-thumb:hover{background:#9ca3af}`}</style>
                  <ToastContainer toasts={toasts} removeToast={removeToast} />
                  <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />
                  {isSidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}
                  <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
                        <Header onMenuClick={() => setIsSidebarOpen(true)} title={pageTitles[currentPage] || "Clínica"} />
                        <div className="flex-grow p-4 md:p-6 lg:p-8">
                              {/* Renderiza a página - loading já tratado antes */}
                              {renderPage()}
                        </div>
                  </main>
            </div>
      );
}

// --- Funções Auxiliares --- (Nenhuma neste caso)