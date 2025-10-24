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
      AlertTriangle, CheckCircle2, Search, Trash2, FilePenLine, Info, Check, AlertCircle, LogOut, Download, Users, FilePlus, FileText, Loader2
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

// --- Estilos Base para Botões ---
const baseButtonStyles = "inline-flex items-center justify-center px-5 py-2 rounded-lg font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 active:scale-95 shadow-md hover:shadow-lg transform hover:-translate-y-px";
const primaryButtonStyles = `${baseButtonStyles} bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-500`;
const secondaryButtonStyles = `${baseButtonStyles} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400`;
const destructiveButtonStyles = `${baseButtonStyles} bg-red-500 text-white hover:bg-red-600 focus:ring-red-500`;
// Adicionando um estilo azul padrão
const infoButtonStyles = `${baseButtonStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
const linkButtonStyles = "text-pink-500 hover:text-pink-400 font-medium focus:outline-none focus:ring-1 focus:ring-pink-400 rounded";
const iconButtonStyles = "p-1 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";

// --- Componentes Auxiliares ---

const LoadingSpinner = () => (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
);

const EmptyState = ({ icon, title, message, actionButton }) => (
      <div className="text-center py-12 px-6 bg-gray-50 rounded-2xl">
            <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
            {actionButton && typeof actionButton.onClick === 'function' && (
                  <div className="mt-6">
                        <button onClick={actionButton.onClick} className={primaryButtonStyles}>{actionButton.label}</button>
                  </div>
            )}
      </div>
);

// Toast Component com estado de saída
const Toast = ({ id, message, type, onClose, removeToast }) => {
      const [isExiting, setIsExiting] = useState(false);

      useEffect(() => {
            // Começa o timer para iniciar a saída
            const exitTimer = setTimeout(() => {
                  setIsExiting(true);
                  // Define um segundo timer para remover o elemento após a animação de saída
                  const removeTimer = setTimeout(() => {
                        removeToast(id); // Chama a função para remover do estado pai
                  }, 400); // Deve corresponder à duração da animação fade-out
                  return () => clearTimeout(removeTimer);
            }, 4600); // Tempo visível (5000ms total - 400ms de saída)

            return () => clearTimeout(exitTimer);
      }, [id, removeToast]); // Depende do id e removeToast

      const toastStyles = {
            success: { bg: 'bg-green-500', icon: <Check size={20} /> },
            error: { bg: 'bg-red-500', icon: <AlertCircle size={20} /> },
            info: { bg: 'bg-blue-500', icon: <Info size={20} /> },
      };
      const style = toastStyles[type] || { bg: 'bg-gray-500', icon: <Info size={20} /> };

      // Função para fechar manualmente (inicia a animação de saída)
      const handleManualClose = () => {
            setIsExiting(true);
            setTimeout(() => {
                  removeToast(id);
            }, 400); // Duração da animação de saída
      };


      return (
            // Adiciona classe animate-fade-out quando isExiting é true
            <div className={`flex items-start text-white p-4 rounded-lg shadow-lg transition-all duration-500 ease-out ${style.bg} ${isExiting ? 'animate-fade-out' : 'animate-fade-in-up'}`}>
                  <div className="mr-3 flex-shrink-0 pt-1">{style.icon}</div>
                  <p className="flex-grow">{message}</p>
                  <button onClick={handleManualClose} className="ml-4 -mr-2 -my-2 p-2 rounded hover:bg-black/20 focus:outline-none focus:ring-1 focus:ring-white" aria-label="Fechar toast">&times;</button>
            </div>
      );
};


const ToastContainer = ({ toasts, removeToast }) => (
      <div className="fixed top-5 right-5 z-50 space-y-2 w-full max-w-xs sm:max-w-sm">
            {/* Passa removeToast para o Toast poder se remover */}
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
            <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}> {/* Fade-in mais simples */}
                  <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transition-transform transform scale-95 z-50 max-h-[90vh] overflow-y-auto"
                        style={{ animation: 'scale-in 0.3s ease-out forwards' }} onClick={e => e.stopPropagation()}> {/* Animação um pouco mais lenta */}
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 -mt-2">
                              <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
                              <button onClick={onClose} className={`${iconButtonStyles} text-gray-400 hover:text-gray-800 focus:ring-gray-400 -mr-2 text-3xl font-light`} aria-label="Fechar modal">&times;</button> {/* Ajustado o botão fechar */}
                        </div>
                        {children}
                  </div>
            </div>
      );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmLabel = "Apagar", confirmIcon = <Trash2 size={18} />, cancelLabel = "Cancelar", cancelIcon = <X size={18} />, isDestructive = true }) => {
      if (!show) return null;
      return (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}> {/* Fade-in mais simples */}
                  <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transition-transform transform scale-95"
                        style={{ animation: 'scale-in 0.3s ease-out forwards' }} onClick={e => e.stopPropagation()}> {/* Animação um pouco mais lenta */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <div className="flex justify-end space-x-3">
                              <button type="button" onClick={onClose} className={secondaryButtonStyles}>{cancelIcon} {cancelLabel}</button>
                              <button type="button" onClick={onConfirm} className={isDestructive ? destructiveButtonStyles : primaryButtonStyles}>{confirmIcon} {confirmLabel}</button>
                        </div>
                  </div>
            </div>
      );
};

const FormModal = ({ show, onClose, title, children, onSubmit, isSubmitting }) => (
      <Modal show={show} onClose={onClose} title={title}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
                  {children}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                        <button type="button" onClick={onClose} className={secondaryButtonStyles} disabled={isSubmitting}><X size={18} className="mr-1" /> Cancelar</button>
                        <button type="submit" className={primaryButtonStyles} disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Check size={18} className="mr-1" />}
                              {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                  </div>
            </form>
      </Modal>
);

// --- Componentes Específicos das Páginas ---

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
                  // Mapeia erros comuns do Firebase para mensagens mais amigáveis
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

      const commonInputClasses = "mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400";

      const renderFormFields = (isRegister = false) => (
            <>
                  <div>
                        <label htmlFor={`email-${page}`} className="block text-sm font-medium text-gray-700">E-mail</label>
                        <input id={`email-${page}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClasses} required autoComplete="email" />
                  </div>
                  {page !== 'forgot' && (
                        <div>
                              <label htmlFor={`password-${page}`} className="block text-sm font-medium text-gray-700">Senha</label>
                              <input id={`password-${page}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={commonInputClasses} placeholder={isRegister ? "Mínimo 6 caracteres" : ""} required={page !== 'forgot'} autoComplete={isRegister ? "new-password" : "current-password"} />
                        </div>
                  )}
            </>
      );

      const renderSubmitButton = (label, loadingLabel) => (
            <div>
                  <button type="submit" disabled={loading} className={`${primaryButtonStyles} w-full`}>
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
                              <div className="text-sm text-center mt-4"><span className="text-gray-500">Já tem uma conta? </span><button onClick={() => setPage('login')} className={linkButtonStyles}>Entrar</button></div>
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
                              <div className="text-sm text-center mt-4"><button onClick={() => setPage('login')} className={linkButtonStyles}>Voltar para o Login</button></div>
                        </>
                  );
                  default: return ( // Login page
                        <>
                              <form className="space-y-6" onSubmit={handleLogin}>
                                    {renderFormFields()}
                                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                                    {renderSubmitButton('Entrar', 'Entrando...')}
                              </form>
                              <div className="text-sm text-center mt-4"><button onClick={() => setPage('forgot')} className={linkButtonStyles}>Esqueceu a senha?</button></div>
                              <div className="text-sm text-center mt-2"><span className="text-gray-500">Não tem uma conta? </span><button onClick={() => setPage('register')} className={linkButtonStyles}>Registre-se</button></div>
                        </>
                  );
            }
      };

      return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
                  <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
                        <div className="text-center"><img src="/public/logo(2).png" alt="AMELDY logo" className="h-12 mx-auto mb-2" /><p className="text-gray-500">Bem-vindo(a)!</p></div>
                        {renderContent()}
                  </div>
            </div>
      );
};

const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen, onLogout }) => {
      const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-5 w-5 mr-3" /> },
            { id: 'atendimentos', label: 'Atendimentos', icon: <CalendarIcon className="h-5 w-5 mr-3" /> },
            { id: 'pacientes', label: 'Pacientes', icon: <Users className="h-5 w-5 mr-3" /> },
            { id: 'financeiro', label: 'Financeiro', icon: <Wallet className="h-5 w-5 mr-3" /> },
            { id: 'estoque', label: 'Estoque', icon: <Box className="h-5 w-5 mr-3" /> },
            { id: 'configuracoes', label: 'Configurações', icon: <Settings className="h-5 w-5 mr-3" /> },
      ];
      const linkClasses = (id) => `flex items-center px-4 py-3 text-gray-600 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-1 ${currentPage === id ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100'}`;
      const sidebarClasses = `fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
      const handleLinkClick = (pageId) => { setCurrentPage(pageId); if (window.innerWidth < 1024) setIsOpen(false); };

      return (
            <aside className={sidebarClasses}>
                  <div className="h-20 flex items-center justify-between px-4 border-b border-gray-100">
                        <img src="/public/logo(2).png" alt="AMELDY (logo rosa)" className="h-10" />
                        <button onClick={() => setIsOpen(false)} className={`${iconButtonStyles} text-gray-500 lg:hidden focus:ring-gray-400`} aria-label="Fechar menu lateral"><X className="h-6 w-6" /></button>
                  </div>
                  <nav className="flex-1 px-4 py-6 space-y-2">
                        {navItems.map(item => <button key={item.id} className={`${linkClasses(item.id)} w-full text-left`} onClick={() => handleLinkClick(item.id)}>{item.icon}{item.label}</button>)}
                  </nav>
                  <div className="p-4 border-t border-gray-100">
                        <button onClick={onLogout} className={`${baseButtonStyles} flex items-center w-full text-red-500 font-semibold rounded-xl hover:bg-red-100 focus:ring-red-400 bg-transparent shadow-none hover:shadow-none`}><LogOut className="h-5 w-5 mr-3" />Sair</button>
                  </div>
            </aside>
      );
};

const Header = ({ onMenuClick, title }) => (
      <header className="lg:hidden bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between h-20 px-4 sm:px-6 border-b border-gray-100">
            <button onClick={onMenuClick} className={`${iconButtonStyles} text-gray-600 focus:ring-gray-400`} aria-label="Abrir menu lateral"><Menu className="h-6 w-6" /></button>
            <img src="/public/logo(2).png" alt="AMELDY (logo rosa)" className="h-8" />
            <div className="w-6"></div> {/* Spacer */}
      </header>
);

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

const StatCard = ({ icon, title, value, subtitle, colorClass }) => (
      // Adicionado min-h-[120px] para garantir altura mínima e flex-col sm:flex-row para melhor layout em telas pequenas
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg shadow-gray-200/50 flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl min-h-[120px]">
            <div className={`rounded-full p-3 sm:p-4 flex-shrink-0 ${colorClass?.bg || 'bg-gray-100'}`}>{icon || '?'}</div>
            <div className="text-center sm:text-left">
                  {/* Ajustado tamanho do texto para ser responsivo */}
                  <p className="text-sm font-medium text-gray-500">{title || 'Título'}</p>
                  <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${colorClass?.text || 'text-gray-800'}`}>{value || '0'}</p>
                  {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
      </div>
);


const Dashboard = ({ estoque, atendimentos, financeiro, repasses }) => {
      const today = new Date();
      const dateString = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const formatCurrency = (v) => (typeof v !== 'number' || isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      // useMemo para evitar recálculos desnecessários
      const totals = useMemo(() => {
            let faturamentoBruto = 0, despesaPaga = 0, repassesRecebidos = 0;
            (financeiro || []).forEach(t => {
                  const valor = Number(t.valor) || 0;
                  if (t.tipo === 'Entrada' && t.status === 'Recebido') faturamentoBruto += valor;
                  if (t.tipo === 'Saída' && t.status === 'Pago') despesaPaga += valor;
                  // Cálculo de repasse (comissão da clínica sobre entradas recebidas)
                  const regra = (repasses || []).find(r => r.servico === t.descricao);
                  if (regra && t.tipo === 'Entrada' && t.status === 'Recebido') {
                        if (regra.tipo === 'Percentual') {
                              // Assume que regra.valor é algo como "40%"
                              const percent = parseFloat(String(regra.valor).replace('%', '')) / 100;
                              if (!isNaN(percent)) repassesRecebidos += valor * percent;
                        } else if (regra.tipo === 'Fixo') {
                              // Assume que regra.valor é algo como "R$ 50,00" ou "50"
                              const fixo = parseFloat(String(regra.valor).replace(/[^0-9,.-]+/g, "").replace(",", "."));
                              if (!isNaN(fixo)) repassesRecebidos += Math.min(fixo, valor); // A comissão não pode ser maior que o valor do serviço
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
            <div className="space-y-8">
                  <div className="text-center sm:text-left"><h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Olá, Bem-vindo(a)!</h1><p className="text-gray-500">{dateString}</p></div>
                  {/* Ajustado o grid para ser mais responsivo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                        <StatCard title="Faturamento Bruto" value={formatCurrency(totals.faturamentoBruto)} subtitle="Total de entradas recebidas" icon={<TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />} colorClass={{ bg: "bg-blue-100", text: "text-blue-600" }} />
                        <StatCard title="Comissão Clínica" value={formatCurrency(totals.repassesRecebidos)} subtitle="Valor recebido pela clínica" icon={<ArrowLeftRight className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />} colorClass={{ bg: "bg-orange-100", text: "text-orange-600" }} />
                        <StatCard title="Despesa Paga" value={formatCurrency(totals.despesaPaga)} icon={<CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />} colorClass={{ bg: "bg-red-100", text: "text-red-600" }} />
                        <StatCard title="Saldo em Caixa" value={formatCurrency(totals.saldoEmCaixa)} subtitle="Entradas Recebidas - Saídas Pagas" icon={<DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />} colorClass={{ bg: "bg-green-100", text: "text-green-600" }} />
                  </div>
                  {/* Ajustado o grid para empilhar antes em telas médias (md) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-lg shadow-gray-200/50">
                              <h3 className="text-lg md:text-xl font-bold text-amber-800 mb-4 flex items-center"><AlertTriangle className="h-5 w-5 md:h-6 md:w-6 mr-2 text-amber-500" /> Avisos de Estoque</h3>
                              {itensParaComprar.length > 0 ? (
                                    <div className="space-y-3"><p className="text-sm text-amber-700 mb-3">Itens com estoque baixo:</p><ul className="space-y-2 max-h-60 overflow-y-auto pr-2">{itensParaComprar.map(item => <li key={item.id} className="flex justify-between items-center text-sm p-3 rounded-lg bg-white hover:shadow-md transition-shadow"><span className="text-gray-700 font-semibold truncate mr-2" title={item.item}>{item.item}</span><span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs flex-shrink-0">{item.atual} unid.</span></li>)}</ul></div>
                              ) : (<div className="text-center py-4"><CheckCircle2 className="h-12 w-12 mx-auto text-green-400" /><p className="text-sm text-gray-500 mt-2 font-medium">Estoque em dia!</p><p className="text-xs text-gray-400">Nenhum item abaixo do mínimo.</p></div>)}
                        </div>
                        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50"><h3 className="text-lg md:text-xl font-bold text-gray-700 mb-4">Faturamento (Recebido) - Últimos 7 Dias</h3><DailyRevenueChart data={dailyRevenueData} /></div>
                        <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50"><h3 className="text-lg md:text-xl font-bold text-gray-700 mb-4">Atendimentos por Setor</h3><AtendimentosChart atendimentos={atendimentos} /></div>
                  </div>
            </div>
      );
};

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
            // Usar a função onAddAtendimento que retorna uma Promise
            onAddAtendimento(newAtendimento)
                  .then(() => { setFormData({ paciente: '', profissional: 'Enf.ª Andreia', servico: '', valor: '' }); onClose(); }) // Limpa e fecha SÓ SE der certo
                  .catch(err => console.error("Erro ao adicionar atendimento no modal:", err)); // Erro já tratado no handler geral
      };

      return (
            <FormModal show={show} onClose={onClose} title="Novo Agendamento" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <div><label htmlFor="paciente" className="block text-sm font-medium text-gray-700 mb-1">Paciente</label><input type="text" id="paciente" name="paciente" value={formData.paciente} onChange={handleChange} list="pacientes-sugestoes" className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" placeholder="Digite o nome" required /><datalist id="pacientes-sugestoes">{uniquePacientes.map(p => <option key={p} value={p} />)}</datalist></div>
                  <div>
                        <label htmlFor="profissional" className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
                        <select id="profissional" name="profissional" value={formData.profissional} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400">
                              {/* TODO: Carregar esta lista dinamicamente */}
                              <option>Enf.ª Andreia</option>
                              <option>Tec. Bruno</option>
                              <option>Enf.ª Ana</option>
                              <option>Tec. Marilia</option>
                              <option>Dr Ciarline</option>
                        </select>
                  </div>
                  <div><label htmlFor="servico" className="block text-sm font-medium text-gray-700 mb-1">Serviço</label><input type="text" id="servico" name="servico" value={formData.servico} onChange={handleChange} list="servicos-sugestoes" className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" placeholder="Digite o nome do serviço" required /><datalist id="servicos-sugestoes">{uniqueServicos.map(s => <option key={s.id || s.nome} value={s.nome} />)}</datalist></div>
                  <div><label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label><input type="text" id="valor" name="valor" value={formData.valor} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" placeholder="0,00" required inputMode="decimal" /></div>
                  {/* TODO: Adicionar campo Setor se necessário */}
            </FormModal>
      );
};

// Componente para renderizar a lista de atendimentos (usado em Próximos e Histórico)
const AtendimentoList = ({ items, handleUpdateStatus, handleDeleteClick, openAgendamentoModal }) => { // Adicionado openAgendamentoModal
      if (!items || items.length === 0) {
            // Usando a função passada para o botão
            return <EmptyState icon={<CalendarIcon size={32} />} title="Nenhum atendimento" message="Não há atendimentos para exibir nesta seção." actionButton={{ label: "Novo Agendamento", onClick: openAgendamentoModal }} />;
      }
      return (
            <div className="space-y-4">
                  {items.map(at => (
                        <div key={at.id} className="p-5 border border-gray-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors">
                              <div className="flex-1 mb-3 md:mb-0">
                                    <p className="font-bold text-lg text-gray-800">{at.paciente}</p>
                                    <p className="text-sm text-gray-600">{at.tipo} - {at.profissional}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(at.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {at.setor}</p>
                              </div>
                              <div className="flex items-center gap-4 flex-wrap justify-end">
                                    <span className="text-lg font-bold text-gray-700">{(Number(at.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusMap[at.status] || 'bg-gray-200 text-gray-800'}`}>{at.status?.toUpperCase() || 'N/A'}</span>
                                    {at.status === 'Agendado' && (
                                          <div className="flex gap-2">
                                                <button onClick={() => handleUpdateStatus(at, 'Confirmado')} className={`${baseButtonStyles} bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 text-xs px-3 py-1 shadow-none`}><Check size={14} className="mr-1" />Confirmar</button>
                                                <button onClick={() => handleUpdateStatus(at, 'Cancelado')} className={`${baseButtonStyles} bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 text-xs px-3 py-1 shadow-none`}><X size={14} className="mr-1" />Cancelar</button>
                                          </div>
                                    )}
                                    <button onClick={() => handleDeleteClick(at)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 focus:ring-red-400`} aria-label="Apagar atendimento"><Trash2 className="h-5 w-5" /></button>
                              </div>
                        </div>
                  ))}
            </div>
      );
};


const Atendimentos = ({ servicos = [], atendimentos = [], onUpdateAtendimento, onAddAtendimento, onDeleteAtendimento, onAddTransaction, financeiro = [], showToast, pacientes = [] }) => {
      const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [activeTab, setActiveTab] = useState('proximos');
      const [isSubmitting, setIsSubmitting] = useState(false); // Estado de loading para o modal

      const handleDeleteClick = (item) => { setItemToDelete(item); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeleteAtendimento(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };

      const handleUpdateStatus = async (atendimento, newStatus) => {
            const updatedItem = { ...atendimento, status: newStatus };
            try {
                  await onUpdateAtendimento(updatedItem); // Essa função já mostra toast de sucesso/erro
                  if (newStatus === 'Confirmado') {
                        const existingTransaction = (financeiro || []).find(t => t.atendimentoId === atendimento.id);
                        if (!existingTransaction) {
                              const newTransaction = { data: atendimento.data, descricao: atendimento.tipo, pagador: atendimento.paciente, categoria: 'Atendimento Clínico', tipo: 'Entrada', valor: parseFloat(atendimento.valor) || 0, status: 'A Receber', atendimentoId: atendimento.id };
                              await onAddTransaction(newTransaction); // Essa função já mostra toast de sucesso/erro
                              showToast('Lançamento "A Receber" criado automaticamente.', 'info'); // Toast específico
                        }
                  }
            } catch (error) { console.error("Erro ao atualizar status do atendimento:", error); /* Toast de erro já foi mostrado por onUpdateAtendimento */ }
      };

      // Wrapper para controlar o estado de loading do modal
      const handleAddAtendimentoWrapper = async (newAtendimento) => {
            setIsSubmitting(true);
            try {
                  await onAddAtendimento(newAtendimento); // Espera a Promise resolver (sucesso ou erro)
                  // Se chegou aqui, deu certo. O .then() no modal vai fechar.
            } finally {
                  setIsSubmitting(false); // Garante que o loading para, mesmo se der erro
            }
      };

      const exportToPDF = () => { /* ... Implementação ... */ };
      const today = useMemo(() => new Date().toISOString().slice(0, 10), []); // Calcula hoje apenas uma vez
      const proximosAtendimentos = useMemo(() => (atendimentos || []).filter(at => at.data >= today).sort((a, b) => new Date(a.data) - new Date(b.data)), [atendimentos, today]);
      const historicoAtendimentos = useMemo(() => (atendimentos || []).filter(at => at.data < today).sort((a, b) => new Date(b.data) - new Date(a.data)), [atendimentos, today]);

      // Passar a função para abrir o modal para o AtendimentoList poder usá-la no EmptyState
      const openAgendamentoModal = () => setShowAgendamentoModal(true);

      return (
            <div className="space-y-8">
                  {/* Ajustado para empilhar em telas menores que 'md' */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 text-center md:text-left">Atendimentos</h1>
                        {/* Ajustado para empilhar em telas menores que 'sm' e centralizar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center md:justify-end">
                              {/* Adicionado text-white aqui */}
                              <button onClick={exportToPDF} className={`${secondaryButtonStyles} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`}><FileText size={18} className="mr-2" /> Exportar PDF</button>
                              <button onClick={openAgendamentoModal} className={primaryButtonStyles}>Novo Agendamento</button>
                        </div>
                  </div>
                  <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                              {['proximos', 'historico'].map(tab => (
                                    <button
                                          key={tab}
                                          onClick={() => setActiveTab(tab)}
                                          className={`${activeTab === tab ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-pink-300 rounded-t-sm`}
                                          aria-current={activeTab === tab ? 'page' : undefined}
                                    >
                                          {tab === 'proximos' ? 'Próximos' : 'Histórico'}
                                    </button>
                              ))}
                        </nav>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg shadow-gray-200/50 min-h-[300px]"> {/* Altura mínima para o empty state */}
                        {activeTab === 'proximos'
                              ? <AtendimentoList items={proximosAtendimentos} handleUpdateStatus={handleUpdateStatus} handleDeleteClick={handleDeleteClick} openAgendamentoModal={openAgendamentoModal} />
                              : <AtendimentoList items={historicoAtendimentos} handleUpdateStatus={handleUpdateStatus} handleDeleteClick={handleDeleteClick} openAgendamentoModal={openAgendamentoModal} />
                        }
                  </div>
                  <AgendamentoModal
                        show={showAgendamentoModal}
                        onClose={() => setShowAgendamentoModal(false)}
                        servicos={servicos}
                        onAddAtendimento={handleAddAtendimentoWrapper} // Passa o wrapper
                        pacientes={pacientes}
                        isSubmitting={isSubmitting} // Passa o estado de loading
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

const PacienteModalForm = ({ show, onClose, onSave, paciente, isSubmitting }) => {
      const [formData, setFormData] = useState({ nome: '', telefone: '', dataNascimento: '' });

      // Preenche o form ao editar ou limpa ao adicionar
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
            onSave(payload) // onSave deve retornar Promise
                  .then(() => {
                        // Limpar o form e fechar o modal SÓ se a operação der certo
                        // Se der erro, o modal permanece aberto para o usuário corrigir
                        setFormData({ nome: '', telefone: '', dataNascimento: '' }); // Reset form
                        onClose(); // Close modal
                  })
                  .catch(err => console.error("Erro ao salvar paciente no modal:", err)); // Erro já tratado no handler geral
      };

      return (
            <FormModal show={show} onClose={onClose} title={paciente ? "Editar Paciente" : "Novo Paciente"} onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <div><label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" required /></div>
                  <div><label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" placeholder="(XX) XXXXX-XXXX" /></div>
                  <div><label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento</label><input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} max={new Date().toISOString().split("T")[0]} className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" /></div>
            </FormModal>
      );
};

const Pacientes = ({ pacientes = [], onAddPaciente, onUpdatePaciente, onDeletePaciente, showToast }) => {
      const [showModal, setShowModal] = useState(false);
      const [editingPaciente, setEditingPaciente] = useState(null);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [isSubmitting, setIsSubmitting] = useState(false); // Loading state para o modal

      const handleEdit = (paciente) => { setEditingPaciente(paciente); setShowModal(true); };
      const handleCloseModal = () => { setEditingPaciente(null); setShowModal(false); };

      // Wrapper para salvar (adicionar ou editar) com loading
      const handleSavePacienteWrapper = async (pacienteData) => {
            setIsSubmitting(true);
            try {
                  if (editingPaciente) {
                        await onUpdatePaciente(pacienteData); // Espera a Promise
                  } else {
                        await onAddPaciente(pacienteData); // Espera a Promise
                  }
                  // Se chegou aqui, deu certo, o handler já mostrou o toast. A Promise resolveu.
                  // O then() dentro do PacienteModalForm vai fechar o modal.
            } catch (error) {
                  // O handler geral já mostrou o toast de erro. A Promise rejeitou.
                  // O catch() dentro do PacienteModalForm vai manter o modal aberto.
            } finally {
                  setIsSubmitting(false); // Para o loading
            }
      };

      const handleDeleteClick = (paciente) => { setItemToDelete(paciente); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeletePaciente(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };
      const exportToPDF = () => { /* ... Implementação ... */ };
      const openNovoPacienteModal = () => { setEditingPaciente(null); setShowModal(true); };

      return (
            <div className="space-y-8">
                  {/* Ajustado para empilhar em telas menores que 'md' */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 text-center md:text-left">Pacientes</h1>
                        {/* Ajustado para empilhar em telas menores que 'sm' e centralizar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center md:justify-end">
                              {/* Adicionado text-white aqui */}
                              <button onClick={exportToPDF} className={`${secondaryButtonStyles} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`}><FileText size={18} className="mr-2" /> Exportar PDF</button>
                              <button onClick={openNovoPacienteModal} className={primaryButtonStyles}>Novo Paciente</button>
                        </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-x-auto min-h-[300px]">
                        {(pacientes || []).length > 0 ? (
                              <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-4 font-semibold">Nome</th><th scope="col" className="px-6 py-4 font-semibold hidden sm:table-cell">Telefone</th><th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Data de Nascimento</th><th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th></tr></thead>
                                    <tbody className="text-gray-700">
                                          {(pacientes || []).map((p) => (<tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.nome}</td><td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap">{p.telefone || '-'}</td><td className="px-6 py-4 hidden md:table-cell whitespace-nowrap">{p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td><td className="px-6 py-4 text-right whitespace-nowrap"><button onClick={() => handleEdit(p)} className={`${iconButtonStyles} text-blue-600 hover:text-blue-800 focus:ring-blue-400`} aria-label="Editar paciente"><FilePenLine className="inline h-5 w-5" /></button><button onClick={() => handleDeleteClick(p)} className={`${iconButtonStyles} text-red-600 hover:text-red-800 ml-4 focus:ring-red-400`} aria-label="Apagar paciente"><Trash2 className="inline h-5 w-5" /></button></td></tr>))}
                                    </tbody>
                              </table>
                        ) : (<EmptyState icon={<Users size={32} />} title="Nenhum paciente registado" message="Adicione o seu primeiro paciente para começar." actionButton={{ label: "Novo Paciente", onClick: openNovoPacienteModal }} />)}
                  </div>
                  <PacienteModalForm
                        show={showModal}
                        onClose={handleCloseModal}
                        onSave={handleSavePacienteWrapper} // Passa o wrapper
                        paciente={editingPaciente}
                        isSubmitting={isSubmitting} // Passa o estado de loading
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

const NovaTransacaoModal = ({ show, onClose, onAddTransaction, servicos = [], pacientes = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: 'Recebido' });
      const uniquePacientes = useMemo(() => [...new Set((pacientes || []).map(p => p.nome))], [pacientes]);
      const uniqueServicos = useMemo(() => (servicos || []), [servicos]);

      const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

      const handleSubmit = () => {
            const valorNumerico = parseFloat(String(formData.valor).replace(',', '.')) || 0;
            const transactionPayload = { ...formData, valor: valorNumerico };
            onAddTransaction(transactionPayload, true) // Passa true para mostrar alerta padrão
                  .then(() => {
                        setFormData({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: 'Recebido' }); // Reset form
                        onClose(); // Fecha modal
                  }).catch(err => console.error("Erro ao salvar transação:", err)); // Erro já tratado
      };

      return (
            <FormModal show={show} onClose={onClose} title="Nova Transação" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <div><label htmlFor="data-trans" className="block text-sm font-medium text-gray-700 mb-1">Data</label><input type="date" id="data-trans" name="data" value={formData.data} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" required /></div>
                  <div><label htmlFor="desc-trans" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label><input type="text" id="desc-trans" name="descricao" value={formData.descricao} onChange={handleChange} list="servicos-fin-sug" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" placeholder="Serviço ou motivo" required /><datalist id="servicos-fin-sug">{uniqueServicos.map(s => <option key={s.id || s.nome} value={s.nome} />)}</datalist></div>
                  <div><label htmlFor="pagador-trans" className="block text-sm font-medium text-gray-700 mb-1">Cliente/Origem</label><input type="text" id="pagador-trans" name="pagador" value={formData.pagador} onChange={handleChange} list="pacientes-fin-sug" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" placeholder="Nome do cliente ou fornecedor" required /><datalist id="pacientes-fin-sug">{uniquePacientes.map(p => <option key={p} value={p} />)}</datalist></div>
                  <div><label htmlFor="cat-trans" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label><input type="text" id="cat-trans" name="categoria" value={formData.categoria} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" placeholder="Ex: Consulta, Despesa Fixa" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                        <div><label htmlFor="tipo-trans" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select id="tipo-trans" name="tipo" value={formData.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-400"><option>Entrada</option><option>Saída</option></select></div>
                        <div><label htmlFor="valor-trans" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label><input type="text" id="valor-trans" name="valor" value={formData.valor} onChange={handleChange} inputMode="decimal" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" placeholder="0,00" required /></div>
                  </div>
                  <div><label htmlFor="status-trans" className="block text-sm font-medium text-gray-700 mb-1">Status</label><select id="status-trans" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-400"><option>Recebido</option><option>A Receber</option><option>Pago</option><option>A Pagar</option></select></div>
            </FormModal>
      );
};

const Financeiro = ({ financeiro = [], onUpdateTransaction, onDeleteTransaction, servicos = [], onAddTransaction, showToast, pacientes = [] }) => {
      const [searchTerm, setSearchTerm] = useState('');
      const [showModal, setShowModal] = useState(false);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [startDate, setStartDate] = useState('');
      const [endDate, setEndDate] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false); // Loading para o modal

      // Wrapper para controlar o loading do modal
      const handleAddTransactionWrapper = async (transactionData, showAlert) => {
            setIsSubmitting(true);
            try {
                  await onAddTransaction(transactionData, showAlert);
            } finally {
                  setIsSubmitting(false);
            }
      };

      const handleDeleteClick = (item) => { setItemToDelete(item); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeleteTransaction(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };

      const handleUpdateStatus = async (id) => {
            const itemToUpdate = financeiro.find(item => item.id === id); if (!itemToUpdate) return;
            let newStatus = itemToUpdate.status;
            if (itemToUpdate.status === 'A Receber') newStatus = 'Recebido'; else if (itemToUpdate.status === 'A Pagar') newStatus = 'Pago';
            if (newStatus === itemToUpdate.status) return; // No change needed
            try {
                  await onUpdateTransaction({ ...itemToUpdate, status: newStatus });
                  // O handler já mostra toast de erro, mas podemos mostrar um de sucesso aqui se não houve erro
                  showToast(`Status atualizado para ${newStatus}!`, 'success');
            } catch (error) { console.error("Erro ao atualizar status financeiro:", error); /* Toast de erro já mostrado */ }
      };

      const filteredFinanceiro = useMemo(() => (financeiro || []).filter(f => {
            const term = searchTerm.toLowerCase();
            const textMatch = !term || f.descricao?.toLowerCase().includes(term) || f.categoria?.toLowerCase().includes(term) || f.pagador?.toLowerCase().includes(term);
            const dateMatch = (!startDate || f.data >= startDate) && (!endDate || f.data <= endDate);
            return textMatch && dateMatch;
      }), [financeiro, searchTerm, startDate, endDate]);

      const clearFilters = () => { setSearchTerm(''); setStartDate(''); setEndDate(''); };

      const exportToCSV = () => { /* ... Implementação ... */ };
      const exportToPDF = () => { /* ... Implementação ... */ };
      const openNovaTransacaoModal = () => setShowModal(true);

      return (
            <div className="space-y-8">
                  {/* Container Principal do Cabeçalho: flex-col por padrão, md:flex-row */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        {/* Título: centralizado em mobile, alinhado à esquerda em md+ */}
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 text-center md:text-left">Financeiro</h1>
                        {/* Container dos Botões: flex-col por padrão, sm:flex-row */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center md:justify-end">
                              {/* Botões */}
                              <button onClick={exportToPDF} className={`${secondaryButtonStyles} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`}><FileText size={18} className="mr-2" /> Exportar PDF</button>
                              <button onClick={exportToCSV} className={`${infoButtonStyles}`}><Download size={18} className="mr-2" /> Exportar CSV</button>
                              <button onClick={openNovaTransacaoModal} className={primaryButtonStyles}>Nova Transação</button>
                        </div>
                  </div>
                  {/* Container dos Filtros: grid-cols-1 por padrão, md:grid-cols-2 */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                              {/* Campo de Pesquisa: ocupa 2 colunas em md+ */}
                              <div className="md:col-span-2">
                                    <label htmlFor="search-fin" className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
                                    <div className="relative"><input type="text" id="search-fin" placeholder="Descrição, categoria, cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-pink-400" /><Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" /></div>
                              </div>
                              {/* Campos de Data */}
                              <div><label htmlFor="startDate-fin" className="block text-sm font-medium text-gray-700 mb-1">De</label><input type="date" id="startDate-fin" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                              <div><label htmlFor="endDate-fin" className="block text-sm font-medium text-gray-700 mb-1">Até</label><input type="date" id="endDate-fin" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                              {/* Botão Limpar Filtros: ocupa 2 colunas em md+ e alinhado à direita */}
                              <div className="md:col-span-2 flex justify-end">
                                    <button onClick={clearFilters} className={`${secondaryButtonStyles} mt-4 md:mt-0 w-full md:w-auto`}>Limpar Filtros</button>
                              </div>
                        </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-x-auto min-h-[300px]">
                        {filteredFinanceiro.length > 0 ? (
                              <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-4 font-semibold">Data</th><th scope="col" className="px-6 py-4 font-semibold">Descrição</th><th scope="col" className="px-6 py-4 font-semibold hidden sm:table-cell">Cliente/Origem</th><th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Categoria</th><th scope="col" className="px-6 py-4 font-semibold">Tipo</th><th scope="col" className="px-6 py-4 font-semibold">Valor</th><th scope="col" className="px-6 py-4 font-semibold">Status</th><th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th></tr></thead>
                                    <tbody className="text-gray-700">
                                          {filteredFinanceiro.map((tr) => {
                                                const isClickable = tr.status === 'A Receber' || tr.status === 'A Pagar';
                                                return (
                                                      <tr key={tr.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td className="px-6 py-4 whitespace-nowrap">{new Date(tr.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td><td className="px-6 py-4 font-medium text-gray-900">{tr.descricao}</td><td className="px-6 py-4 hidden sm:table-cell">{tr.pagador}</td><td className="px-6 py-4 hidden md:table-cell">{tr.categoria}</td><td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-bold rounded-full ${tr.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{tr.tipo}</span></td><td className="px-6 py-4 font-bold whitespace-nowrap">{(Number(tr.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="px-6 py-4 whitespace-nowrap"><span onClick={() => isClickable && handleUpdateStatus(tr.id)} className={`px-3 py-1 text-xs font-semibold rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200 text-gray-800'} ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}>{tr.status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteClick(tr)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 focus:ring-red-400`} aria-label="Apagar transação"><Trash2 className="h-5 w-5" /></button></td></tr>
                                                );
                                          })}
                                    </tbody>
                              </table>
                        ) : (<EmptyState icon={<Wallet size={32} />} title="Nenhuma transação encontrada" message="Crie uma nova transação ou ajuste os filtros." actionButton={{ label: "Nova Transação", onClick: openNovaTransacaoModal }} />)}
                  </div>
                  <NovaTransacaoModal show={showModal} onClose={() => setShowModal(false)} onAddTransaction={handleAddTransactionWrapper} servicos={servicos} pacientes={pacientes} isSubmitting={isSubmitting} />
                  <ConfirmationModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem a certeza que deseja apagar a transação "${itemToDelete?.descricao}"?`} />
            </div>
      );
};

const NovoEstoqueModal = ({ show, onClose, onAddItem, isSubmitting }) => {
      const [formData, setFormData] = useState({ item: '', categoria: '', consumoMedio: '', atual: '' });
      const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

      const handleSubmit = () => {
            const itemPayload = { ...formData, consumoMedio: parseInt(formData.consumoMedio, 10) || 0, atual: parseInt(formData.atual, 10) || 0 };
            onAddItem(itemPayload)
                  .then(() => { setFormData({ item: '', categoria: '', consumoMedio: '', atual: '' }); onClose(); })
                  .catch(err => console.error("Erro ao adicionar item:", err)); // Erro já tratado
      };

      return (
            <FormModal show={show} onClose={onClose} title="Novo Item de Estoque" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <div><label htmlFor="item-est" className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label><input type="text" id="item-est" name="item" value={formData.item} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" required /></div>
                  <div><label htmlFor="cat-est" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label><input type="text" id="cat-est" name="categoria" value={formData.categoria} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" placeholder="Ex: Material Escritório, Limpeza" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                        <div><label htmlFor="consumo-est" className="block text-sm font-medium text-gray-700 mb-1">Consumo Médio</label><input type="number" id="consumo-est" name="consumoMedio" value={formData.consumoMedio} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" min="0" required /></div>
                        <div><label htmlFor="atual-est" className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label><input type="number" id="atual-est" name="atual" value={formData.atual} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" min="0" required /></div>
                  </div>
            </FormModal>
      );
};

const Estoque = ({ estoque = [], onUpdateItem, onAddItem, onDeleteItem, showToast }) => {
      const [editingItem, setEditingItem] = useState(null); // { item, field }
      const [editValue, setEditValue] = useState('');
      const [searchTerm, setSearchTerm] = useState('');
      const [showNovoItemModal, setShowNovoItemModal] = useState(false);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const [itemToDelete, setItemToDelete] = useState(null);
      const [isSubmitting, setIsSubmitting] = useState(false); // Loading para o modal

      // Wrapper para controlar o loading do modal
      const handleAddItemWrapper = async (itemData) => {
            setIsSubmitting(true);
            try { await onAddItem(itemData); } finally { setIsSubmitting(false); }
      };

      const handleDeleteClick = (item) => { setItemToDelete(item); setShowDeleteModal(true); };
      const confirmDelete = () => { if (itemToDelete) onDeleteItem(itemToDelete.id); setShowDeleteModal(false); setItemToDelete(null); };

      // Lógica para Edição Inline (simplificada)
      const handleEdit = (item, field) => { setEditingItem({ item, field }); setEditValue(String(item[field])); };
      const handleSaveInline = async () => {
            if (!editingItem) return;
            const { item, field } = editingItem;
            const newValue = parseInt(editValue, 10);
            if (isNaN(newValue) || newValue < 0) { setEditingItem(null); return; } // Validação básica
            try { await onUpdateItem({ ...item, [field]: newValue }); } catch (e) { console.error("Erro inline edit estoque:", e); } finally { setEditingItem(null); }
      };
      const handleInlineChange = (e) => setEditValue(e.target.value);
      const handleInlineKeyDown = (e) => { if (e.key === 'Enter') handleSaveInline(); else if (e.key === 'Escape') setEditingItem(null); };

      const filteredEstoque = useMemo(() => (estoque || []).filter(item =>
            item.item?.toLowerCase().includes(searchTerm.toLowerCase()) || item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      ), [estoque, searchTerm]);

      const exportToPDF = () => { /* ... Implementação ... */ };
      const openNovoItemModal = () => setShowNovoItemModal(true);

      return (
            <div className="space-y-8">
                  {/* Ajustado para empilhar em telas menores que 'md' */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 text-center md:text-left">Controle de Estoque</h1>
                        {/* Ajustado para empilhar em telas menores que 'sm' e centralizar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center md:justify-end">
                              {/* Adicionado text-white aqui */}
                              <button onClick={exportToPDF} className={`${secondaryButtonStyles} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`}><FileText size={18} className="mr-2" /> Exportar PDF</button>
                              <div className="relative flex-grow"><input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-pink-400" /><Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" /></div>
                              <button onClick={openNovoItemModal} className={primaryButtonStyles}>Novo Item</button>
                        </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-x-auto min-h-[300px]">
                        {filteredEstoque.length > 0 ? (
                              <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-4 font-semibold">Item</th><th scope="col" className="px-6 py-4 font-semibold">Categoria</th><th scope="col" className="px-6 py-4 font-semibold hidden sm:table-cell">Consumo Médio</th><th scope="col" className="px-6 py-4 font-semibold">Estoque Atual</th><th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Mínimo (30%)</th><th scope="col" className="px-6 py-4 font-semibold">Status</th><th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th></tr></thead>
                                    <tbody className="text-gray-700">
                                          {filteredEstoque.map((item) => {
                                                const consumo = Number(item.consumoMedio) || 0; const atual = Number(item.atual) || 0;
                                                const minimo = Math.ceil(consumo * 0.3);
                                                const status = consumo > 0 && atual <= minimo ? 'COMPRAR' : 'OK';
                                                const isEditingAtual = editingItem?.item.id === item.id && editingItem?.field === 'atual';
                                                const isEditingConsumo = editingItem?.item.id === item.id && editingItem?.field === 'consumoMedio';
                                                return (
                                                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-medium text-gray-900">{item.item}</td><td className="px-6 py-4">{item.categoria}</td><td className="px-6 py-4 font-medium hidden sm:table-cell" onClick={() => !isEditingConsumo && handleEdit(item, 'consumoMedio')}>{isEditingConsumo ? <input type="number" value={editValue} onChange={handleInlineChange} onBlur={handleSaveInline} onKeyDown={handleInlineKeyDown} className="w-20 p-1 border rounded focus:ring-pink-400" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-200 p-1 rounded-md">{consumo}</span>}</td><td className="px-6 py-4 font-medium" onClick={() => !isEditingAtual && handleEdit(item, 'atual')}>{isEditingAtual ? <input type="number" value={editValue} onChange={handleInlineChange} onBlur={handleSaveInline} onKeyDown={handleInlineKeyDown} className="w-20 p-1 border rounded focus:ring-pink-400" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-200 p-1 rounded-md">{atual}</span>}</td><td className="px-6 py-4 hidden md:table-cell">{minimo > 0 ? minimo : '-'}</td><td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteClick(item)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500 focus:ring-red-400`} aria-label="Apagar item"><Trash2 className="h-5 w-5" /></button></td></tr>
                                                );
                                          })}
                                    </tbody>
                              </table>
                        ) : (<EmptyState icon={<Box size={32} />} title="Nenhum item no estoque" message="Adicione itens para começar a controlar." actionButton={{ label: "Novo Item", onClick: openNovoItemModal }} />)}
                  </div>
                  <NovoEstoqueModal show={showNovoItemModal} onClose={() => setShowNovoItemModal(false)} onAddItem={handleAddItemWrapper} isSubmitting={isSubmitting} />
                  <ConfirmationModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja apagar "${itemToDelete?.item}" do estoque?`} />
            </div>
      );
};

const NovaRegraRepasseModal = ({ show, onClose, onAddRepasse, servicosDisponiveis = [], isSubmitting }) => {
      const [formData, setFormData] = useState({ servico: '', tipo: 'Percentual', valor: '' });
      const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

      const handleSubmit = () => {
            // Validar/Formatar valor antes de enviar? Ex: '40%' vs '40', 'R$ 50,00' vs '50.00'
            // A lógica atual assume que o backend aceita o valor como string (ex: "40%", "R$ 50,00")
            onAddRepasse({ ...formData })
                  .then(() => { setFormData({ servico: '', tipo: 'Percentual', valor: '' }); onClose(); })
                  .catch(err => console.error("Erro ao salvar regra:", err)); // Erro já tratado
      };

      return (
            <FormModal show={show} onClose={onClose} title="Nova Regra de Repasse" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <div><label htmlFor="serv-regra" className="block text-sm font-medium text-gray-700 mb-1">Serviço</label><input type="text" id="serv-regra" name="servico" value={formData.servico} onChange={handleChange} list="serv-disp-sug" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" placeholder="Digite o nome do serviço" required /><datalist id="serv-disp-sug">{servicosDisponiveis.map(s => <option key={s.id || s.nome} value={s.nome} />)}</datalist></div>
                  <div className="grid grid-cols-2 gap-4">
                        <div><label htmlFor="tipo-regra" className="block text-sm font-medium text-gray-700 mb-1">Tipo (Comissão Clínica)</label><select id="tipo-regra" name="tipo" value={formData.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-400"><option value="Percentual">Percentual</option><option value="Fixo">Fixo</option></select></div>
                        <div><label htmlFor="valor-regra" className="block text-sm font-medium text-gray-700 mb-1">Valor</label><input type="text" id="valor-regra" name="valor" value={formData.valor} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" placeholder={formData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: R$ 50,00'} required /></div>
                  </div>
            </FormModal>
      );
};

const Configuracoes = ({ servicos = [], onUpdateServico, repasses = [], onUpdateRepasse, onAddRepasse, onDeleteRepasse, onAddServico, onDeleteServico, showToast }) => {
      const [editingIndex, setEditingIndex] = useState(null); // Índice da regra de repasse sendo editada
      const [editData, setEditData] = useState({}); // Dados da regra sendo editada
      const [showNovaRegraModal, setShowNovaRegraModal] = useState(false);
      const [showDeleteRepasseModal, setShowDeleteRepasseModal] = useState(false);
      const [repasseToDelete, setRepasseToDelete] = useState(null);
      const [novoServico, setNovoServico] = useState('');
      const [isSubmittingServico, setIsSubmittingServico] = useState(false); // Loading p/ add serviço
      const [isSubmittingRepasse, setIsSubmittingRepasse] = useState(false); // Loading p/ add regra

      // Wrapper para controlar loading ao Add Serviço
      const handleAddServicoWrapper = async (e) => {
            e.preventDefault(); if (novoServico.trim() === '') return;
            setIsSubmittingServico(true);
            try { await onAddServico({ nome: novoServico }); setNovoServico(''); } finally { setIsSubmittingServico(false); }
      };
      // Wrapper para controlar loading ao Add Regra Repasse
      const handleAddRepasseWrapper = async (regraData) => {
            setIsSubmittingRepasse(true);
            try { await onAddRepasse(regraData); } finally { setIsSubmittingRepasse(false); }
      }

      const handleDeleteRepasseClick = (item) => { setRepasseToDelete(item); setShowDeleteRepasseModal(true); };
      const confirmDeleteRepasse = () => { if (repasseToDelete) onDeleteRepasse(repasseToDelete.id); setShowDeleteRepasseModal(false); setRepasseToDelete(null); };

      // Edição Inline Repasse (simplificada)
      const handleEditRepasse = (index) => { setEditingIndex(index); setEditData(repasses[index]); };
      const handleCancelEditRepasse = () => { setEditingIndex(null); };
      const handleSaveRepasse = async (index) => {
            const itemToUpdate = repasses[index];
            const updatedItem = { ...itemToUpdate, ...editData };
            try { await onUpdateRepasse(updatedItem); } finally { setEditingIndex(null); }
      };
      const handleEditRepasseChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

      // Filtra serviços que já possuem regra para não aparecerem no dropdown de nova regra
      const servicosComRegra = useMemo(() => new Set((repasses || []).map(r => r.servico)), [repasses]);
      const servicosDisponiveis = useMemo(() => (servicos || []).filter(s => !servicosComRegra.has(s.nome)), [servicos, servicosComRegra]);
      const openNovaRegraModal = () => setShowNovaRegraModal(true);

      return (
            <div className="space-y-8">
                  {/* Ajustado para centralizar título em telas menores */}
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 text-center md:text-left">Configurações</h1>
                  {/* Gestão de Serviços */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg shadow-gray-200/50">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-700 mb-6">Gestão de Serviços</h3>
                        {/* Ajustado para empilhar em telas menores */}
                        <form onSubmit={handleAddServicoWrapper} className="flex flex-col sm:flex-row gap-4 mb-6">
                              <input type="text" value={novoServico} onChange={(e) => setNovoServico(e.target.value)} placeholder="Nome do novo serviço" className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-400" required />
                              <button type="submit" className={`${primaryButtonStyles} sm:w-auto`} disabled={isSubmittingServico}>
                                    {isSubmittingServico && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
                                    Adicionar Serviço
                              </button>
                        </form>
                        <div className="overflow-x-auto min-h-[150px]">
                              {(servicos || []).length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                          <thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="px-6 py-4 font-semibold">Serviço</th><th className="px-6 py-4 font-semibold text-right">Ações</th></tr></thead>
                                          <tbody className="text-gray-700">
                                                {(servicos || []).map((s) => (
                                                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-medium text-gray-900">{s.nome}</td><td className="px-6 py-4 text-right"><button onClick={() => onDeleteServico(s.id)} className={`${iconButtonStyles} text-red-600 hover:text-red-800 focus:ring-red-400`} aria-label="Apagar serviço"><Trash2 className="inline h-5 w-5" /></button></td></tr>
                                                ))}
                                          </tbody>
                                    </table>
                              ) : (<EmptyState icon={<FilePlus size={32} />} title="Nenhum serviço registado" message="Adicione serviços para selecioná-los nos agendamentos." />)}
                        </div>
                  </div>
                  {/* Regras de Repasse */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg shadow-gray-200/50">
                        {/* Ajustado para empilhar em telas menores */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                              <h3 className="text-xl lg:text-2xl font-bold text-gray-700">Regras de Repasse (Comissão Clínica)</h3>
                              <button onClick={openNovaRegraModal} className={primaryButtonStyles}>Nova Regra</button>
                        </div>
                        <div className="overflow-x-auto min-h-[150px]">
                              {(repasses || []).length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                          <thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="px-6 py-4 font-semibold">Serviço</th><th className="px-6 py-4 font-semibold">Tipo</th><th className="px-6 py-4 font-semibold">Valor</th><th className="px-6 py-4 font-semibold text-right">Ações</th></tr></thead>
                                          <tbody className="text-gray-700">
                                                {(repasses || []).map((r, index) => (
                                                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-900">{r.servico}</td>
                                                            {editingIndex === index ? (
                                                                  <>
                                                                        <td className="px-6 py-4"><select name="tipo" value={editData.tipo} onChange={handleEditRepasseChange} className="w-full p-1 border rounded focus:ring-pink-400"><option value="Percentual">Percentual</option><option value="Fixo">Fixo</option></select></td>
                                                                        <td className="px-6 py-4"><input name="valor" type="text" value={editData.valor} onChange={handleEditRepasseChange} placeholder={editData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: R$ 50,00'} className="w-full p-1 border rounded focus:ring-pink-400" /></td>
                                                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                                                              <button onClick={() => handleSaveRepasse(index)} className={`${iconButtonStyles} text-green-600 hover:text-green-800 focus:ring-green-400`} aria-label="Salvar"><Check size={20} /></button>
                                                                              <button onClick={handleCancelEditRepasse} className={`${iconButtonStyles} text-gray-500 hover:text-gray-700 ml-2 focus:ring-gray-400`} aria-label="Cancelar"><X size={20} /></button>
                                                                        </td>
                                                                  </>
                                                            ) : (
                                                                  <>
                                                                        <td className="px-6 py-4">{r.tipo}</td>
                                                                        <td className="px-6 py-4 font-bold">{r.valor}</td>
                                                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                                                              <button onClick={() => handleEditRepasse(index)} className={`${iconButtonStyles} text-blue-600 hover:text-blue-800 focus:ring-blue-400`} aria-label="Editar regra"><FilePenLine className="inline h-5 w-5" /></button>
                                                                              <button onClick={() => handleDeleteRepasseClick(r)} className={`${iconButtonStyles} text-red-600 hover:text-red-800 ml-4 focus:ring-red-400`} aria-label="Apagar regra"><Trash2 className="inline h-5 w-5" /></button>
                                                                        </td>
                                                                  </>
                                                            )}
                                                      </tr>
                                                ))}
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
      const [loading, setLoading] = useState(true); // Controla o spinner inicial E o loading pós-login
      const [toasts, setToasts] = useState([]);
      const [user, setUser] = useState(undefined); // undefined: checando, null: deslogado, object: logado

      // Função para exibir Toasts (mensagens flutuantes) - Definida ANTES dos handlers
      const showToast = (message, type = 'info') => {
            const id = Date.now() + Math.random(); // ID mais único
            // Garante que a mensagem é uma string
            const msgString = typeof message === 'string' ? message : 'Operação concluída.';
            setToasts(prev => [...prev, { id, message: msgString, type }]);
      };

      // Função genérica para chamadas API (GET, POST, PATCH, DELETE) - Definida ANTES dos handlers
      const makeApiCall = async (endpoint, method = 'GET', body = null, successMessage = null) => {
            const url = `${API_URL}/${endpoint}`;
            console.log(`API Call: ${method} ${url}`, body ? JSON.stringify(body).substring(0, 100) + '...' : ''); // Log truncado
            const options = {
                  method,
                  headers: { 'Content-Type': 'application/json' },
            };
            if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
                  options.body = JSON.stringify(body);
            }

            try {
                  const response = await fetch(url, options);
                  if (!response.ok) {
                        // Tenta extrair uma mensagem de erro do corpo da resposta, se houver
                        let errorData; let errorMessage = `Erro ${response.status}: ${response.statusText || 'Erro desconhecido'}`;
                        try {
                              const text = await response.text(); // Lê como texto primeiro
                              console.warn("API Error Response Text:", text); // Log como warning
                              if (text) { // Só tenta parsear se houver texto
                                    errorData = JSON.parse(text);
                                    errorMessage = errorData?.message || errorMessage;
                              }
                        } catch (e) { /* Ignora se não for JSON ou falhar ao ler */ console.warn("Could not parse error response as JSON", e) }
                        console.error(`API Error (${method} ${endpoint}):`, errorMessage, errorData);
                        throw new Error(errorMessage); // Lança o erro para ser pego pelo catch externo
                  }

                  // Se for DELETE ou PATCH/PUT sem retorno, ou se status for 204 No Content
                  // Verificação mais robusta para 'no content'
                  const contentType = response.headers.get("content-type");
                  const contentLength = response.headers.get("content-length");
                  if (method === 'DELETE' || response.status === 204 || contentLength === "0" || !contentType || !contentType.includes("application/json")) {
                        console.log(`API Success (${method} ${endpoint}): No JSON content returned`);
                        if (successMessage) showToast(successMessage, 'success');
                        return null; // Retorna null para indicar sucesso sem dados JSON
                  }

                  // Processa a resposta JSON
                  const data = await response.json();
                  console.log(`API Success (${method} ${endpoint}): Data received.`); // Não loga dados sensíveis
                  if (successMessage) showToast(successMessage, 'success');
                  return data;

            } catch (error) {
                  // Pega erros de rede (fetch falhou) ou erros lançados pelo !response.ok
                  console.error(`API Call Failed (${method} ${endpoint}):`, error);
                  // Adiciona mensagem específica para falha de fetch (pode ser CORS, servidor offline, etc.)
                  const errorMsg = String(error.message).includes("Failed to fetch")
                        ? `Falha ao conectar à API (${method} ${endpoint}). Verifique se o servidor (${API_URL}) está rodando e o CORS está configurado.`
                        : error.message || `Falha na operação (${method} ${endpoint}).`;
                  showToast(errorMsg, 'error');
                  throw error; // Re-lança o erro para que a função chamadora saiba que falhou
            }
      };

      // --- CRUD Handler Function Definition (Moved Before Usage) ---
      const crudHandler = (setter, sortFn = null) => ({
            // Adiciona item via POST, atualiza estado local
            add: async (endpoint, item, successMessage) => {
                  const addedItem = await makeApiCall(endpoint, 'POST', item, successMessage);
                  if (addedItem) { // Só atualiza estado se a API retornou o item adicionado
                        setter(prev => {
                              const newState = [addedItem, ...prev];
                              return sortFn ? sortFn(newState) : newState;
                        });
                  }
                  return addedItem; // Retorna o item ou null/undefined se falhar
            },
            // Atualiza item via PATCH (ou PUT), atualiza estado local
            update: async (endpoint, item, successMessage) => {
                  // Usa PATCH por padrão, assumindo atualização parcial
                  const updatedItem = await makeApiCall(`${endpoint}/${item.id}`, 'PATCH', item, successMessage);
                  let finalItem = updatedItem; // O que a API retornou

                  // Se a API retornou null (PATCH/DELETE ok sem corpo) OU se deu erro (updatedItem é undefined)
                  // usamos o 'item' original (com as mudanças locais) para atualizar o estado.
                  if (updatedItem === null || updatedItem === undefined) {
                        // Se a API retornou null (sucesso sem corpo), usamos o 'item' localmente modificado
                        // Se updatedItem for undefined (erro), a Promise rejeitou e não chegamos aqui,
                        // mas por segurança, usamos o item local se finalItem ainda for undefined.
                        finalItem = item;
                  }

                  // Atualiza o estado local SOMENTE se a operação API não lançou erro (makeApiCall trata isso)
                  // E se temos um item final (ou da API ou o local)
                  if (finalItem) {
                        setter(prev => {
                              const newState = prev.map(i => i.id === finalItem.id ? finalItem : i);
                              return sortFn ? sortFn(newState) : newState;
                        });
                  }
                  return updatedItem; // Retorna o que a API deu (pode ser null/undefined)
            },
            // Remove item via DELETE, atualiza estado local
            remove: async (endpoint, id, successMessage) => {
                  await makeApiCall(`${endpoint}/${id}`, 'DELETE', null, successMessage);
                  // Atualiza o estado local independentemente do retorno (se não deu erro, remove)
                  setter(prev => prev.filter(i => i.id !== id));
                  // Não há item para retornar
            }
      });


      // Instâncias dos handlers CRUD (criadas uma vez)
      const atendimentoOps = useMemo(() => crudHandler(setAtendimentos, (arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data))), [setAtendimentos]);
      const financeiroOps = useMemo(() => crudHandler(setFinanceiro, (arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data))), [setFinanceiro]);
      const estoqueOps = useMemo(() => crudHandler(setEstoque, (arr) => arr.sort((a, b) => (a.item || "").localeCompare(b.item || ""))), [setEstoque]);
      const servicoOps = useMemo(() => crudHandler(setServicos, (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))), [setServicos]);
      const repasseOps = useMemo(() => crudHandler(setRepasses, (arr) => arr.sort((a, b) => (a.servico || "").localeCompare(b.servico || ""))), [setRepasses]);
      const pacienteOps = useMemo(() => crudHandler(setPacientes, (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))), [setPacientes]);


      // Efeito para remover tema escuro (se existir)
      useEffect(() => {
            const root = window.document.documentElement;
            root.classList.remove('dark');
            localStorage.removeItem('theme');
      }, []);

      // Função para buscar todos os dados iniciais da API
      const fetchData = async () => {
            console.log("fetchData called");
            setLoading(true); // Garante que o loading está ativo
            const endpoints = ['atendimentos', 'financeiro', 'estoque', 'servicos', 'repasses', 'pacientes'];
            const setters = [setAtendimentos, setFinanceiro, setEstoque, setServicos, setRepasses, setPacientes];
            const sortFns = [
                  (arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data)), // Atendimentos
                  (arr) => arr.sort((a, b) => new Date(b.data) - new Date(a.data)), // Financeiro
                  (arr) => arr.sort((a, b) => (a.item || "").localeCompare(b.item || "")),          // Estoque
                  (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || "")),          // Servicos
                  (arr) => arr.sort((a, b) => (a.servico || "").localeCompare(b.servico || "")),    // Repasses
                  (arr) => arr.sort((a, b) => (a.nome || "").localeCompare(b.nome || "")),          // Pacientes
            ];

            try {
                  const results = await Promise.allSettled(
                        endpoints.map(endpoint => makeApiCall(endpoint)) // Faz chamadas GET
                  );

                  results.forEach((result, index) => {
                        if (result.status === 'fulfilled') {
                              const data = Array.isArray(result.value) ? result.value : []; // Garante que é um array
                              const sortedData = sortFns[index] ? sortFns[index]([...data]) : [...data]; // Ordena uma cópia
                              setters[index](sortedData); // Atualiza o estado correspondente
                              console.log(`Fetched ${endpoints[index]} successfully with ${data.length} items.`);
                        } else {
                              // O erro já foi logado e mostrado como toast por makeApiCall
                              console.error(`Failed to fetch ${endpoints[index]}:`, result.reason?.message || result.reason);
                              // Define o estado como array vazio em caso de erro para evitar que a UI quebre
                              setters[index]([]);
                        }
                  });
                  console.log("fetchData completed.");
            } catch (error) {
                  // Erro geral no Promise.allSettled (improvável, mas possível)
                  console.error("Critical error during initial data fetch:", error);
                  showToast('Erro crítico ao carregar dados. Tente recarregar.', 'error');
                  // Define todos os estados como arrays vazios
                  setters.forEach(setter => setter([]));
            } finally {
                  setLoading(false); // Esconde o spinner APÓS todas as tentativas
                  console.log("fetchData finished, loading set to false.");
            }
      };


      // Efeito para monitorar autenticação e buscar dados iniciais
      useEffect(() => {
            console.log("Setting up auth listener...");
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                  console.log("Auth state changed. User:", currentUser?.uid);
                  const wasCheckingAuth = user === undefined; // Verifica se era a primeira vez

                  setUser(currentUser); // Atualiza o estado do usuário (pode ser null ou o objeto do usuário)

                  if (currentUser) {
                        // Usuário está logado
                        if (wasCheckingAuth || financeiro.length === 0) { // Busca dados na primeira vez ou se os dados estiverem vazios
                              console.log("User logged in. Fetching data...");
                              setLoading(true); // Mostra spinner enquanto busca
                              await fetchData(); // Função que busca todos os dados da API
                        } else {
                              console.log("User is authenticated. Data already loaded.");
                              setLoading(false); // Esconde spinner se já tinha dados
                        }
                  } else {
                        // Usuário está deslogado
                        console.log("User is logged out.");
                        // Limpa os dados do estado para evitar mostrar dados antigos se outro usuário logar
                        setAtendimentos([]); setFinanceiro([]); setEstoque([]); setServicos([]); setRepasses([]); setPacientes([]);
                        setLoading(false); // Esconde o spinner
                  }
            });

            // Função de limpeza do useEffect: remove o listener quando o componente desmontar
            return () => {
                  console.log("Cleaning up auth listener.");
                  unsubscribe();
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []); // Array vazio significa que este useEffect roda apenas uma vez (montagem)


      // Função para remover um Toast específico
      const removeToast = (id) => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
      };

      // Função para fazer Logout
      const handleLogout = async () => {
            try {
                  await signOut(auth);
                  showToast('Sessão terminada.', 'info');
                  setCurrentPage('dashboard'); // Volta para o dashboard ao deslogar (será redirecionado para login)
            } catch (error) {
                  console.error("Erro ao fazer logout:", error);
                  showToast('Erro ao sair.', 'error');
            }
      };


      // --- Mapeamento das funções específicas para cada tipo de dado ---
      // Retornam a Promise de makeApiCall para permitir encadeamento (ex: .then(onClose))

      const handleAddAtendimento = (item) => atendimentoOps.add('atendimentos', item, 'Agendamento salvo!');
      const handleAddTransaction = (item, showAlert = false) => financeiroOps.add('financeiro', item, showAlert ? 'Transação adicionada!' : null);
      const handleAddItem = (item) => estoqueOps.add('estoque', item, 'Item adicionado!');
      const handleAddRepasse = (item) => repasseOps.add('repasses', item, 'Regra adicionada!');
      const handleAddServico = (item) => servicoOps.add('servicos', item, 'Serviço adicionado!');
      const handleAddPaciente = (item) => pacienteOps.add('pacientes', item, 'Paciente adicionado!');

      const handleUpdateAtendimento = (item) => atendimentoOps.update('atendimentos', item); // Mensagem de sucesso já vem da função que chama
      const handleUpdateTransaction = (item) => financeiroOps.update('financeiro', item); // Mensagem de sucesso já vem da função que chama
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

      // --- Renderização da Página Atual ---
      const renderPage = () => {
            // Adiciona verificações para garantir que os dados existem antes de passar para os componentes
            // Isso previne erros caso a API falhe em buscar algum dado específico
            const safeEstoque = estoque || [];
            const safeAtendimentos = atendimentos || [];
            const safeFinanceiro = financeiro || [];
            const safeRepasses = repasses || [];
            const safeServicos = servicos || [];
            const safePacientes = pacientes || [];

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

      // --- Renderização Principal do App ---
      if (user === undefined) {
            console.log("Render: Still checking auth state...");
            return <LoadingSpinner />; // Mostra spinner enquanto verifica o estado de autenticação
      }

      if (!user) {
            console.log("Render: User is logged out, showing AuthPage.");
            return <AuthPage showToast={showToast} />; // Mostra página de login se não houver usuário
      }

      // Usuário está logado, renderiza a interface principal
      console.log("Render: User is logged in.");
      return (
            <div className="flex min-h-screen bg-slate-50 font-sans text-gray-800">
                  {/* Estilos Globais e Animações */}
                  <style>{`
  		@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  		.animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; } /* Duração maior */
        .animate-fade-out { animation: fade-out 0.4s ease-in forwards; } /* Animação de saída */
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; } /* Animação simples para modais */
  		@keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        /* Estilo básico para scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  	  `}</style>

                  <ToastContainer toasts={toasts} removeToast={removeToast} />

                  <Sidebar
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        isOpen={isSidebarOpen}
                        setIsOpen={setIsSidebarOpen}
                        onLogout={handleLogout}
                  />

                  {/* Overlay para fechar sidebar mobile */}
                  {isSidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true"></div>}

                  <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
                        <Header onMenuClick={() => setIsSidebarOpen(true)} title={pageTitles[currentPage] || "Clínica"} />
                        {/* Ajustado padding para ser menor em telas pequenas */}
                        <div className="flex-grow p-4 md:p-6 lg:p-8">
                              {loading ? (
                                    console.log("Render: Loading data..."), <LoadingSpinner />
                              ) : (
                                    console.log("Render: Rendering page", currentPage), renderPage()
                              )}
                        </div>
                  </main>
            </div>
      );
}

