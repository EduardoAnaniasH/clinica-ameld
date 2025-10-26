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

// --- Configuração do Firebase ---
const firebaseConfig = {
      apiKey: "AIzaSyDbMWkQDM70GGqsuqTgdeYbNhi8unPApeQ",
      authDomain: "clinica-ameld-app.firebaseapp.com",
      projectId: "clinica-ameld-app",
      storageBucket: "clinica-ameld-app.appspot.com",
      messagingSenderId: "326580479289",
      appId: "1:326580479289:web:40f4d93b4056a504aaf4e8",
      measurementId: "G-PXZWZVF581"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- URL da API ---
// Certifique-se de que este é o endereço correto do seu backend e que ele está rodando.
const API_URL = 'http://localhost:3001';

// --- Estilos Base para Botões (Refinados) ---
// Adicionado shadow-md base, hover:shadow-xl, transition mais rápida, active:translate-y-px para efeito de clique
const baseButtonStyles = "inline-flex items-center justify-center px-5 py-2 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] active:translate-y-px shadow-md hover:shadow-xl transform hover:-translate-y-px";
const primaryButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 focus:ring-pink-500`; // Gradiente suave
const secondaryButtonStyles = `${baseButtonStyles} bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400 border border-gray-200 hover:border-gray-300`; // Fundo mais claro, borda sutil
const destructiveButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-500`; // Gradiente destrutivo
const infoButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 focus:ring-blue-500`; // Gradiente informativo
const linkButtonStyles = "text-pink-600 hover:text-pink-500 font-medium focus:outline-none focus:ring-1 focus:ring-pink-400 rounded transition-colors duration-150"; // Cor ligeiramente mais escura
const iconButtonStyles = "p-1.5 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:bg-gray-100"; // Padding ligeiramente maior e fundo no hover

// --- Componentes Auxiliares ---

const LoadingSpinner = () => (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
);

const EmptyState = ({ icon, title, message, actionButton }) => (
      // Fundo ligeiramente mais claro, sombra mais suave
      // Mantido bg-white aqui, pois é um estado vazio dentro do container principal
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

// Toast Component com estado de saída (Sem alterações visuais aqui)
const Toast = ({ id, message, type, onClose, removeToast }) => {
      const [isExiting, setIsExiting] = useState(false);

      useEffect(() => {
            const exitTimer = setTimeout(() => {
                  setIsExiting(true);
                  const removeTimer = setTimeout(() => {
                        removeToast(id);
                  }, 400);
                  return () => clearTimeout(removeTimer);
            }, 4600);

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
            }, 400);
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
      <div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-xs sm:max-w-sm"> {/* Aumentado space-y */}
            {toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} removeToast={removeToast} />)}
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
            <div className="fixed inset-0 bg-black/70 z-40 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}> {/* Fundo mais escuro */}
                  <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transition-transform transform scale-95 z-50 max-h-[90vh] overflow-y-auto"
                        style={{ animation: 'scale-in 0.3s ease-out forwards' }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 sticky top-0 bg-white pt-2 -mt-2"> {/* Borda sutil no header */}
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h3>
                              <button onClick={onClose} className={`${iconButtonStyles} text-gray-400 hover:text-gray-600 focus:ring-gray-400 -mr-2`} aria-label="Fechar modal"><X size={24} /></button> {/* Ícone em vez de texto */}
                        </div>
                        {children}
                  </div>
            </div>
      );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmLabel = "Apagar", confirmIcon = <Trash2 size={18} />, cancelLabel = "Cancelar", cancelIcon = <X size={18} />, isDestructive = true }) => {
      if (!show) return null;
      return (
            <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}> {/* Fundo mais escuro */}
                  <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transition-transform transform scale-95"
                        style={{ animation: 'scale-in 0.3s ease-out forwards' }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center mb-4">
                              <div className={`mr-3 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-blue-100'} sm:h-12 sm:w-12`}>
                                    {isDestructive ? <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" /> : <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />}
                              </div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h3>
                        </div>
                        <p className="text-gray-600 mb-8 ml-13 sm:ml-15">{message}</p> {/* Alinha com o texto do título */}
                        <div className="flex justify-end space-x-3">
                              <button type="button" onClick={onClose} className={secondaryButtonStyles}><span className="mr-1">{cancelIcon}</span>{cancelLabel}</button> {/* Adiciona margin ao ícone */}
                              <button type="button" onClick={onConfirm} className={isDestructive ? destructiveButtonStyles : primaryButtonStyles}><span className="mr-1">{confirmIcon}</span>{confirmLabel}</button> {/* Adiciona margin ao ícone */}
                        </div>
                  </div>
            </div>
      );
};

const FormModal = ({ show, onClose, title, children, onSubmit, isSubmitting }) => (
      <Modal show={show} onClose={onClose} title={title}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5"> {/* Aumentado space-y */}
                  {children}
                  <div className="flex justify-end space-x-3 pt-5 border-t border-gray-100 mt-8"> {/* Aumentado padding/margin top */}
                        <button type="button" onClick={onClose} className={secondaryButtonStyles} disabled={isSubmitting}><X size={18} className="mr-1.5" /> Cancelar</button> {/* Ajuste margem ícone */}
                        <button type="submit" className={primaryButtonStyles} disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Check size={18} className="mr-1.5" />} {/* Ajuste margem ícone */}
                              {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                  </div>
            </form>
      </Modal>
);

// Campos de formulário com estilo consistente
const FormInput = ({ id, label, type = "text", value, onChange, required = false, autoComplete, placeholder, list, inputMode }) => (
      <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>} {/* Aumentado margin bottom, condicional */}
            <input
                  id={id}
                  name={id} // Assumindo que name é igual ao id
                  type={type}
                  value={value}
                  onChange={onChange}
                  required={required}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  list={list}
                  inputMode={inputMode}
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-150 ease-in-out" // Padding ligeiramente maior, cor de foco
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
                  className="mt-1 block w-full pl-4 pr-10 py-2.5 border border-gray-300 bg-white text-gray-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-150 ease-in-out" // Padding e cor de foco
            >
                  {children}
            </select>
      </div>
);

// --- Componentes Específicos das Páginas ---

// ** MOVIDO AuthPage PARA ANTES do App **
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
                  else if (err.code === 'auth/user-not-found') friendlyError = 'Usuário não encontrado.';
                  else if (err.code === 'auth/wrong-password') friendlyError = 'Senha incorreta.';
                  else if (err.code === 'auth/weak-password') friendlyError = 'Senha muito fraca (mínimo 6 caracteres).';
                  else if (err.code === 'auth/email-already-in-use') friendlyError = 'Este e-mail já está em uso.';
                  setError(friendlyError);
                  showToast(`Falha no ${errorMsgBase}.`, 'error');
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
                              <form className="space-y-6" onSubmit={handleRegister}>
                                    {renderFormFields(true)}
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    {renderSubmitButton('Registrar', 'Registrando...')}
                              </form>
                              <div className="text-sm text-center mt-6"><span className="text-gray-500">Já tem uma conta? </span><button onClick={() => setPage('login')} className={linkButtonStyles}>Entrar</button></div>
                        </>
                  );
                  case 'forgot': return (
                        <>
                              <p className="text-center text-gray-600 mb-6">Insira o seu e-mail para receber um link de recuperação.</p>
                              <form className="space-y-6" onSubmit={handlePasswordReset}>
                                    {renderFormFields()}
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    {renderSubmitButton('Enviar E-mail', 'Enviando...')}
                              </form>
                              <div className="text-sm text-center mt-6"><button onClick={() => setPage('login')} className={linkButtonStyles}>Voltar para o Login</button></div>
                        </>
                  );
                  default: return ( // Login page
                        <>
                              <form className="space-y-6" onSubmit={handleLogin}>
                                    {renderFormFields()}
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    <div className="text-sm text-right"><button type="button" onClick={() => setPage('forgot')} className={linkButtonStyles}>Esqueceu a senha?</button></div>
                                    {renderSubmitButton('Entrar', 'Entrando...')}
                              </form>
                              <div className="text-sm text-center mt-6"><span className="text-gray-500">Não tem uma conta? </span><button onClick={() => setPage('register')} className={linkButtonStyles}>Registre-se</button></div>
                        </>
                  );
            }
      };

      return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
                  <div className="w-full max-w-md p-8 sm:p-10 space-y-6 bg-white rounded-2xl shadow-xl">
                        <div className="text-center">
                              <img src="/public/logo(2).png" alt="AMELDY logo" className="h-14 mx-auto mb-4" />
                              <p className="text-gray-500">Bem-vindo(a)! Faça login para continuar.</p>
                        </div>
                        {renderContent()}
                  </div>
            </div>
      );
};

// ** MOVIDO Sidebar PARA ANTES do App **
const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen, onLogout }) => {
      const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-5 w-5 mr-3" /> },
            { id: 'atendimentos', label: 'Atendimentos', icon: <CalendarIcon className="h-5 w-5 mr-3" /> },
            { id: 'pacientes', label: 'Pacientes', icon: <Users className="h-5 w-5 mr-3" /> },
            { id: 'financeiro', label: 'Financeiro', icon: <Wallet className="h-5 w-5 mr-3" /> },
            { id: 'estoque', label: 'Estoque', icon: <Box className="h-5 w-5 mr-3" /> },
            { id: 'configuracoes', label: 'Configurações', icon: <Settings className="h-5 w-5 mr-3" /> },
      ];
      // Removido mx-4 dos links de navegação
      const linkClasses = (id) => `flex items-center px-4 py-3 text-gray-700 hover:text-pink-600 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-1 ${currentPage === id ? 'bg-pink-100 text-pink-600 font-semibold shadow-sm' : 'hover:bg-gray-50'}`;
      const sidebarClasses = `fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
      const handleLinkClick = (pageId) => { setCurrentPage(pageId); if (window.innerWidth < 1024) setIsOpen(false); };

      return (
            <aside className={sidebarClasses}>
                  {/* Logo alinhada à esquerda */}
                  <div className="h-20 flex items-center px-4 border-b border-gray-100 relative">
                        <img src="/public/logo(2).png" alt="AMELDY (logo rosa)" className="h-10" />
                        <button onClick={() => setIsOpen(false)} className={`${iconButtonStyles} text-gray-500 lg:hidden focus:ring-gray-400 absolute right-4 top-1/2 -translate-y-1/2`} aria-label="Fechar menu lateral">
                              <X className="h-6 w-6" />
                        </button>
                  </div>
                  {/* Navegação */}
                  <nav className="flex-1 px-4 py-6 space-y-1.5">
                        {navItems.map(item => <button key={item.id} className={`${linkClasses(item.id)} w-full text-left`} onClick={() => handleLinkClick(item.id)}>{item.icon}{item.label}</button>)}
                  </nav>
                  {/* Botão Sair alinhado à esquerda */}
                  <div className="p-4 border-t border-gray-100">
                        <button onClick={onLogout} className={`flex items-center w-full text-red-600 font-medium rounded-lg hover:bg-red-50 focus:ring-red-400 justify-start px-4 py-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1`}>
                              <LogOut className="h-5 w-5 mr-3" />Sair
                        </button>
                  </div>
            </aside>
      );
};

// ** MOVIDO Header PARA ANTES do App **
const Header = ({ onMenuClick, title }) => (
      // Exibe apenas em telas menores que lg (`lg:hidden`)
      // Usa flex para alinhar itens e justificar espaço entre eles
      <header className="lg:hidden bg-white sticky top-0 z-10 flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 border-b border-gray-100 shadow-sm">
            {/* Botão de Menu à esquerda */}
            <button onClick={onMenuClick} className={`${iconButtonStyles} text-gray-600 focus:ring-gray-400`} aria-label="Abrir menu lateral"><Menu className="h-6 w-6" /></button>

            {/* Título da Página Centralizado */}
            {/* flex-grow permite que o span ocupe o espaço disponível */}
            {/* text-center centraliza o texto dentro do span */}
            <span className="flex-grow text-center text-lg font-semibold text-gray-700 truncate px-2">
                  {title}
            </span>

            {/* Espaçador invisível à direita para equilibrar com o botão de menu */}
            {/* Garante que o título fique centralizado horizontalmente */}
            {/* Ajuste o `w-` (width) para corresponder aproximadamente à largura do botão de menu + padding */}
            <div className="w-10"></div>
      </header>
);

// ** MOVIDO AtendimentosChart PARA ANTES do App **
// ** MOVIDO AtendimentosChart PARA ANTES do App **
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

// ** MOVIDO DailyRevenueChart PARA ANTES do App **
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

// ** MOVIDO StatCard PARA ANTES do App **
// Componente StatCard com layout vertical mobile
const StatCard = ({ icon, title, value, subtitle, colorClass }) => (
      // Layout vertical por padrão, sm: horizontal
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-100 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 transition-all duration-300 hover:shadow-lg min-h-[100px] sm:min-h-[90px]">
            {/* Ícone */}
            <div className={`rounded-lg p-2.5 flex-shrink-0 mx-auto sm:mx-0 ${colorClass?.bg || 'bg-gray-100'}`}>
                  {/* Usa React.cloneElement para passar o size */}
                  {React.isValidElement(icon) ? React.cloneElement(icon, { size: 20 }) : icon}
            </div>
            {/* Conteúdo textual */}
            <div className="flex-grow overflow-hidden text-center sm:text-left">
                  <p className="text-xs font-medium text-gray-500 truncate">{title || 'Título'}</p>
                  {/* Tamanho da fonte responsivo, SEM truncate */}
                  <p className={`text-base sm:text-lg font-bold ${colorClass?.text || 'text-gray-800'}`}>{value || '0'}</p>
                  {/* Subtítulo com truncate */}
                  {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
      </div>
);


// ** MOVIDO Dashboard PARA ANTES do App **
const Dashboard = ({ estoque, atendimentos, financeiro, repasses }) => {
      const today = new Date();
      const dateString = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const formatCurrency = (v) => (typeof v !== 'number' || isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const totals = useMemo(() => {
            let faturamentoBruto = 0, despesaPaga = 0, repassesRecebidos = 0;
            (financeiro || []).forEach(t => {
                  const valor = Number(t.valor) || 0;
                  if (t.tipo === 'Entrada' && t.status === 'Recebido') faturamentoBruto += valor;
                  if (t.tipo === 'Saída' && t.status === 'Pago') despesaPaga += valor;
                  const regra = (repasses || []).find(r => r.servico === t.descricao);
                  if (regra && t.tipo === 'Entrada' && t.status === 'Recebido') {
                        if (regra.tipo === 'Percentual') {
                              const percent = parseFloat(String(regra.valor).replace('%', '')) / 100;
                              if (!isNaN(percent)) repassesRecebidos += valor * percent;
                        } else if (regra.tipo === 'Fixo') {
                              const fixo = parseFloat(String(regra.valor).replace(/[^0-9,.-]+/g, "").replace(",", "."));
                              if (!isNaN(fixo)) repassesRecebidos += Math.min(fixo, valor);
                        }
                  }
            });
            return { faturamentoBruto, despesaPaga, repassesRecebidos, saldoEmCaixa: faturamentoBruto - despesaPaga };
      }, [financeiro, repasses]);

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

      const itensParaComprar = useMemo(() =>
            (estoque || []).filter(item => {
                  const consumo = Number(item.consumoMedio) || 0; const atual = Number(item.atual) || 0;
                  const minimo = Math.ceil(consumo * 0.3); return consumo > 0 && atual <= minimo;
            }), [estoque]);

      return (
            // Gap reduzido
            <div className="space-y-6">
                  {/* Título oculto em mobile, visível em lg */}
                  <div className="text-center sm:text-left hidden lg:block">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Olá, Bem-vindo(a)!</h1>
                        <p className="text-gray-500">{dateString}</p>
                  </div>
                  {/* Grid alterado para 2 colunas por padrão */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <StatCard title="Faturamento Bruto" value={formatCurrency(totals.faturamentoBruto)} subtitle="Total de entradas" icon={<TrendingUp className="text-blue-600" />} colorClass={{ bg: "bg-blue-100", text: "text-blue-600" }} />
                        <StatCard title="Comissão Clínica" value={formatCurrency(totals.repassesRecebidos)} subtitle="Valor recebido" icon={<ArrowLeftRight className="text-orange-600" />} colorClass={{ bg: "bg-orange-100", text: "text-orange-600" }} />
                        <StatCard title="Despesa Paga" value={formatCurrency(totals.despesaPaga)} icon={<CreditCard className="text-red-600" />} colorClass={{ bg: "bg-red-100", text: "text-red-600" }} />
                        <StatCard title="Saldo em Caixa" value={formatCurrency(totals.saldoEmCaixa)} subtitle="Entradas - Saídas" icon={<DollarSign className="text-green-600" />} colorClass={{ bg: "bg-green-100", text: "text-green-600" }} />
                  </div>
                  {/* Grid ajustado */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm">
                              <h3 className="text-base font-semibold text-amber-800 mb-3 flex items-center"><AlertTriangle className="h-5 w-5 mr-1.5 text-amber-500" /> Avisos de Estoque</h3>
                              {itensParaComprar.length > 0 ? (
                                    <div className="space-y-2"><p className="text-xs text-amber-700 mb-2">Itens com estoque baixo:</p><ul className="space-y-1.5 max-h-48 overflow-y-auto pr-2">{itensParaComprar.map(item => <li key={item.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white hover:shadow-sm transition-shadow border border-amber-100"><span className="text-gray-700 font-medium truncate mr-2" title={item.item}>{item.item}</span><span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full text-[10px] flex-shrink-0">{item.atual} unid.</span></li>)}</ul></div>
                              ) : (<div className="text-center py-4"><CheckCircle2 className="h-8 w-8 mx-auto text-green-400" /><p className="text-xs text-gray-500 mt-2 font-medium">Estoque em dia!</p><p className="text-[11px] text-gray-400">Nenhum item abaixo do mínimo.</p></div>)}
                        </div>
                        <div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><h3 className="text-base font-semibold text-gray-700 mb-4">Faturamento (Recebido) - Últimos 7 Dias</h3><DailyRevenueChart data={dailyRevenueData} /></div>
                        <div className="md:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><h3 className="text-base font-semibold text-gray-700 mb-4">Atendimentos por Setor</h3><AtendimentosChart atendimentos={atendimentos} /></div>
                  </div>
            </div>
      );
};

// ** MOVIDO AgendamentoModal PARA ANTES do App **
const AgendamentoModal = ({ show, onClose, servicos = [], onAddAtendimento, pacientes = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ paciente: '', profissional: 'Enf.ª Andreia', servico: '', valor: '' });
      const uniquePacientes = useMemo(() => [...new Set((pacientes || []).map(p => p.nome))], [pacientes]);
      const uniqueServicos = useMemo(() => (servicos || []), [servicos]);

      const handleChange = (e) => {
            const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value }));
      };

      const handleSubmit = () => {
            const valorNumerico = parseFloat(String(formData.valor).replace(',', '.')) || 0;
            const newAtendimento = { data: new Date().toISOString().slice(0, 10), paciente: formData.paciente, profissional: formData.profissional, tipo: formData.servico, valor: valorNumerico, setor: 'Consultório', status: 'Agendado' };
            onAddAtendimento(newAtendimento)
                  .then(() => { setFormData({ paciente: '', profissional: 'Enf.ª Andreia', servico: '', valor: '' }); onClose(); })
                  .catch(err => console.error("Erro ao adicionar atendimento no modal:", err));
      };

      const servicoOptions = uniqueServicos.map(s => <option key={s.id || s.nome} value={s.nome} />);
      const pacienteOptions = uniquePacientes.map(p => <option key={p} value={p} />);

      return (
            <FormModal show={show} onClose={onClose} title="Novo Agendamento" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <FormInput id="paciente" label="Paciente" value={formData.paciente} onChange={handleChange} list="pacientes-sugestoes" placeholder="Digite o nome" required />
                  <datalist id="pacientes-sugestoes">{pacienteOptions}</datalist>
                  <FormSelect id="profissional" label="Profissional" value={formData.profissional} onChange={handleChange}>
                        <option>Enf.ª Andreia</option>
                        <option>Tec. Bruno</option>
                        <option>Enf.ª Ana</option>
                        <option>Tec. Marilia</option>
                        <option>Dr Ciarline</option>
                  </FormSelect>
                  <FormInput id="servico" label="Serviço" value={formData.servico} onChange={handleChange} list="servicos-sugestoes" placeholder="Digite o nome do serviço" required />
                  <datalist id="servicos-sugestoes">{servicoOptions}</datalist>
                  <FormInput id="valor" label="Valor (R$)" value={formData.valor} onChange={handleChange} placeholder="0,00" required inputMode="decimal" />
            </FormModal>
      );
};

// ** MOVIDO AtendimentoList PARA ANTES do App **
const AtendimentoList = ({ items, handleUpdateStatus, handleDeleteClick, openAgendamentoModal }) => {
      if (!items || items.length === 0) {
            return <EmptyState icon={<CalendarIcon size={32} />} title="Nenhum atendimento" message="Não há atendimentos para exibir nesta seção." actionButton={{ label: "Novo Agendamento", onClick: openAgendamentoModal }} />;
      }
      return (
            <div className="space-y-3"> {/* Espaçamento menor */}
                  {items.map(at => (
                        <div key={at.id} className="p-4 bg-white border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/80 transition-colors duration-150"> {/* MANTIDO BG-WHITE AQUI */}
                              <div className="flex-1 mb-3 sm:mb-0">
                                    <p className="font-semibold text-gray-800 text-base">{at.paciente}</p> {/* Fonte ligeiramente menor, semibold */}
                                    <p className="text-sm text-gray-600">{at.tipo} - {at.profissional}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(at.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {at.setor}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap justify-end"> {/* Gap menor */}
                                    <span className="text-base font-bold text-gray-700">{(Number(at.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusMap[at.status] || 'bg-gray-100 text-gray-700'}`}>{at.status?.toUpperCase() || 'N/A'}</span> {/* Padding e fonte ajustados */}
                                    {at.status === 'Agendado' && (
                                          <div className="flex gap-2">
                                                {/* Botões menores */}
                                                <button onClick={() => handleUpdateStatus(at, 'Confirmado')} className={`${secondaryButtonStyles} bg-green-50 text-green-700 border-green-200 hover:bg-green-100 focus:ring-green-300 text-xs px-2.5 py-1 shadow-sm hover:shadow-md`}><Check size={14} className="mr-1" />Confirmar</button>
                                                <button onClick={() => handleUpdateStatus(at, 'Cancelado')} className={`${secondaryButtonStyles} bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus:ring-red-300 text-xs px-2.5 py-1 shadow-sm hover:shadow-md`}><X size={14} className="mr-1" />Cancelar</button>
                                          </div>
                                    )}
                                    <button onClick={() => handleDeleteClick(at)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 hover:bg-red-50 focus:ring-red-300`} aria-label="Apagar atendimento"><Trash2 className="h-4 w-4" /></button> {/* Ícone menor */}
                              </div>
                        </div>
                  ))}
            </div>
      );
};

// ** MOVIDO Atendimentos PARA ANTES do App **
const Atendimentos = ({ servicos = [], atendimentos = [], onUpdateAtendimento, onAddAtendimento, onDeleteAtendimento, onAddTransaction, financeiro = [], showToast, pacientes = [] }) => {
      const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [activeTab, setActiveTab] = useState('proximos');
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleDeleteClick = (item) => { setItemToDelete(item); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeleteAtendimento(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };

      const handleUpdateStatus = async (atendimento, newStatus) => {
            const updatedItem = { ...atendimento, status: newStatus };
            try {
                  await onUpdateAtendimento(updatedItem);
                  if (newStatus === 'Confirmado') {
                        const existingTransaction = (financeiro || []).find(t => t.atendimentoId === atendimento.id);
                        if (!existingTransaction) {
                              const newTransaction = { data: atendimento.data, descricao: atendimento.tipo, pagador: atendimento.paciente, categoria: 'Atendimento Clínico', tipo: 'Entrada', valor: parseFloat(atendimento.valor) || 0, status: 'A Receber', atendimentoId: atendimento.id };
                              await onAddTransaction(newTransaction);
                              showToast('Lançamento "A Receber" criado automaticamente.', 'info');
                        }
                  }
            } catch (error) { console.error("Erro ao atualizar status do atendimento:", error); }
      };

      const handleAddAtendimentoWrapper = async (newAtendimento) => {
            setIsSubmitting(true);
            try {
                  await onAddAtendimento(newAtendimento);
            } finally {
                  setIsSubmitting(false);
            }
      };

      const exportToPDF = () => { /* ... Implementação ... */ };
      const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
      const proximosAtendimentos = useMemo(() => (atendimentos || []).filter(at => at.data >= today).sort((a, b) => new Date(a.data) - new Date(b.data)), [atendimentos, today]);
      const historicoAtendimentos = useMemo(() => (atendimentos || []).filter(at => at.data < today).sort((a, b) => new Date(b.data) - new Date(a.data)), [atendimentos, today]);
      const openAgendamentoModal = () => setShowAgendamentoModal(true);

      return (
            <div className="space-y-4 sm:space-y-6"> {/* Espaçamento menor */}
                  {/* Cabeçalho */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        {/* Título da seção (oculto em mobile, visível em lg) */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left hidden lg:block">Atendimentos</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto"> {/* Gap menor, largura ajustada */}
                              <button onClick={exportToPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button>
                              <button onClick={openAgendamentoModal} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Agendamento</button>
                        </div>
                  </div>
                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs"> {/* Space ajustado */}
                              {['proximos', 'historico'].map(tab => (
                                    <button
                                          key={tab}
                                          onClick={() => setActiveTab(tab)}
                                          className={`${activeTab === tab ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-pink-300 rounded-t-sm`} // Padding bottom menor
                                          aria-current={activeTab === tab ? 'page' : undefined}
                                    >
                                          {tab === 'proximos' ? 'Próximos' : 'Histórico'}
                                    </button>
                              ))}
                        </nav>
                  </div>
                  {/* Conteúdo - Alterado bg-gray-50 para bg-white */}
                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]"> {/* Sombra e borda suaves */}
                        {activeTab === 'proximos'
                              ? <AtendimentoList items={proximosAtendimentos} handleUpdateStatus={handleUpdateStatus} handleDeleteClick={handleDeleteClick} openAgendamentoModal={openAgendamentoModal} />
                              : <AtendimentoList items={historicoAtendimentos} handleUpdateStatus={handleUpdateStatus} handleDeleteClick={handleDeleteClick} openAgendamentoModal={openAgendamentoModal} />
                        }
                  </div>
                  <AgendamentoModal
                        show={showAgendamentoModal}
                        onClose={() => setShowAgendamentoModal(false)}
                        servicos={servicos}
                        onAddAtendimento={handleAddAtendimentoWrapper}
                        pacientes={pacientes}
                        isSubmitting={isSubmitting}
                  />
                  <ConfirmationModal
                        show={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={confirmDelete}
                        title="Confirmar Exclusão"
                        message={`Tem a certeza que deseja apagar o atendimento de "${itemToDelete?.paciente}"? Esta ação não pode ser desfeita.`}
                  />
            </div>
      );
};

// ** MOVIDO PacienteModalForm PARA ANTES do App **
const PacienteModalForm = ({ show, onClose, onSave, paciente, isSubmitting }) => {
      const [formData, setFormData] = useState({ nome: '', telefone: '', dataNascimento: '' });

      useEffect(() => {
            if (show) {
                  if (paciente) {
                        setFormData({ nome: paciente.nome || '', telefone: paciente.telefone || '', dataNascimento: paciente.dataNascimento || '' });
                  } else {
                        setFormData({ nome: '', telefone: '', dataNascimento: '' });
                  }
            }
      }, [paciente, show]);

      const handleChange = (e) => {
            setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
      };

      const handleSubmit = () => {
            const payload = paciente ? { ...paciente, ...formData } : formData;
            onSave(payload)
                  .then(() => {
                        setFormData({ nome: '', telefone: '', dataNascimento: '' });
                        onClose();
                  })
                  .catch(err => console.error("Erro ao salvar paciente no modal:", err));
      };

      return (
            <FormModal show={show} onClose={onClose} title={paciente ? "Editar Paciente" : "Novo Paciente"} onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <FormInput id="nome" label="Nome Completo" value={formData.nome} onChange={handleChange} required />
                  <FormInput id="telefone" label="Telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
                  <FormInput id="dataNascimento" label="Data de Nascimento" type="date" value={formData.dataNascimento} onChange={handleChange} max={new Date().toISOString().split("T")[0]} />
            </FormModal>
      );
};

// ** MOVIDO Pacientes PARA ANTES do App **
const Pacientes = ({ pacientes = [], onAddPaciente, onUpdatePaciente, onDeletePaciente, showToast }) => {
      const [showModal, setShowModal] = useState(false);
      const [editingPaciente, setEditingPaciente] = useState(null);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleEdit = (paciente) => { setEditingPaciente(paciente); setShowModal(true); };
      const handleCloseModal = () => { setEditingPaciente(null); setShowModal(false); };

      const handleSavePacienteWrapper = async (pacienteData) => {
            setIsSubmitting(true);
            try {
                  if (editingPaciente) {
                        await onUpdatePaciente(pacienteData);
                  } else {
                        await onAddPaciente(pacienteData);
                  }
            } catch (error) {
                  // Erro já tratado
            } finally {
                  setIsSubmitting(false);
            }
      };

      const handleDeleteClick = (paciente) => { setItemToDelete(paciente); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeletePaciente(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };
      const exportToPDF = () => { /* ... Implementação ... */ };
      const openNovoPacienteModal = () => { setEditingPaciente(null); setShowModal(true); };

      return (
            <div className="space-y-4 sm:space-y-6"> {/* Espaçamento menor */}
                  {/* Cabeçalho */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        {/* Título da seção (oculto em mobile, visível em lg) */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left hidden lg:block">Pacientes</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto"> {/* Gap menor, largura ajustada */}
                              <button onClick={exportToPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button>
                              <button onClick={openNovoPacienteModal} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Paciente</button>
                        </div>
                  </div>
                  {/* Container da Lista/Tabela - Alterado bg-gray-50 para bg-white */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
                        {(pacientes || []).length > 0 ? (
                              <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100"> {/* Fundo thead cinza claro */}
                                          <tr>
                                                <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Nome</th>
                                                <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden sm:table-cell">Telefone</th>
                                                <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden md:table-cell">Data de Nascimento</th>
                                                <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold text-right">Ações</th>
                                          </tr>
                                    </thead>
                                    <tbody className="text-gray-700 divide-y divide-gray-100">
                                          {(pacientes || []).map((p) => (<tr key={p.id} className="hover:bg-gray-50 transition-colors duration-150"> {/* Hover cinza claro */}
                                                <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium text-gray-800 whitespace-nowrap">{p.nome}</td>
                                                <td className="px-2 py-2 sm:px-6 sm:py-4 hidden sm:table-cell whitespace-nowrap text-gray-600">{p.telefone || '-'}</td>
                                                <td className="px-2 py-2 sm:px-6 sm:py-4 hidden md:table-cell whitespace-nowrap text-gray-600">{p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                                                <td className="px-2 py-2 sm:px-6 sm:py-4 text-right whitespace-nowrap">
                                                      <button onClick={() => handleEdit(p)} className={`${iconButtonStyles} text-blue-500 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-300`} aria-label="Editar paciente"><FilePenLine className="inline h-5 w-5" /></button> {/* Hover com cor */}
                                                      <button onClick={() => handleDeleteClick(p)} className={`${iconButtonStyles} text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 sm:ml-4 focus:ring-red-300`} aria-label="Apagar paciente"><Trash2 className="inline h-5 w-5" /></button> {/* Hover com cor */}
                                                </td>
                                          </tr>))}
                                    </tbody>
                              </table>
                        ) : (<EmptyState icon={<Users size={32} />} title="Nenhum paciente registado" message="Adicione o seu primeiro paciente para começar." actionButton={{ label: "Novo Paciente", onClick: openNovoPacienteModal }} />)}
                  </div>
                  <PacienteModalForm
                        show={showModal}
                        onClose={handleCloseModal}
                        onSave={handleSavePacienteWrapper}
                        paciente={editingPaciente}
                        isSubmitting={isSubmitting}
                  />
                  <ConfirmationModal
                        show={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={confirmDelete}
                        title="Confirmar Exclusão"
                        message={`Tem a certeza que deseja apagar o paciente "${itemToDelete?.nome}"?`}
                  />
            </div>
      );
};

// ** MOVIDO NovaTransacaoModal PARA ANTES do App **
const NovaTransacaoModal = ({ show, onClose, onAddTransaction, servicos = [], pacientes = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: 'Recebido' });
      const uniquePacientes = useMemo(() => [...new Set((pacientes || []).map(p => p.nome))], [pacientes]);
      const uniqueServicos = useMemo(() => (servicos || []), [servicos]);

      const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

      const handleSubmit = () => {
            const valorNumerico = parseFloat(String(formData.valor).replace(',', '.')) || 0;
            const transactionPayload = { ...formData, valor: valorNumerico };
            onAddTransaction(transactionPayload, true)
                  .then(() => {
                        setFormData({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: 'Recebido' });
                        onClose();
                  }).catch(err => console.error("Erro ao salvar transação:", err));
      };

      const servicoOptions = uniqueServicos.map(s => <option key={s.id || s.nome} value={s.nome} />);
      const pacienteOptions = uniquePacientes.map(p => <option key={p} value={p} />);

      return (
            <FormModal show={show} onClose={onClose} title="Nova Transação" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <FormInput id="data" label="Data" type="date" value={formData.data} onChange={handleChange} required />
                  <FormInput id="descricao" label="Descrição" value={formData.descricao} onChange={handleChange} list="servicos-fin-sug" placeholder="Serviço ou motivo" required />
                  <datalist id="servicos-fin-sug">{servicoOptions}</datalist>
                  <FormInput id="pagador" label="Cliente/Origem" value={formData.pagador} onChange={handleChange} list="pacientes-fin-sug" placeholder="Nome do cliente ou fornecedor" required />
                  <datalist id="pacientes-fin-sug">{pacienteOptions}</datalist>
                  <FormInput id="categoria" label="Categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Consulta, Despesa Fixa" required />
                  <div className="grid grid-cols-2 gap-4">
                        <FormSelect id="tipo" label="Tipo" value={formData.tipo} onChange={handleChange}>
                              <option>Entrada</option>
                              <option>Saída</option>
                        </FormSelect>
                        <FormInput id="valor" label="Valor (R$)" value={formData.valor} onChange={handleChange} inputMode="decimal" placeholder="0,00" required />
                  </div>
                  <FormSelect id="status" label="Status" value={formData.status} onChange={handleChange}>
                        <option>Recebido</option>
                        <option>A Receber</option>
                        <option>Pago</option>
                        <option>A Pagar</option>
                  </FormSelect>
            </FormModal>
      );
};

// ** MOVIDO Financeiro PARA ANTES do App **
const Financeiro = ({ financeiro = [], onUpdateTransaction, onDeleteTransaction, servicos = [], onAddTransaction, showToast, pacientes = [] }) => {
      const [searchTerm, setSearchTerm] = useState('');
      const [showModal, setShowModal] = useState(false);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [startDate, setStartDate] = useState('');
      const [endDate, setEndDate] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [showFilters, setShowFilters] = useState(false);

      const handleAddTransactionWrapper = async (transactionData, showAlert) => {
            setIsSubmitting(true);
            try { await onAddTransaction(transactionData, showAlert); } finally { setIsSubmitting(false); }
      };

      const handleDeleteClick = (item) => { setItemToDelete(item); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeleteTransaction(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };

      const handleUpdateStatus = async (id) => {
            const itemToUpdate = financeiro.find(item => item.id === id); if (!itemToUpdate) return;
            let newStatus = itemToUpdate.status;
            if (itemToUpdate.status === 'A Receber') newStatus = 'Recebido'; else if (itemToUpdate.status === 'A Pagar') newStatus = 'Pago';
            if (newStatus === itemToUpdate.status) return;
            try { await onUpdateTransaction({ ...itemToUpdate, status: newStatus }); showToast(`Status atualizado para ${newStatus}!`, 'success'); } catch (error) { console.error("Erro ao atualizar status financeiro:", error); }
      };

      const filteredFinanceiro = useMemo(() => (financeiro || []).filter(f => {
            const term = searchTerm.toLowerCase();
            const textMatch = !term || f.descricao?.toLowerCase().includes(term) || f.categoria?.toLowerCase().includes(term) || f.pagador?.toLowerCase().includes(term);
            const dateMatch = (!startDate || f.data >= startDate) && (!endDate || f.data <= endDate);
            return textMatch && dateMatch;
      }), [financeiro, searchTerm, startDate, endDate]);

      const clearFilters = () => { setSearchTerm(''); setStartDate(''); setEndDate(''); };
      const exportToCSV = () => { /* ... */ };
      const exportToPDF = () => { /* ... */ };
      const openNovaTransacaoModal = () => setShowModal(true);
      const toggleFilters = () => setShowFilters(prev => !prev);

      return (
            <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        {/* Título da seção (oculto em mobile, visível em lg) */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left hidden lg:block">Financeiro</h1>
                        <div className="flex flex-row items-center flex-wrap gap-2 sm:gap-3 justify-center sm:justify-end w-full lg:w-auto">
                              <button onClick={toggleFilters} className={`${secondaryButtonStyles} px-3 py-1.5 text-xs sm:hidden`}> {showFilters ? <X size={16} className="mr-1" /> : <Filter size={16} className="mr-1" />} Filtros </button>
                              <button onClick={exportToPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button>
                              <button onClick={exportToCSV} className={`${infoButtonStyles} hidden sm:inline-flex px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><Download size={16} className="mr-1 sm:mr-1.5" /> Exportar CSV</button>
                              <button onClick={openNovaTransacaoModal} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Nova Transação</button>
                        </div>
                  </div>
                  {/* Filtros - Alterado bg-gray-50 para bg-white */}
                  <div className={`bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 ${showFilters ? 'block' : 'hidden'} sm:block transition-all duration-300 ease-in-out`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                              <div className="md:col-span-2"> <FormInput id="search-fin" label="Pesquisar" placeholder="Descrição, categoria, cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> </div>
                              <FormInput id="startDate-fin" label="De" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                              <FormInput id="endDate-fin" label="Até" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                              <div className="md:col-span-2 flex justify-end"> <button onClick={clearFilters} className={`${secondaryButtonStyles} mt-2 md:mt-0 w-full md:w-auto text-sm py-2`}>Limpar Filtros</button> </div>
                        </div>
                  </div>
                  {/* Conteúdo Principal - Alterado bg-gray-50 para bg-white */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
                        {filteredFinanceiro.length > 0 ? (
                              <>
                                    <div className="sm:hidden divide-y divide-gray-100">
                                          {/* Mobile Card Items */}
                                          {filteredFinanceiro.map((tr) => {
                                                const isClickable = tr.status === 'A Receber' || tr.status === 'A Pagar';
                                                // Alterado hover:bg-gray-100 para hover:bg-gray-50
                                                return (<div key={tr.id} className="p-4 space-y-1.5 hover:bg-gray-50 transition-colors duration-150"> <div className="flex justify-between items-start gap-2"> <span className="font-semibold text-gray-800 text-sm flex-grow truncate mr-2">{tr.descricao}</span> <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200 text-gray-800'} ${isClickable ? 'cursor-pointer' : ''}`} onClick={() => isClickable && handleUpdateStatus(tr.id)}>{tr.status}</span> </div> <div className="flex justify-between items-center text-sm"> <span className={`font-bold text-base ${tr.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{(Number(tr.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> <span className="text-gray-500 text-xs">{new Date(tr.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span> </div> <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 pt-1"> {tr.pagador && <span>Origem: <span className="text-gray-600">{tr.pagador}</span></span>} {tr.categoria && <span>Cat: <span className="text-gray-600">{tr.categoria}</span></span>} </div> <div className="flex justify-end pt-1"> <button onClick={() => handleDeleteClick(tr)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 hover:bg-red-50 focus:ring-red-300`} aria-label="Apagar transação"><Trash2 className="h-4 w-4" /></button> </div> </div>);
                                          })}
                                    </div>
                                    <div className="overflow-x-auto hidden sm:block">
                                          <table className="w-full text-sm text-left">
                                                {/* Alterado bg-gray-100 para bg-gray-50 no thead */}
                                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                                      <tr>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Data</th>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Descrição</th>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden md:table-cell">Cliente/Origem</th>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden md:table-cell">Categoria</th>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden sm:table-cell">Tipo</th>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Valor</th>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Status</th>
                                                            <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold text-right">Ações</th>
                                                      </tr>
                                                </thead>
                                                <tbody className="text-gray-700 text-xs sm:text-sm divide-y divide-gray-100">
                                                      {filteredFinanceiro.map((tr) => {
                                                            const isClickable = tr.status === 'A Receber' || tr.status === 'A Pagar';
                                                            // Alterado hover:bg-gray-100 para hover:bg-gray-50
                                                            return (<tr key={tr.id} className="hover:bg-gray-50 transition-colors duration-150"> <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap">{new Date(tr.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium text-gray-800">{tr.descricao}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 hidden md:table-cell text-gray-600">{tr.pagador}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 hidden md:table-cell text-gray-600">{tr.categoria}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 hidden sm:table-cell"><span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-bold rounded-full ${tr.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{tr.tipo}</span></td> <td className="px-2 py-2 sm:px-6 sm:py-4 font-bold whitespace-nowrap">{(Number(tr.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap"><span onClick={() => isClickable && handleUpdateStatus(tr.id)} className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200 text-gray-800'} ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}>{tr.status}</span></td> <td className="px-2 py-2 sm:px-6 sm:py-4 text-right"><button onClick={() => handleDeleteClick(tr)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 hover:bg-red-50 focus:ring-red-300`} aria-label="Apagar transação"><Trash2 className="h-5 w-5" /></button></td> </tr>);
                                                      })}
                                                </tbody>
                                          </table>
                                    </div>
                              </>
                        ) : (<EmptyState icon={<Wallet size={32} />} title="Nenhuma transação encontrada" message="Crie uma nova transação ou ajuste os filtros." actionButton={{ label: "Nova Transação", onClick: openNovaTransacaoModal }} />)}
                  </div>
                  <NovaTransacaoModal show={showModal} onClose={() => setShowModal(false)} onAddTransaction={handleAddTransactionWrapper} servicos={servicos} pacientes={pacientes} isSubmitting={isSubmitting} />
                  <ConfirmationModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem a certeza que deseja apagar a transação "${itemToDelete?.descricao}"?`} />
            </div>
      );
};

// ** MOVIDO NovoEstoqueModal PARA ANTES do App **
const NovoEstoqueModal = ({ show, onClose, onAddItem, isSubmitting }) => {
      const [formData, setFormData] = useState({ item: '', categoria: '', consumoMedio: '', atual: '' });
      const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

      const handleSubmit = () => {
            const itemPayload = { ...formData, consumoMedio: parseInt(formData.consumoMedio, 10) || 0, atual: parseInt(formData.atual, 10) || 0 };
            onAddItem(itemPayload)
                  .then(() => { setFormData({ item: '', categoria: '', consumoMedio: '', atual: '' }); onClose(); })
                  .catch(err => console.error("Erro ao adicionar item:", err));
      };

      return (
            <FormModal show={show} onClose={onClose} title="Novo Item de Estoque" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <FormInput id="item" label="Nome do Item" value={formData.item} onChange={handleChange} required />
                  <FormInput id="categoria" label="Categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Material Escritório, Limpeza" required />
                  <div className="grid grid-cols-2 gap-4">
                        <FormInput id="consumoMedio" label="Consumo Médio" type="number" value={formData.consumoMedio} onChange={handleChange} required inputMode="numeric" />
                        <FormInput id="atual" label="Estoque Atual" type="number" value={formData.atual} onChange={handleChange} required inputMode="numeric" />
                  </div>
            </FormModal>
      );
};

// ** MOVIDO Estoque PARA ANTES do App **
const Estoque = ({ estoque = [], onUpdateItem, onAddItem, onDeleteItem, showToast }) => {
      const [editingItem, setEditingItem] = useState(null);
      const [editValue, setEditValue] = useState('');
      const [searchTerm, setSearchTerm] = useState('');
      const [showNovoItemModal, setShowNovoItemModal] = useState(false);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [isSubmitting, setIsSubmitting] = useState(false);

      const handleAddItemWrapper = async (itemData) => {
            setIsSubmitting(true);
            try { await onAddItem(itemData); } finally { setIsSubmitting(false); }
      };

      const handleDeleteClick = (item) => { setItemToDelete(item); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeleteItem(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };

      const handleEdit = (item, field) => { setEditingItem({ item, field }); setEditValue(String(item[field])); };
      const handleSaveInline = async () => {
            if (!editingItem) return;
            const { item, field } = editingItem;
            const newValue = parseInt(editValue, 10);
            if (isNaN(newValue) || newValue < 0) { setEditingItem(null); return; }
            try { await onUpdateItem({ ...item, [field]: newValue }); } catch (e) { console.error("Erro inline edit estoque:", e); } finally { setEditingItem(null); }
      };
      const handleInlineChange = (e) => setEditValue(e.target.value);
      const handleInlineKeyDown = (e) => { if (e.key === 'Enter') handleSaveInline(); else if (e.key === 'Escape') setEditingItem(null); };

      const filteredEstoque = useMemo(() => (estoque || []).filter(item =>
            item.item?.toLowerCase().includes(searchTerm.toLowerCase()) || item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      ), [estoque, searchTerm]);

      const exportToPDF = () => { /* ... */ };
      const openNovoItemModal = () => setShowNovoItemModal(true);

      return (
            <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        {/* Título da seção (oculto em mobile, visível em lg) */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left hidden lg:block">Controle de Estoque</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto">
                              <button onClick={exportToPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button>
                              <div className="relative flex-grow w-full sm:w-auto">
                                    <input type="text" placeholder="Pesquisar item..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg w-full focus:ring-pink-400 focus:border-pink-400" />
                                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                              <button onClick={openNovoItemModal} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Item</button>
                        </div>
                  </div>
                  {/* Conteúdo Principal - Alterado bg-gray-50 para bg-white */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
                        {filteredEstoque.length > 0 ? (
                              <>
                                    {/* Layout de Cartões para Mobile */}
                                    <div className="sm:hidden grid grid-cols-1 gap-3 p-4">
                                          {filteredEstoque.map((item) => {
                                                const consumo = Number(item.consumoMedio) || 0; const atual = Number(item.atual) || 0; const minimo = Math.ceil(consumo * 0.3); const status = consumo > 0 && atual <= minimo ? 'COMPRAR' : 'OK'; const isEditingAtual = editingItem?.item.id === item.id && editingItem?.field === 'atual'; const isEditingConsumo = editingItem?.item.id === item.id && editingItem?.field === 'consumoMedio';
                                                // Alterado hover:bg-gray-100 para hover:bg-gray-50
                                                return (<div key={item.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2 hover:bg-gray-50 transition-colors duration-150"> <div className="flex justify-between items-start gap-2"> <span className="font-semibold text-gray-800 text-sm flex items-center"><Box size={14} className="mr-1.5 text-gray-400" />{item.item}</span> <span className={`flex-shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full ${status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</span> </div> <div className="text-xs text-gray-500 pl-5">Categoria: <span className="text-gray-600">{item.categoria}</span></div> <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100 mt-2"> <div onClick={() => !isEditingConsumo && handleEdit(item, 'consumoMedio')} className="cursor-pointer p-1 -m-1 rounded hover:bg-gray-100"> <span className="text-xs text-gray-500">Cons. Médio: </span> {isEditingConsumo ? (<input type="number" value={editValue} onChange={handleInlineChange} onBlur={handleSaveInline} onKeyDown={handleInlineKeyDown} className="w-16 p-1 border rounded focus:ring-pink-400 text-sm" autoFocus min="0" />) : (<span className="font-medium text-gray-700">{consumo}</span>)} </div> <div onClick={() => !isEditingAtual && handleEdit(item, 'atual')} className="cursor-pointer p-1 -m-1 rounded hover:bg-gray-100"> <span className="text-xs text-gray-500">Atual: </span> {isEditingAtual ? (<input type="number" value={editValue} onChange={handleInlineChange} onBlur={handleSaveInline} onKeyDown={handleInlineKeyDown} className="w-16 p-1 border rounded focus:ring-pink-400 text-sm" autoFocus min="0" />) : (<span className={`font-bold ${status === 'COMPRAR' ? 'text-red-600' : 'text-gray-800'}`}>{atual}</span>)} </div> </div> <div className="flex justify-end pt-1"> <button onClick={() => handleDeleteClick(item)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 hover:bg-red-50 focus:ring-red-300`} aria-label="Apagar item"><Trash2 className="h-4 w-4" /></button> </div> </div>);
                                          })}
                                    </div>
                                    {/* Layout de Tabela para Desktop */}
                                    <div className="overflow-x-auto hidden sm:block">
                                          <table className="w-full text-sm text-left">
                                                {/* Alterado bg-gray-100 para bg-gray-50 no thead */}
                                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100"> <tr> <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Item</th> <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Categoria</th> <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden sm:table-cell">Consumo Médio</th> <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Estoque Atual</th> <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden md:table-cell">Mínimo (30%)</th> <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Status</th> <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3 font-semibold text-right">Ações</th> </tr> </thead>
                                                <tbody className="text-gray-700 divide-y divide-gray-100">
                                                      {filteredEstoque.map((item) => {
                                                            const consumo = Number(item.consumoMedio) || 0; const atual = Number(item.atual) || 0; const minimo = Math.ceil(consumo * 0.3); const status = consumo > 0 && atual <= minimo ? 'COMPRAR' : 'OK'; const isEditingAtual = editingItem?.item.id === item.id && editingItem?.field === 'atual'; const isEditingConsumo = editingItem?.item.id === item.id && editingItem?.field === 'consumoMedio';
                                                            // Alterado hover:bg-gray-100 para hover:bg-gray-50
                                                            return (<tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150"> <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium text-gray-800">{item.item}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 text-gray-600">{item.categoria}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium hidden sm:table-cell" onClick={() => !isEditingConsumo && handleEdit(item, 'consumoMedio')}>{isEditingConsumo ? <input type="number" value={editValue} onChange={handleInlineChange} onBlur={handleSaveInline} onKeyDown={handleInlineKeyDown} className="w-20 p-1 border rounded focus:ring-pink-400" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-100 p-1 rounded-md">{consumo}</span>}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium" onClick={() => !isEditingAtual && handleEdit(item, 'atual')}>{isEditingAtual ? <input type="number" value={editValue} onChange={handleInlineChange} onBlur={handleSaveInline} onKeyDown={handleInlineKeyDown} className="w-20 p-1 border rounded focus:ring-pink-400" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-100 p-1 rounded-md">{atual}</span>}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 hidden md:table-cell text-gray-500">{minimo > 0 ? minimo : '-'}</td> <td className="px-2 py-2 sm:px-6 sm:py-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</span></td> <td className="px-2 py-2 sm:px-6 sm:py-4 text-right"><button onClick={() => handleDeleteClick(item)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 hover:bg-red-50 focus:ring-red-300`} aria-label="Apagar item"><Trash2 className="h-5 w-5" /></button></td> </tr>);
                                                      })}
                                                </tbody>
                                          </table>
                                    </div>
                              </>
                        ) : (<EmptyState icon={<Box size={32} />} title="Nenhum item no estoque" message="Adicione itens para começar a controlar." actionButton={{ label: "Novo Item", onClick: openNovoItemModal }} />)}
                  </div>
                  <NovoEstoqueModal show={showNovoItemModal} onClose={() => setShowNovoItemModal(false)} onAddItem={handleAddItemWrapper} isSubmitting={isSubmitting} />
                  <ConfirmationModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja apagar "${itemToDelete?.item}" do estoque?`} />
            </div>
      );
};

// ** MOVIDO NovaRegraRepasseModal PARA ANTES do App **
const NovaRegraRepasseModal = ({ show, onClose, onAddRepasse, servicosDisponiveis = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ servico: '', tipo: 'Percentual', valor: '' });
      const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

      const handleSubmit = () => {
            onAddRepasse({ ...formData })
                  .then(() => { setFormData({ servico: '', tipo: 'Percentual', valor: '' }); onClose(); })
                  .catch(err => console.error("Erro ao salvar regra:", err));
      };

      const servicoOptions = servicosDisponiveis.map(s => <option key={s.id || s.nome} value={s.nome} />);

      return (
            <FormModal show={show} onClose={onClose} title="Nova Regra de Repasse" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <FormInput id="servico" label="Serviço" value={formData.servico} onChange={handleChange} list="serv-disp-sug" placeholder="Digite o nome do serviço" required />
                  <datalist id="serv-disp-sug">{servicoOptions}</datalist>
                  <div className="grid grid-cols-2 gap-4">
                        <FormSelect id="tipo" label="Tipo (Comissão Clínica)" value={formData.tipo} onChange={handleChange}> <option value="Percentual">Percentual</option> <option value="Fixo">Fixo</option> </FormSelect>
                        <FormInput id="valor" label="Valor" value={formData.valor} onChange={handleChange} placeholder={formData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: R$ 50,00'} required />
                  </div>
            </FormModal>
      );
};

// ** MOVIDO Configuracoes PARA ANTES do App **
const Configuracoes = ({ servicos = [], onUpdateServico, repasses = [], onUpdateRepasse, onAddRepasse, onDeleteRepasse, onAddServico, onDeleteServico, showToast }) => {
      const [editingIndex, setEditingIndex] = useState(null);
      const [editData, setEditData] = useState({});
      const [showNovaRegraModal, setShowNovaRegraModal] = useState(false);
      const [showDeleteRepasseModal, setShowDeleteRepasseModal] = useState(false);
      const [repasseToDelete, setRepasseToDelete] = useState(null);
      const [novoServico, setNovoServico] = useState('');
      const [isSubmittingServico, setIsSubmittingServico] = useState(false);
      const [isSubmittingRepasse, setIsSubmittingRepasse] = useState(false);

      const handleAddServicoWrapper = async (e) => { e.preventDefault(); if (novoServico.trim() === '') return; setIsSubmittingServico(true); try { await onAddServico({ nome: novoServico }); setNovoServico(''); } finally { setIsSubmittingServico(false); } };
      const handleAddRepasseWrapper = async (regraData) => { setIsSubmittingRepasse(true); try { await onAddRepasse(regraData); } finally { setIsSubmittingRepasse(false); } }
      const handleDeleteRepasseClick = (item) => { setRepasseToDelete(item); setShowDeleteRepasseModal(true); };
      const confirmDeleteRepasse = () => { if (repasseToDelete) onDeleteRepasse(repasseToDelete.id); setShowDeleteRepasseModal(false); setRepasseToDelete(null); };
      const handleEditRepasse = (index) => { setEditingIndex(index); setEditData(repasses[index]); };
      const handleCancelEditRepasse = () => { setEditingIndex(null); };
      const handleSaveRepasse = async (index) => { const itemToUpdate = repasses[index]; const updatedItem = { ...itemToUpdate, ...editData }; try { await onUpdateRepasse(updatedItem); } finally { setEditingIndex(null); } };
      const handleEditRepasseChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });
      const servicosComRegra = useMemo(() => new Set((repasses || []).map(r => r.servico)), [repasses]);
      const servicosDisponiveis = useMemo(() => (servicos || []).filter(s => !servicosComRegra.has(s.nome)), [servicos, servicosComRegra]);
      const openNovaRegraModal = () => setShowNovaRegraModal(true);

      return (
            <div className="space-y-6 sm:space-y-8">
                  {/* Título da seção (oculto em mobile, visível em lg) */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left hidden lg:block">Configurações</h1>
                  {/* Container Gestão de Serviços - Alterado bg-gray-50 para bg-white */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-700 mb-5">Gestão de Serviços</h3>
                        <form onSubmit={handleAddServicoWrapper} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                              <FormInput id="novo-servico" label="" value={novoServico} onChange={(e) => setNovoServico(e.target.value)} placeholder="Nome do novo serviço" required />
                              <button type="submit" className={`${primaryButtonStyles} w-full sm:w-auto py-2.5 text-sm`} disabled={isSubmittingServico}> {isSubmittingServico && <Loader2 className="animate-spin h-5 w-5 mr-1.5" />} Adicionar Serviço </button>
                        </form>
                        <div className="overflow-x-auto min-h-[150px]">
                              {(servicos || []).length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                          {/* Alterado bg-gray-100 para bg-gray-50 no thead */}
                                          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                      <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Serviço</th>
                                                      <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold text-right">Ações</th>
                                                </tr>
                                          </thead>
                                          <tbody className="text-gray-700 divide-y divide-gray-100">
                                                {/* Alterado hover:bg-gray-100 para hover:bg-gray-50 */}
                                                {(servicos || []).map((s) => (<tr key={s.id} className="hover:bg-gray-50 transition-colors duration-150"> <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium text-gray-800">{s.nome}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 text-right"> <button onClick={() => onDeleteServico(s.id)} className={`${iconButtonStyles} text-red-500 hover:text-red-700 hover:bg-red-50 focus:ring-red-300`} aria-label="Apagar serviço"><Trash2 className="inline h-5 w-5" /></button> </td> </tr>))}
                                          </tbody>
                                    </table>
                              ) : (<EmptyState icon={<FilePlus size={32} />} title="Nenhum serviço registado" message="Adicione serviços para selecioná-los nos agendamentos." />)}
                        </div>
                  </div>
                  {/* Container Regras de Repasse - Alterado bg-gray-50 para bg-white */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-4">
                              <h3 className="text-xl font-semibold text-gray-700">Regras de Repasse (Comissão Clínica)</h3>
                              <button onClick={openNovaRegraModal} className={`${primaryButtonStyles} py-2 text-sm`}>Nova Regra</button>
                        </div>
                        <div className="overflow-x-auto min-h-[150px]">
                              {(repasses || []).length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                          {/* Alterado bg-gray-100 para bg-gray-50 no thead */}
                                          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                      <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Serviço</th>
                                                      <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Tipo</th>
                                                      <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Valor</th>
                                                      <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold text-right">Ações</th>
                                                </tr>
                                          </thead>
                                          <tbody className="text-gray-700 divide-y divide-gray-100">
                                                {/* Alterado hover:bg-gray-100 para hover:bg-gray-50 */}
                                                {(repasses || []).map((r, index) => (<tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150"> <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium text-gray-800">{r.servico}</td> {editingIndex === index ? (<> <td className="px-2 py-2 sm:px-6 sm:py-4"><select name="tipo" value={editData.tipo} onChange={handleEditRepasseChange} className="w-full p-1.5 border border-gray-300 rounded focus:ring-pink-400 focus:border-pink-400"><option value="Percentual">Percentual</option><option value="Fixo">Fixo</option></select></td> <td className="px-2 py-2 sm:px-6 sm:py-4"><input name="valor" type="text" value={editData.valor} onChange={handleEditRepasseChange} placeholder={editData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: R$ 50,00'} className="w-full p-1.5 border border-gray-300 rounded focus:ring-pink-400 focus:border-pink-400" /></td> <td className="px-2 py-2 sm:px-6 sm:py-4 text-right whitespace-nowrap"> <button onClick={() => handleSaveRepasse(index)} className={`${iconButtonStyles} text-green-600 hover:text-green-700 hover:bg-green-50 focus:ring-green-300`} aria-label="Salvar"><Check size={20} /></button> <button onClick={handleCancelEditRepasse} className={`${iconButtonStyles} text-gray-500 hover:text-gray-700 hover:bg-gray-100 ml-1 sm:ml-2 focus:ring-gray-300`} aria-label="Cancelar"><X size={20} /></button> </td> </>) : (<> <td className="px-2 py-2 sm:px-6 sm:py-4 text-gray-600">{r.tipo}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 font-bold">{r.valor}</td> <td className="px-2 py-2 sm:px-6 sm:py-4 text-right whitespace-nowrap"> <button onClick={() => handleEditRepasse(index)} className={`${iconButtonStyles} text-blue-500 hover:text-blue-700 hover:bg-blue-50 focus:ring-blue-300`} aria-label="Editar regra"><FilePenLine className="inline h-5 w-5" /></button> <button onClick={() => handleDeleteRepasseClick(r)} className={`${iconButtonStyles} text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 sm:ml-4 focus:ring-red-300`} aria-label="Apagar regra"><Trash2 className="inline h-5 w-5" /></button> </td> </>)} </tr>))}
                                          </tbody>
                                    </table>
                              ) : (<EmptyState icon={<FilePlus size={32} />} title="Nenhuma regra de repasse" message="Adicione regras para calcular a comissão da clínica." actionButton={{ label: "Nova Regra", onClick: openNovaRegraModal }} />)}
                        </div>
                  </div>
                  <NovaRegraRepasseModal show={showNovaRegraModal} onClose={() => setShowNovaRegraModal(false)} onAddRepasse={handleAddRepasseWrapper} servicosDisponiveis={servicosDisponiveis} isSubmitting={isSubmittingRepasse} />
                  <ConfirmationModal show={showDeleteRepasseModal} onClose={() => setShowDeleteRepasseModal(false)} onConfirm={confirmDeleteRepasse} title="Confirmar Exclusão" message={`Tem certeza que deseja apagar a regra para "${repasseToDelete?.servico}"?`} />
            </div>
      );
};


// --- Componente Principal App ---

export default function App() {
      const [currentPage, setCurrentPage] = useState('dashboard');
      const [estoque, setEstoque] = useState([]);
      const [financeiro, setFinanceiro] = useState([]);
      const [servicos, setServicos] = useState([]);
      const [atendimentos, setAtendimentos] = useState([]);
      const [repasses, setRepasses] = useState([]);
      const [pacientes, setPacientes] = useState([]);
      const [isSidebarOpen, setIsSidebarOpen] = useState(false);
      const [loading, setLoading] = useState(true);
      const [toasts, setToasts] = useState([]);
      const [user, setUser] = useState(undefined);

      const showToast = (message, type = 'info') => {
            const id = Date.now() + Math.random();
            const msgString = typeof message === 'string' ? message : 'Operação concluída.';
            setToasts(prev => [...prev, { id, message: msgString, type }]);
      };

      const makeApiCall = async (endpoint, method = 'GET', body = null, successMessage = null) => {
            const url = `${API_URL}/${endpoint}`;
            console.log(`API Call: ${method} ${url}`, body ? JSON.stringify(body).substring(0, 100) + '...' : '');
            const options = { method, headers: { 'Content-Type': 'application/json' }, };
            if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) { options.body = JSON.stringify(body); }
            try {
                  const response = await fetch(url, options);
                  if (!response.ok) {
                        let errorData; let errorMessage = `Erro ${response.status}: ${response.statusText || 'Erro desconhecido'}`;
                        try { const text = await response.text(); console.warn("API Error Response Text:", text); if (text) { errorData = JSON.parse(text); errorMessage = errorData?.message || errorMessage; } } catch (e) { console.warn("Could not parse error response as JSON", e) }
                        console.error(`API Error (${method} ${endpoint}):`, errorMessage, errorData); throw new Error(errorMessage);
                  }
                  const contentType = response.headers.get("content-type"); const contentLength = response.headers.get("content-length");
                  if (method === 'DELETE' || response.status === 204 || contentLength === "0" || !contentType || !contentType.includes("application/json")) { console.log(`API Success (${method} ${endpoint}): No JSON content returned`); if (successMessage) showToast(successMessage, 'success'); return null; }
                  const data = await response.json(); console.log(`API Success (${method} ${endpoint}): Data received.`); if (successMessage) showToast(successMessage, 'success'); return data;
            } catch (error) {
                  console.error(`API Call Failed (${method} ${endpoint}):`, error);
                  const errorMsg = String(error.message).includes("Failed to fetch") ? `Falha ao conectar à API (${method} ${endpoint}). Verifique se o servidor (${API_URL}) está rodando e o CORS está configurado.` : error.message || `Falha na operação (${method} ${endpoint}).`;
                  showToast(errorMsg, 'error'); throw error;
            }
      };

      const crudHandler = (setter, sortFn = null) => ({
            add: async (endpoint, item, successMessage) => { const addedItem = await makeApiCall(endpoint, 'POST', item, successMessage); if (addedItem) { setter(prev => { const newState = [addedItem, ...prev]; return sortFn ? sortFn(newState) : newState; }); } return addedItem; },
            update: async (endpoint, item, successMessage) => { const updatedItem = await makeApiCall(`${endpoint}/${item.id}`, 'PATCH', item, successMessage); let finalItem = updatedItem; if (updatedItem === null || updatedItem === undefined) { finalItem = item; } if (finalItem) { setter(prev => { const newState = prev.map(i => i.id === finalItem.id ? finalItem : i); return sortFn ? sortFn(newState) : newState; }); } return updatedItem; },
            remove: async (endpoint, id, successMessage) => { await makeApiCall(`${endpoint}/${id}`, 'DELETE', null, successMessage); setter(prev => prev.filter(i => i.id !== id)); }
      });

      const atendimentoOps = useMemo(() => crudHandler(setAtendimentos, (arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data))), [setAtendimentos]);
      const financeiroOps = useMemo(() => crudHandler(setFinanceiro, (arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data))), [setFinanceiro]);
      const estoqueOps = useMemo(() => crudHandler(setEstoque, (arr) => arr.sort((a, b) => (a.item || "").localeCompare(b.item || ""))), [setEstoque]);
      const servicoOps = useMemo(() => crudHandler(setServicos, (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))), [setServicos]);
      const repasseOps = useMemo(() => crudHandler(setRepasses, (arr) => arr.sort((a, b) => (a.servico || "").localeCompare(b.servico || ""))), [setRepasses]);
      const pacienteOps = useMemo(() => crudHandler(setPacientes, (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))), [setPacientes]);

      useEffect(() => { const root = window.document.documentElement; root.classList.remove('dark'); localStorage.removeItem('theme'); }, []);

      const fetchData = async () => {
            console.log("fetchData called"); setLoading(true); const endpoints = ['atendimentos', 'financeiro', 'estoque', 'servicos', 'repasses', 'pacientes']; const setters = [setAtendimentos, setFinanceiro, setEstoque, setServicos, setRepasses, setPacientes]; const sortFns = [(arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data)), (arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data)), (arr) => arr.sort((a, b) => (a.item || "").localeCompare(b.item || "")), (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), (arr) => arr.sort((a, b) => (a.servico || "").localeCompare(b.servico || "")), (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || "")),];
            try {
                  const results = await Promise.allSettled(endpoints.map(endpoint => makeApiCall(endpoint)));
                  results.forEach((result, index) => { if (result.status === 'fulfilled') { const data = Array.isArray(result.value) ? result.value : []; const sortedData = sortFns[index] ? sortFns[index]([...data]) : [...data]; setters[index](sortedData); console.log(`Fetched ${endpoints[index]} successfully with ${data.length} items.`); } else { console.error(`Failed to fetch ${endpoints[index]}:`, result.reason?.message || result.reason); setters[index]([]); } });
                  console.log("fetchData completed.");
            } catch (error) { console.error("Critical error during initial data fetch:", error); showToast('Erro crítico ao carregar dados. Tente recarregar.', 'error'); setters.forEach(setter => setter([])); } finally { setLoading(false); console.log("fetchData finished, loading set to false."); }
      };

      useEffect(() => {
            console.log("Setting up auth listener...");
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                  console.log("Auth state changed. User:", currentUser?.uid); const wasCheckingAuth = user === undefined; setUser(currentUser);
                  if (currentUser) { if (wasCheckingAuth || financeiro.length === 0) { console.log("User logged in. Fetching data..."); setLoading(true); await fetchData(); } else { console.log("User is authenticated. Data already loaded."); setLoading(false); } } else { console.log("User is logged out."); setAtendimentos([]); setFinanceiro([]); setEstoque([]); setServicos([]); setRepasses([]); setPacientes([]); setLoading(false); }
            });
            return () => { console.log("Cleaning up auth listener."); unsubscribe(); };
      }, []); // eslint-disable-line react-hooks/exhaustive-deps

      const removeToast = (id) => { setToasts(prev => prev.filter(toast => toast.id !== id)); };
      const handleLogout = async () => { try { await signOut(auth); showToast('Sessão terminada.', 'info'); setCurrentPage('dashboard'); } catch (error) { console.error("Erro ao fazer logout:", error); showToast('Erro ao sair.', 'error'); } };

      const handleAddAtendimento = (item) => atendimentoOps.add('atendimentos', item, 'Agendamento salvo!');
      const handleAddTransaction = (item, showAlert = false) => financeiroOps.add('financeiro', item, showAlert ? 'Transação adicionada!' : null);
      const handleAddItem = (item) => estoqueOps.add('estoque', item, 'Item adicionado!');
      const handleAddRepasse = (item) => repasseOps.add('repasses', item, 'Regra adicionada!');
      const handleAddServico = (item) => servicoOps.add('servicos', item, 'Serviço adicionado!');
      const handleAddPaciente = (item) => pacienteOps.add('pacientes', item, 'Paciente adicionado!');
      const handleUpdateAtendimento = (item) => atendimentoOps.update('atendimentos', item);
      const handleUpdateTransaction = (item) => financeiroOps.update('financeiro', item);
      const handleUpdateItemEstoque = (item) => estoqueOps.update('estoque', item, 'Estoque atualizado!');
      const handleUpdateRepasse = (item) => repasseOps.update('repasses', item, 'Regra atualizada!');
      const handleUpdateServico = (item) => servicoOps.update('servicos', item, 'Serviço atualizado!');
      const handleUpdatePaciente = (item) => pacienteOps.update('pacientes', item, 'Paciente atualizado!');
      const handleDeleteAtendimento = (id) => atendimentoOps.remove('atendimentos', id, 'Atendimento apagado!');
      const handleDeleteTransaction = (id) => financeiroOps.remove('financeiro', id, 'Transação apagada!');
      const handleDeleteItemEstoque = (id) => estoqueOps.remove('estoque', id, 'Item apagado!');
      const handleDeleteRepasse = (id) => repasseOps.remove('repasses', id, 'Regra apagada!');
      const handleDeleteServico = (id) => servicoOps.remove('servicos', id, 'Serviço apagado!');
      const handleDeletePaciente = (id) => pacienteOps.remove('pacientes', id, 'Paciente apagado!');

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

      if (user === undefined) { console.log("Render: Still checking auth state..."); return <LoadingSpinner />; }
      if (!user) { console.log("Render: User is logged out, showing AuthPage."); return <AuthPage showToast={showToast} />; }

      console.log("Render: User is logged in.");
      return (
            <div className="flex min-h-screen bg-slate-50 font-sans text-gray-800">
                  <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes fade-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } } @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; } .animate-fade-out { animation: fade-out 0.4s ease-in forwards; } .animate-fade-in { animation: fade-in 0.3s ease-out forwards; } @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; } ::-webkit-scrollbar-thumb:hover { background: #9ca3af; } `}</style>
                  <ToastContainer toasts={toasts} removeToast={removeToast} />
                  <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />
                  {isSidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}
                  <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
                        {/* Modificado para sempre passar o título correto */}
                        <Header onMenuClick={() => setIsSidebarOpen(true)} title={pageTitles[currentPage] || "Clínica"} />
                        <div className="flex-grow p-4 md:p-6 lg:p-8">
                              {loading ? (console.log("Render: Loading data..."), <LoadingSpinner />) : (console.log("Render: Rendering page", currentPage), renderPage())}
                        </div>
                  </main>
            </div>
      );
}

