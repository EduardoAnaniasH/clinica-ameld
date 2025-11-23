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
      getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, where, writeBatch
} from 'firebase/firestore';
// --- FIM IMPORTAÇÕES DO FIRESTORE ---
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
// jsPDF e autoTable são carregados globalmente no index.html
import {
      LayoutGrid, Calendar as CalendarIcon, Wallet, Box, Settings, X, Menu,
      TrendingUp, ArrowLeftRight, CreditCard, DollarSign,
      AlertTriangle, CheckCircle2, Search, Trash2, FilePenLine, Info, Check, AlertCircle, LogOut, Download, Users, FilePlus, FileText, Loader2,
      Filter, SlidersHorizontal, ChevronDown, CheckSquare, Zap, Activity, Baby, Microscope, Save, RotateCcw, FileUp
} from 'lucide-react';

// Registra componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale);

// --- Mapeamentos de Status ---
const statusMap = {
      'Agendado': 'bg-blue-100 text-blue-800',
      'Confirmado': 'bg-green-100 text-green-800',
      'Realizado': 'bg-teal-100 text-teal-800',
      'Cancelado': 'bg-red-100 text-red-800'
};

const financialStatusMap = {
      'Recebido': 'bg-green-100 text-green-800',
      'A Receber': 'bg-yellow-100 text-yellow-800',
      'Pago': 'bg-gray-200 text-gray-800',
      'A Pagar': 'bg-red-100 text-red-800'
};

// --- Configuração do Firebase (INTOCADA) ---
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
const db = getFirestore(app);

// --- Estilos Base para Botões ---
const baseButtonStyles = "inline-flex items-center justify-center px-5 py-2 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] active:translate-y-px shadow-md hover:shadow-xl transform hover:-translate-y-px";
const primaryButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 focus:ring-pink-500`;
const secondaryButtonStyles = `${baseButtonStyles} bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400 border border-gray-200 hover:border-gray-300`;
const destructiveButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-500`;
const infoButtonStyles = `${baseButtonStyles} bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 focus:ring-blue-500`;
const linkButtonStyles = "text-pink-600 hover:text-pink-500 font-medium focus:outline-none focus:ring-1 focus:ring-pink-400 rounded transition-colors duration-150";
const iconButtonStyles = "p-1.5 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:bg-gray-100";

// --- Componentes Auxiliares ---

const LoadingSpinner = () => (<div className="flex h-screen w-full items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div></div>);
const EmptyState = ({ icon, title, message, actionButton }) => (<div className="text-center py-12 px-6 bg-white rounded-2xl shadow-sm border"><div className="mx-auto h-16 w-16 flex items-center justify-center bg-pink-50 rounded-full text-pink-400 mb-4">{icon}</div><h3 className="text-lg font-semibold text-gray-800">{title}</h3><p className="mt-1 text-sm text-gray-500">{message}</p>{actionButton && typeof actionButton.onClick === 'function' && (<div className="mt-6"><button onClick={actionButton.onClick} className={primaryButtonStyles}>{actionButton.label}</button></div>)}</div>);

// ** TOAST AESTHETIC **
const Toast = ({ id, message, type, removeToast }) => {
      const [isExiting, setIsExiting] = useState(false);
      useEffect(() => {
            const timer = setTimeout(() => { setIsExiting(true); setTimeout(() => removeToast(id), 400); }, 4000);
            return () => clearTimeout(timer);
      }, [id, removeToast]);

      const styles = {
            success: { classes: 'bg-white border-l-4 border-emerald-500 text-gray-800', icon: <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600"><Check size={18} strokeWidth={3} /></div> },
            error: { classes: 'bg-white border-l-4 border-red-500 text-gray-800', icon: <div className="bg-red-100 p-1.5 rounded-full text-red-600"><AlertCircle size={18} strokeWidth={3} /></div> },
            info: { classes: 'bg-white border-l-4 border-blue-500 text-gray-800', icon: <div className="bg-blue-100 p-1.5 rounded-full text-blue-600"><Info size={18} strokeWidth={3} /></div> }
      };
      const style = styles[type] || styles.info;
      const close = () => { setIsExiting(true); setTimeout(() => removeToast(id), 400); };

      return (
            <div className={`flex items-center p-4 rounded-r-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[320px] transform transition-all duration-500 ease-out mb-3 backdrop-blur-sm ${style.classes} ${isExiting ? 'animate-fade-out opacity-0 translate-x-full' : 'animate-fade-in-up opacity-100 translate-x-0'}`}>
                  <div className="mr-3 flex-shrink-0">{style.icon}</div>
                  <p className="flex-grow text-sm font-semibold tracking-wide">{message}</p>
                  <button onClick={close} className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors" aria-label="Fechar"><X size={16} /></button>
            </div>
      );
};
const ToastContainer = ({ toasts, removeToast }) => (<div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-xs sm:max-w-sm pointer-events-none"><div className="pointer-events-auto">{toasts.map(t => <Toast key={t.id} {...t} removeToast={removeToast} />)}</div></div>);

const Modal = ({ show, onClose, title, children }) => {
      useEffect(() => {
            if (show) document.body.style.overflow = 'hidden';
            else document.body.style.overflow = 'unset';
            return () => { document.body.style.overflow = 'unset'; };
      }, [show]);
      if (!show) return null;
      return (
            <div className="fixed inset-0 bg-black/70 z-40 flex justify-center items-start pt-16 p-4 animate-fade-in h-screen" onClick={onClose}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-50 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 bg-white p-6 sm:p-8 flex-shrink-0">
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h3>
                              <button onClick={onClose} className={`${iconButtonStyles} text-gray-400 hover:text-gray-600 focus:ring-gray-400 -mr-2`} aria-label="Fechar modal"><X size={24} /></button>
                        </div>
                        <div className="overflow-y-auto p-6 sm:p-8">{children}</div>
                  </div>
            </div>
      );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmLabel = "Apagar", confirmIcon = <Trash2 size={18} />, cancelLabel = "Cancelar", cancelIcon = <X size={18} />, isDestructive = true }) => {
      if (!show) return null;
      return (
            <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-start pt-16 p-4 animate-fade-in" onClick={onClose}>
                  <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center mb-4">
                              <div className={`mr-3 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-blue-100'} sm:h-12 sm:w-12`}>
                                    {isDestructive ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <Info className="h-5 w-5 text-blue-600" />}
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

const FormModal = ({ show, onClose, title, children, onSubmit, isSubmitting }) => {
      useEffect(() => { if (show) document.body.style.overflow = 'hidden'; else document.body.style.overflow = 'unset'; return () => { document.body.style.overflow = 'unset'; }; }, [show]);
      if (!show) return null;
      return (
            <div className="fixed inset-0 bg-black/70 z-40 flex justify-center items-start pt-16 p-4 animate-fade-in h-screen" onClick={onClose}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-50 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 bg-white p-6 sm:p-8 flex-shrink-0">
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h3>
                              <button onClick={onClose} className={`${iconButtonStyles} text-gray-400 hover:text-gray-600 focus:ring-gray-400 -mr-2`} aria-label="Fechar modal"><X size={24} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex-1 flex flex-col overflow-hidden">
                              <div className="overflow-y-auto p-6 sm:p-8 space-y-5 flex-1">{children}</div>
                              <div className="flex justify-end space-x-3 p-6 sm:p-8 border-t bg-gray-50/50 flex-shrink-0">
                                    <button type="button" onClick={onClose} className={secondaryButtonStyles} disabled={isSubmitting}><X size={18} className="mr-1.5" /> Cancelar</button>
                                    <button type="submit" className={primaryButtonStyles} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Check size={18} className="mr-1.5" />}{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
                              </div>
                        </form>
                  </div>
            </div>
      );
};

const FormInput = ({ id, label, type = "text", value, onChange, required = false, autoComplete, placeholder, list, inputMode, min }) => (<div>{label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}<input id={id} name={id} type={type} value={value} onChange={onChange} required={required} autoComplete={autoComplete} placeholder={placeholder} list={list} inputMode={inputMode} min={min} className="mt-1 block w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />{list && <datalist id={list}></datalist>}</div>);
const FormSelect = ({ id, label, value, onChange, children, required = false }) => (<div><label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label><select id={id} name={id} value={value} onChange={onChange} required={required} className="mt-1 block w-full pl-4 pr-10 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400">{children}</select></div>);

const CustomSelect = ({ label, options, value, onChange }) => {
      const [isOpen, setIsOpen] = useState(false);
      const selectRef = useRef(null);
      useEffect(() => {
            const handleClickOutside = (event) => { if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false); };
            document.addEventListener("mousedown", handleClickOutside); return () => { document.removeEventListener("mousedown", handleClickOutside); };
      }, []);
      const handleSelectOption = (optionValue) => { onChange(optionValue); setIsOpen(false); };
      return (
            <div className="relative" ref={selectRef}>
                  {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
                  <button type="button" className="mt-1 block w-full px-4 py-2.5 border border-gray-300 bg-white text-gray-800 rounded-lg shadow-sm text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-pink-400" onClick={() => setIsOpen(prev => !prev)}><span>{value || "Selecione..."}</span><ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} /></button>
                  {isOpen && (<div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200"><ul className="max-h-48 overflow-y-auto">{options.map((option) => (<li key={option} className={`px-4 py-2 text-gray-700 hover:bg-pink-100 hover:text-pink-600 cursor-pointer ${option === value ? 'bg-pink-50 font-semibold' : ''}`} onClick={() => handleSelectOption(option)}>{option}</li>))}</ul></div>)}
            </div>
      );
};

// ** NOVO: MODAL DE IMPORTAÇÃO DE CSV (O SALVADOR DE VIDAS) **
const ImportacaoCSVModal = ({ show, onClose, onImportConfirm, isSubmitting }) => {
      const [csvData, setCsvData] = useState([]);
      const [error, setError] = useState('');
      const [fileName, setFileName] = useState('');

      useEffect(() => {
            if (!show) { setCsvData([]); setError(''); setFileName(''); }
      }, [show]);

      const handleFileUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (evt) => {
                  const text = evt.target.result;
                  parseCSV(text);
            };
            reader.readAsText(file);
      };

      // Função para limpar e converter valores monetários inteligentemente
      const cleanNumber = (val) => {
            if (!val) return 0;
            val = val.trim();
            // Se tiver R$ ou se tiver ponto como milhar (1.000,00)
            if (val.includes('R$') || (val.includes(',') && val.indexOf('.') < val.indexOf(','))) {
                  // Formato Brasileiro: "R$ 1.200,50" ou "1.200,50"
                  return parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
            }
            // Formato Internacional/AppSheet: "1200.50" ou "1200"
            return parseFloat(val) || 0;
      };

      const parseCSV = (text) => {
            try {
                  const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== '');
                  if (lines.length < 2) throw new Error("Arquivo vazio ou inválido.");

                  // Detecta cabeçalho (procura linha com "Data" e ("Profissional" ou "Cliente" ou "Situação"))
                  let headerIndex = -1;
                  for (let i = 0; i < Math.min(20, lines.length); i++) {
                        const lineLower = lines[i].toLowerCase();
                        if (lineLower.includes('data') && (lineLower.includes('profissional') || lineLower.includes('cliente') || lineLower.includes('situacao'))) {
                              headerIndex = i;
                              break;
                        }
                  }

                  if (headerIndex === -1) throw new Error("Cabeçalho não encontrado. Verifique se o arquivo é um CSV de atendimentos.");

                  const headers = lines[headerIndex].split(/,|;/).map(h => h.trim().toLowerCase().replace(/"/g, ''));

                  // Mapeamento de índices (busca flexível)
                  const idxData = headers.findIndex(h => h.includes('data'));
                  const idxPaciente = headers.findIndex(h => h.includes('cliente') || h.includes('paciente'));
                  const idxProfissional = headers.findIndex(h => h.includes('profissional') && !h.includes('area'));
                  const idxServico = headers.findIndex(h => h.includes('procedimento') || h.includes('serviço'));
                  const idxValor = headers.findIndex(h => h.includes('valor') || h.includes('preço') || h.includes('final'));
                  const idxStatus = headers.findIndex(h => h.includes('situacao') || h.includes('status'));

                  if (idxData === -1) throw new Error("Coluna de DATA não encontrada.");
                  if (idxPaciente === -1) throw new Error("Coluna de PACIENTE/CLIENTE não encontrada.");

                  const parsed = [];
                  for (let i = headerIndex + 1; i < lines.length; i++) {
                        // Regex para lidar com vírgulas dentro de aspas (ex: "R$ 100,00")
                        let cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        if (cols.length < headers.length) cols = lines[i].split(';'); // Fallback para ponto e vírgula

                        if (cols.length > idxData) {
                              const clean = (val) => val ? val.replace(/"/g, '').trim() : '';

                              const dataRaw = clean(cols[idxData]);

                              // Tratamento de Data (Aceita YYYY-MM-DD ou DD/MM/YYYY)
                              let dataFinal = dataRaw;
                              if (dataRaw.includes('/')) {
                                    const parts = dataRaw.split('/');
                                    if (parts.length === 3) dataFinal = `${parts[2]}-${parts[1]}-${parts[0]}`; // Vira YYYY-MM-DD
                              } else if (dataRaw.includes('T')) {
                                    dataFinal = dataRaw.split('T')[0]; // Remove hora se tiver
                              }

                              const valorNum = idxValor > -1 ? cleanNumber(clean(cols[idxValor])) : 0;

                              if (dataFinal && dataFinal.length >= 8) {
                                    parsed.push({
                                          id: Math.random().toString(36).substr(2, 9),
                                          data: dataFinal,
                                          paciente: clean(cols[idxPaciente]),
                                          profissional: idxProfissional > -1 ? clean(cols[idxProfissional]) : 'Desconhecido',
                                          tipo: idxServico > -1 ? clean(cols[idxServico]) : 'Consulta',
                                          valor: valorNum.toFixed(2),
                                          status: idxStatus > -1 ? clean(cols[idxStatus]) : 'Realizado',
                                          setor: 'Clínico',
                                          categoria: 'Atendimento Clínico'
                                    });
                              }
                        }
                  }
                  setCsvData(parsed);
                  setError('');
            } catch (e) {
                  setError(e.message);
                  setCsvData([]);
            }
      };

      return (
            <Modal show={show} onClose={onClose} title="Importação em Massa">
                  <div className="space-y-4">
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                              {/* ACEITA QUALQUER ARQUIVO para evitar bloqueio do navegador, mas processamos como texto */}
                              <input type="file" id="csvFile" className="hidden" onChange={handleFileUpload} />
                              <label htmlFor="csvFile" className="cursor-pointer flex flex-col items-center justify-center">
                                    <FileUp className="h-10 w-10 text-blue-500 mb-2" />
                                    <span className="text-sm font-medium text-gray-700">{fileName || "Clique para selecionar o arquivo"}</span>
                                    <span className="text-xs text-gray-500 mt-1">Suporta CSV, Excel exportado, Texto (.csv, .txt, .xlsx*)</span>
                              </label>
                        </div>

                        {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center"><AlertCircle size={16} className="mr-2" />{error}</div>}

                        {csvData.length > 0 && (
                              <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                          <span className="text-sm font-bold text-green-700">{csvData.length} linhas encontradas</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                                          <table className="w-full text-xs text-left">
                                                <thead className="bg-gray-100 sticky top-0">
                                                      <tr>
                                                            <th className="p-2">Data</th>
                                                            <th className="p-2">Paciente</th>
                                                            <th className="p-2">Valor</th>
                                                            <th className="p-2">Status</th>
                                                      </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                      {csvData.slice(0, 50).map(r => (
                                                            <tr key={r.id}>
                                                                  <td className="p-2">{r.data}</td>
                                                                  <td className="p-2 truncate max-w-[100px]">{r.paciente}</td>
                                                                  <td className="p-2">R$ {r.valor}</td>
                                                                  <td className="p-2">{r.status}</td>
                                                            </tr>
                                                      ))}
                                                </tbody>
                                          </table>
                                          {csvData.length > 50 && <div className="p-2 text-center text-xs text-gray-500">...e mais {csvData.length - 50} linhas</div>}
                                    </div>

                                    <div className="flex items-center p-3 bg-blue-50 text-blue-800 rounded-lg text-xs">
                                          <Info size={16} className="mr-2 flex-shrink-0" />
                                          Isso irá gerar {csvData.length} atendimentos e lançamentos financeiros automaticamente.
                                    </div>

                                    <button onClick={() => onImportConfirm(csvData)} disabled={isSubmitting} className={`${primaryButtonStyles} w-full mt-4`}>
                                          {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                                          Confirmar Importação de {csvData.length} Itens
                                    </button>
                              </div>
                        )}
                  </div>
            </Modal>
      );
};

// --- Componentes Específicos das Páginas ---

const AuthPage = ({ showToast }) => { const [page, setPage] = useState('login'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const handleAuth = async (fn, successMsg, errorBase) => { setLoading(true); setError(''); try { const args = fn === sendPasswordResetEmail ? [auth, email] : [auth, email, password]; await fn(...args); showToast(successMsg, 'success'); if (fn === sendPasswordResetEmail) setPage('login'); } catch (err) { console.error(`${errorBase}:`, err); let msg = `${errorBase} inválido(s).`; if (err.code === 'auth/invalid-email') msg = 'Email inválido.'; else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') msg = 'Email ou senha incorreto(s).'; else if (err.code === 'auth/wrong-password') msg = 'Senha incorreta.'; else if (err.code === 'auth/weak-password') msg = 'Senha fraca (mín 6).'; else if (err.code === 'auth/email-already-in-use') msg = 'Email já em uso.'; setError(msg); showToast(`Falha: ${msg}`, 'error'); } finally { setLoading(false); } }; const login = (e) => { e.preventDefault(); handleAuth(signInWithEmailAndPassword, 'Bem-vindo(a) de volta! ✨', 'login'); }; const register = (e) => { e.preventDefault(); handleAuth(createUserWithEmailAndPassword, 'Conta criada! Bem-vindo(a) 🎉', 'registro'); }; const reset = (e) => { e.preventDefault(); handleAuth(sendPasswordResetEmail, 'Email enviado! Verifique sua caixa.', 'reset'); }; const fields = (isReg = false) => (<> <FormInput id={`e-${page}`} label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /> {page !== 'forgot' && (<FormInput id={`p-${page}`} label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isReg ? "Mín 6" : ""} required={page !== 'forgot'} autoComplete={isReg ? "new-password" : "current-password"} />)}</>); const btn = (label, loadLabel) => (<div><button type="submit" disabled={loading} className={`${primaryButtonStyles} w-full py-3`}>{loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}{loading ? loadLabel : label}</button></div>); const content = () => { switch (page) { case 'register': return (<> <h2 className="text-xl font-bold text-center mb-6">Criar Conta</h2> <form className="space-y-6" onSubmit={register}>{fields(true)}{error && <p className="text-sm text-red-600 text-center">{error}</p>}{btn('Registrar', 'Registrando...')}</form> <div className="text-sm text-center mt-6"><span className="text-gray-500">Já tem conta? </span><button onClick={() => { setPage('login'); setError(''); }} className={linkButtonStyles}>Entrar</button></div> </>); case 'forgot': return (<> <h2 className="text-xl font-bold text-center mb-4">Recuperar Senha</h2> <p className="text-center text-gray-600 mb-6 text-sm">Insira o email para receber link.</p> <form className="space-y-6" onSubmit={reset}>{fields()}{error && <p className="text-sm text-red-600 text-center">{error}</p>}{btn('Enviar Email', 'Enviando...')}</form> <div className="text-sm text-center mt-6"><button onClick={() => { setPage('login'); setError(''); }} className={linkButtonStyles}>Voltar Login</button></div> </>); default: return (<> <h2 className="text-xl font-bold text-center mb-6">Login</h2> <form className="space-y-6" onSubmit={login}>{fields()}{error && <p className="text-sm text-red-600 text-center">{error}</p>}<div className="text-sm text-right"><button type="button" onClick={() => { setPage('forgot'); setError(''); }} className={linkButtonStyles}>Esqueceu?</button></div>{btn('Entrar', 'Entrando...')}</form> <div className="text-sm text-center mt-6"><span className="text-gray-500">Não tem conta? </span><button onClick={() => { setPage('register'); setError(''); }} className={linkButtonStyles}>Registre-se</button></div> </>); } }; return (<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4"><div className="w-full max-w-md p-8 sm:p-10 space-y-6 bg-white rounded-2xl shadow-xl"><div className="text-center"><img src="/logo(2).png" alt="Logo" className="h-14 mx-auto mb-4" />{page === 'login' && <p className="text-gray-500">Bem-vindo(a)! Faça login.</p>}</div>{content()}</div></div>); };
const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen, onLogout }) => { const items = [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-5 w-5 mr-3" /> }, { id: 'atendimentos', label: 'Atendimentos', icon: <CalendarIcon className="h-5 w-5 mr-3" /> }, { id: 'pacientes', label: 'Pacientes', icon: <Users className="h-5 w-5 mr-3" /> }, { id: 'financeiro', label: 'Financeiro', icon: <Wallet className="h-5 w-5 mr-3" /> }, { id: 'estoque', label: 'Estoque', icon: <Box className="h-5 w-5 mr-3" /> }, { id: 'configuracoes', label: 'Configurações', icon: <Settings className="h-5 w-5 mr-3" /> }]; const linkCls = (id) => `flex items-center px-4 py-3 text-gray-700 hover:text-pink-600 font-medium rounded-lg transition-all ${currentPage === id ? 'bg-pink-100 text-pink-600 font-semibold shadow-sm' : 'hover:bg-gray-50'}`; const sidebarCls = `fixed inset-y-0 left-0 z-30 w-64 bg-white border-r flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`; const click = (id) => { setCurrentPage(id); if (window.innerWidth < 1024) setIsOpen(false); }; return (<aside className={sidebarCls}><div className="h-20 flex items-center px-4 border-b relative"><img src="/logo(2).png" alt="Logo" className="h-10" /><button onClick={() => setIsOpen(false)} className={`${iconButtonStyles} text-gray-500 lg:hidden absolute right-4 top-1/2 -translate-y-1/2`}><X className="h-6 w-6" /></button></div><nav className="flex-1 px-4 py-6 space-y-1.5">{items.map(i => <button key={i.id} className={`${linkCls(i.id)} w-full text-left`} onClick={() => click(i.id)}>{i.icon}{i.label}</button>)}</nav><div className="p-4 border-t"><button onClick={onLogout} className={`flex items-center w-full text-red-600 font-medium rounded-lg hover:bg-red-50 justify-start px-4 py-3`}><LogOut className="h-5 w-5 mr-3" />Sair</button></div></aside>); };
const Header = ({ onMenuClick, title }) => (<header className="lg:hidden bg-white sticky top-0 z-10 flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 border-b shadow-sm"><button onClick={onMenuClick} className={`${iconButtonStyles} text-gray-600`}><Menu className="h-6 w-6" /></button><span className="flex-grow text-center text-lg font-semibold truncate px-2">{title}</span><div className="w-10"></div></header>);
const AtendimentosChart = ({ atendimentos }) => { const ref = useRef(null); const instance = useRef(null); useEffect(() => { ChartJS.defaults.color = '#64748b'; ChartJS.defaults.borderColor = '#e2e8f0'; const ctx = ref.current?.getContext('2d'); if (!ctx) return; if (instance.current) instance.current.destroy(); const data = (atendimentos || []).reduce((acc, c) => { acc[c.setor || 'N/A'] = (acc[c.setor || 'N/A'] || 0) + 1; return acc; }, {}); const labels = Object.keys(data); const values = Object.values(data); if (labels.length > 0) { instance.current = new ChartJS(ctx, { type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d'], borderColor: '#fff', borderWidth: 4, hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } } } } }); } return () => instance.current?.destroy(); }, [atendimentos]); return (<div className="relative w-full h-64 sm:h-80"><canvas ref={ref}></canvas>{(!atendimentos || atendimentos.length === 0) && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Sem dados.</div>}</div>); };
const DailyRevenueChart = ({ data }) => { const ref = useRef(null); const instance = useRef(null); useEffect(() => { ChartJS.defaults.color = '#64748b'; ChartJS.defaults.borderColor = '#e2e8f0'; const ctx = ref.current?.getContext('2d'); if (!ctx) return; if (instance.current) instance.current.destroy(); if (data?.labels?.length > 0 && data.values.some(v => v > 0)) { instance.current = new ChartJS(ctx, { type: 'bar', data: { labels: data.labels, datasets: [{ label: 'Faturamento', data: data.values, backgroundColor: '#f9a8d4', borderColor: '#f472b6', borderWidth: 1, borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.dataset.label || ''}: ${c.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` } } } } }); } return () => instance.current?.destroy(); }, [data]); return (<div className="relative w-full h-64 sm:h-80"><canvas ref={ref}></canvas>{(!data || !data.values || !data.values.some(v => v > 0)) && <div className="absolute inset-0 flex items-center justify-center text-gray-500">Sem dados.</div>}</div>); };
const StatCard = ({ icon, title, value, subtitle, colorClass }) => (<div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 hover:shadow-lg min-h-[100px] sm:min-h-[90px]"><div className={`rounded-lg p-2.5 flex-shrink-0 mx-auto sm:mx-0 ${colorClass?.bg || 'bg-gray-100'}`}>{React.isValidElement(icon) ? React.cloneElement(icon, { size: 20 }) : icon}</div><div className="flex-grow overflow-hidden text-center sm:text-left"><p className="text-xs font-medium text-gray-500 truncate">{title || 'Título'}</p><p className={`text-base sm:text-lg font-bold ${colorClass?.text || 'text-gray-800'}`}>{value || '0'}</p>{subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}</div></div>);

// ** Dashboard **
const Dashboard = ({ estoque, atendimentos, financeiro, repasses }) => { const today = new Date(); const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); const formatCurrency = (v) => (typeof v !== 'number' || isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); const totals = useMemo(() => { let fatBruto = 0, despPaga = 0, repRecebidos = 0; (financeiro || []).forEach(t => { const v = Number(t.valor) || 0; if (t.tipo === 'Entrada' && t.status === 'Recebido') fatBruto += v; if (t.tipo === 'Saída' && t.status === 'Pago') despPaga += v; const regra = (repasses || []).find(r => r.servico === t.descricao); if (regra && t.tipo === 'Entrada' && t.status === 'Recebido') { if (regra.tipo === 'Percentual') { const p = parseFloat(String(regra.valor).replace(/[^0-9,.-]+/g, "").replace(",", ".")) / 100; if (!isNaN(p)) repRecebidos += v * p; } else if (regra.tipo === 'Fixo') { const f = parseFloat(String(regra.valor).replace(/[^0-9,.-]+/g, "").replace(",", ".")); if (!isNaN(f)) repRecebidos += Math.min(f, v); } } }); const resClinica = repRecebidos - despPaga; const fluxoCaixa = fatBruto - despPaga; return { fatBruto, despPaga, repRecebidos, fluxoCaixa, resClinica }; }, [financeiro, repasses]); const dailyData = useMemo(() => { const lbls = [], vals = []; const today = new Date(); for (let i = 6; i >= 0; i--) { const dt = new Date(today); dt.setDate(today.getDate() - i); const dStr = dt.toISOString().slice(0, 10); lbls.push(dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })); const rev = (financeiro || []).filter(t => t.data === dStr && t.tipo === 'Entrada' && t.status === 'Recebido').reduce((s, t) => s + (Number(t.valor) || 0), 0); vals.push(rev); } return { labels: lbls, values: vals }; }, [financeiro]); const comprar = useMemo(() => (estoque || []).filter(i => { const c = Number(i.consumoMedio) || 0; const a = Number(i.atual) || 0; const m = Math.ceil(c * 0.3); return c > 0 && a <= m; }), [estoque]); return (<div className="space-y-6"><div className="text-center sm:text-left hidden lg:block"><h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Olá!</h1><p className="text-gray-500">{dateStr}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"><StatCard title="Faturamento Bruto" value={formatCurrency(totals.fatBruto)} subtitle="Total entradas" icon={<TrendingUp className="text-blue-600" />} colorClass={{ bg: "bg-blue-100", text: "text-blue-600" }} /><StatCard title="Comissão Clínica" value={formatCurrency(totals.repRecebidos)} subtitle="Valor clínica (bruto)" icon={<ArrowLeftRight className="text-orange-600" />} colorClass={{ bg: "bg-orange-100", text: "text-orange-600" }} /><StatCard title="Despesa Paga" value={formatCurrency(totals.despPaga)} subtitle="Total saídas pagas" icon={<CreditCard className="text-red-600" />} colorClass={{ bg: "bg-red-100", text: "text-red-600" }} /><StatCard title="Fluxo de Caixa" value={formatCurrency(totals.fluxoCaixa)} subtitle="Entradas - Saídas" icon={<DollarSign className="text-gray-600" />} colorClass={{ bg: "bg-gray-100", text: "text-gray-600" }} /><StatCard title="Resultado da Clínica" value={formatCurrency(totals.resClinica)} subtitle="Comissão - Despesas Pagas" icon={<CheckCircle2 className="text-green-600" />} colorClass={{ bg: "bg-green-100", text: "text-green-600" }} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="md:col-span-1 bg-amber-50 border p-5 rounded-2xl shadow-sm"><h3 className="text-base font-semibold text-amber-800 mb-3 flex items-center"><AlertTriangle className="h-5 w-5 mr-1.5 text-amber-500" /> Avisos Estoque</h3>{comprar.length > 0 ? (<div><p className="text-xs text-amber-700 mb-2">Itens baixos:</p><ul className="space-y-1.5 max-h-48 overflow-y-auto pr-2">{comprar.map(i => (<li key={i.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white border"><span className="font-medium truncate mr-2" title={i.item}>{i.item}</span><span className="font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full text-[10px] flex-shrink-0">{i.atual}</span></li>))}</ul></div>) : (<div className="text-center py-4"><CheckCircle2 className="h-8 w-8 mx-auto text-green-400" /><p className="text-xs mt-2 font-medium">Estoque OK!</p><p className="text-[11px] text-gray-400">Nenhum item baixo.</p></div>)}</div><div className="md:col-span-2 bg-white p-5 rounded-2xl shadow-sm border"><h3 className="text-base font-semibold mb-4">Faturamento (Recebido) - 7 Dias</h3><DailyRevenueChart data={dailyData} /></div><div className="md:col-span-3 bg-white p-5 rounded-2xl shadow-sm border"><h3 className="text-base font-semibold mb-4">Atendimentos por Setor</h3><AtendimentosChart atendimentos={atendimentos} /></div></div></div>); };

// ** AgendamentoModal OTIMIZADO + EDITÁVEL **
const AgendamentoModal = ({ show, onClose, servicos = [], onAddAtendimento, pacientes = [], isSubmitting }) => {
      const profissionais = ["ALICE NUNES DA SIL", "Andréia", "Antônia Marlleny", "Antônio Gomes", "Antônio Maia", "CARLOS ADRIANO DE OL", "Ciarline Menezes", "CLAUBERLANDIA GOME", "CLEIDIVAN NOBREGA G", "Cristiano", "Davi Feijão", "ELEONAI SANTOS SILVA", "FRANCISCA LUZIANE LIM", "FRANCISCO ENILSON M", "Ingriti Lima", "JESSICA SANTOS OLI", "Jessica santos", "José Andrade Costa", "José Edeme", "JOSIANE SILVA DA COST", "JULIANE ADRIANO LIMA", "Marcelo Leite", "MARIA HOLANDA MART", "MARIA LUCIENE DA SILV", "Marília", "nirreylle", "PRISCILLA DE FREITAS SI", "Rafaele Reis da Roch", "Raimundo nascimento", "Renata Luma", "Rodrigo Darube", "Rogério Nascimento", "Ronaldo Lobato", "SAMILE GOMES ARAUJO", "Simone Dias", "VITÓRIA EMILLE SA", "Vitória Emille"].sort();
      const mapProfissionalSetor = { "Ciarline Menezes": "Imagem", "JOSIANE SILVA DA COST": "Imagem", "CLAUBERLANDIA GOME": "Imagem", "SAMILE GOMES ARAUJO": "Imagem", "MARIA LUCIENE DA SILV": "Imagem", "Rafaele Reis da Roch": "Laboratório", "VITÓRIA EMILLE SA": "Laboratório", "Vitória Emille": "Laboratório", "CLEIDIVAN NOBREGA G": "Laboratório", "ELEONAI SANTOS SILVA": "Laboratório", "FRANCISCA LUZIANE LIM": "Laboratório", "JULIANE ADRIANO LIMA": "Laboratório", "Antônia Marlleny": "Clínico", "ALICE NUNES DA SIL": "Clínico", "FRANCISCO ENILSON M": "Clínico", "MARIA HOLANDA MART": "Clínico", "JESSICA SANTOS OLI": "Clínico", "Jessica santos": "Clínico", "PRISCILLA DE FREITAS SI": "Clínico", "CARLOS ADRIANO DE OL": "Clínico" };
      const defaultShortcuts = [{ id: '1', label: "Psicologia", valor: "110,00", setor: "Clínico", nomeComp: "ACOMPANHAMENTO PSICOL" }, { id: '2', label: "Nutrição", valor: "150,00", setor: "Clínico", nomeComp: "CONSULTA NUTRICIONISTA" }, { id: '3', label: "USG Obstétrica", valor: "110,00", setor: "Imagem", nomeComp: "ULTRASSONOGRAFIA OBSTÉ" }, { id: '4', label: "USG Abdom", valor: "120,00", setor: "Imagem", nomeComp: "ULTRASSONOGRAFIA ABDOM" }, { id: '5', label: "Sexagem Fetal", valor: "190,00", setor: "Laboratório", nomeComp: "SEXAGEM FETAL - 4 DIAS" }, { id: '6', label: "Beta HCG", valor: "20,00", setor: "Laboratório", nomeComp: "BETA HCG - QUALITATIVO" }];
      const [shortcuts, setShortcuts] = useState(() => { try { const saved = localStorage.getItem('clinica_atalhos_v1'); return saved ? JSON.parse(saved) : defaultShortcuts; } catch (e) { return defaultShortcuts; } });
      const [isEditingShortcuts, setIsEditingShortcuts] = useState(false);
      const [formData, setFormData] = useState({ data: '2024-10-01', paciente: '', profissional: 'Andréia', servico: '', valor: '', setor: 'Clínico', status: 'Realizado', categoria: '' });
      const [lancarFinanceiro, setLancarFinanceiro] = useState(true);
      const [sessionCount, setSessionCount] = useState(0);

      useEffect(() => {
            if (show && !formData.preservarData) {
                  setFormData(prev => ({ ...prev, data: prev.data || '2024-10-01', paciente: '', servico: '', valor: '', profissional: prev.profissional || 'Andréia', setor: prev.setor || 'Clínico', status: 'Realizado', categoria: '' }));
                  setLancarFinanceiro(true); setIsEditingShortcuts(false);
            }
      }, [show]);

      const handleShortcutChange = (id, field, value) => { setShortcuts(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s)); };
      const saveShortcuts = () => { localStorage.setItem('clinica_atalhos_v1', JSON.stringify(shortcuts)); setIsEditingShortcuts(false); };
      const resetShortcuts = () => { setShortcuts(defaultShortcuts); localStorage.removeItem('clinica_atalhos_v1'); setIsEditingShortcuts(false); };
      const handleChange = (e) => { const { name, value } = e.target; let updates = { [name]: value }; if (name === 'profissional') { const setorSugerido = mapProfissionalSetor[value]; if (setorSugerido) updates.setor = setorSugerido; } if (name === 'servico') { const sel = servicos.find(s => s.nome === value); if (sel && sel.valorPadrao && !formData.valor) updates.valor = sel.valorPadrao; } setFormData(p => ({ ...p, ...updates })); };
      const applyShortcut = (atalho) => { setFormData(prev => ({ ...prev, servico: atalho.nomeComp, valor: atalho.valor, setor: atalho.setor })); };
      const createPayload = () => { const v = parseFloat(String(formData.valor).replace(',', '.')) || 0; return { data: formData.data, paciente: formData.paciente, profissional: formData.profissional, tipo: formData.servico, valor: v.toFixed(2), setor: formData.setor, status: formData.status, categoria: formData.categoria.trim() || 'Atendimento Clínico', lancarFinanceiro: lancarFinanceiro }; };
      const handleSubmit = () => { onAddAtendimento(createPayload()).then(() => { setFormData(prev => ({ ...prev, preservarData: false })); setSessionCount(prev => prev + 1); onClose(); }).catch(err => { }); };
      const handleSaveAndNew = () => { onAddAtendimento(createPayload()).then(() => { setFormData(prev => ({ ...prev, preservarData: true, paciente: '', servico: '', valor: '', categoria: '' })); setSessionCount(prev => prev + 1); setTimeout(() => document.getElementById('paciente')?.focus(), 100); }).catch(err => { }); };
      const sOpts = useMemo(() => (servicos || []).map(s => <option key={s.id || s.nome} value={s.nome} />), [servicos]);
      const pOpts = useMemo(() => [...new Set((pacientes || []).map(p => p.nome))].map(p => <option key={p} value={p} />), [pacientes]);

      return (
            <FormModal show={show} onClose={onClose} title="Lançamento Turbo" onSubmit={handleSubmit} isSubmitting={isSubmitting}>
                  <div className="grid grid-cols-2 gap-4"><FormInput id="data" label="Data" type="date" value={formData.data} onChange={handleChange} required /><CustomSelect label="Profissional" options={profissionais} value={formData.profissional} onChange={(newValue) => handleChange({ target: { name: 'profissional', value: newValue } })} /></div>
                  <FormInput id="paciente" label="Paciente" value={formData.paciente} onChange={handleChange} list="pacientes-sugestoes" placeholder="Nome" required /><datalist id="pacientes-sugestoes">{pOpts}</datalist>
                  <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-gray-600 flex items-center uppercase tracking-wide"><Zap size={14} className="mr-1.5 text-amber-500" /> Preenchimento Rápido</label><button type="button" onClick={() => setIsEditingShortcuts(!isEditingShortcuts)} className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50"><Settings size={16} /></button></div>
                        {isEditingShortcuts ? (<div className="space-y-3 animate-fade-in"><div className="max-h-60 overflow-y-auto pr-2 space-y-2">{shortcuts.map((s) => (<div key={s.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border shadow-sm"><div className="col-span-3"><input type="text" value={s.label} onChange={(e) => handleShortcutChange(s.id, 'label', e.target.value)} className="w-full text-xs p-1 border rounded" placeholder="Botão" /></div><div className="col-span-4"><input type="text" value={s.nomeComp} onChange={(e) => handleShortcutChange(s.id, 'nomeComp', e.target.value)} className="w-full text-xs p-1 border rounded" placeholder="Serviço" /></div><div className="col-span-2"><input type="text" value={s.valor} onChange={(e) => handleShortcutChange(s.id, 'valor', e.target.value)} className="w-full text-xs p-1 border rounded" placeholder="$$" /></div><div className="col-span-3"><select value={s.setor} onChange={(e) => handleShortcutChange(s.id, 'setor', e.target.value)} className="w-full text-xs p-1 border rounded"><option>Clínico</option><option>Imagem</option><option>Laboratório</option></select></div></div>))}</div><div className="flex justify-end space-x-2 pt-2 border-t"><button type="button" onClick={resetShortcuts} className="text-xs text-red-500 hover:text-red-700 flex items-center px-3 py-1.5 border border-red-200 rounded bg-white"><RotateCcw size={12} className="mr-1" /> Reset</button><button type="button" onClick={saveShortcuts} className="text-xs text-white bg-blue-600 hover:bg-blue-700 flex items-center px-4 py-1.5 rounded font-bold shadow-sm"><Save size={12} className="mr-1" /> Salvar</button></div></div>) : (<div className="flex flex-wrap gap-2">{shortcuts.map((a) => (<button key={a.id} type="button" onClick={() => applyShortcut(a)} className="group relative flex flex-col items-start px-3 py-2 bg-white hover:bg-pink-50 text-gray-700 hover:text-pink-700 text-xs rounded-lg border border-gray-200 hover:border-pink-200 shadow-sm transition-all active:scale-95"><span className="font-bold mb-0.5">{a.label}</span><span className="text-[10px] text-gray-400 group-hover:text-pink-500">R$ {a.valor}</span></button>))}</div>)}
                  </div>
                  <div className="grid grid-cols-2 gap-4"><div><FormInput id="servico" label="Serviço" value={formData.servico} onChange={handleChange} list="servicos-sugestoes" placeholder="Ex: Consulta" required /><datalist id="servicos-sugestoes">{sOpts}</datalist></div><FormSelect id="setor" label="Setor (Auto)" name="setor" value={formData.setor} onChange={handleChange}><option value="Clínico">Clínico</option><option value="Enfermagem">Enfermagem</option><option value="Laboratório">Laboratório</option><option value="Imagem">Imagem</option></FormSelect></div>
                  <div className="grid grid-cols-2 gap-4"><FormInput id="valor" label="Valor (R$)" value={formData.valor} onChange={handleChange} placeholder="0,00" required inputMode="decimal" /><FormSelect id="status" label="Status" name="status" value={formData.status} onChange={handleChange}><option value="Realizado">Realizado</option><option value="Agendado">Agendado</option><option value="Confirmado">Confirmado</option><option value="Cancelado">Cancelado</option></FormSelect></div>
                  <div className="mt-3 bg-green-50 p-3 rounded-lg border border-green-100 flex items-center cursor-pointer" onClick={() => setLancarFinanceiro(!lancarFinanceiro)}><div className={`flex-shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors ${lancarFinanceiro ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>{lancarFinanceiro && <Check size={14} className="text-white" />}</div><label className="ml-3 text-sm font-medium text-green-800 cursor-pointer select-none">Lançar valor como <strong>Recebido</strong> no Financeiro</label></div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center"><div className="text-xs text-gray-500 italic flex items-center">{sessionCount > 0 ? <><CheckCircle2 size={12} className="mr-1 text-green-500" /> {sessionCount} lançados nesta sessão.</> : "* Mantém Data Fixa."}</div><button type="button" onClick={handleSaveAndNew} disabled={isSubmitting} className={`${primaryButtonStyles} bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700`}>{isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <FilePlus size={18} className="mr-1.5" />} Salvar e Próximo</button></div>
            </FormModal>
      );
};

// ** AtendimentoList **
const AtendimentoList = ({ items, handleUpdateStatus, handleDeleteClick, openAgendamentoModal }) => { if (!items || items.length === 0) { return <EmptyState icon={<CalendarIcon size={32} />} title="Nenhum atendimento" message="Não há atendimentos." actionButton={{ label: "Novo Agendamento", onClick: openAgendamentoModal }} />; } return (<div className="space-y-3">{items.map(at => (<div key={at.id} className="p-4 bg-white border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/80"><div className="flex-1 mb-3 sm:mb-0"><p className="font-semibold">{at.paciente}</p><p className="text-sm text-gray-600">{at.tipo} - {at.profissional}</p><p className="text-xs text-gray-400 mt-1">{at.data ? new Date(at.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-'} - {at.setor}</p></div><div className="flex items-center gap-3 flex-wrap justify-end"><span className="text-base font-bold">{(Number(at.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusMap[at.status] || 'bg-gray-100'}`}>{at.status?.toUpperCase() || 'N/A'}</span>{at.status === 'Agendado' && (<div className="flex gap-2"><button onClick={() => handleUpdateStatus(at, 'Confirmado')} className={`${secondaryButtonStyles} bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs px-2.5 py-1`}><Check size={14} className="mr-1" />Confirmar</button><button onClick={() => handleUpdateStatus(at, 'Cancelado')} className={`${secondaryButtonStyles} bg-red-50 text-red-700 border-red-200 hover:bg-red-100 text-xs px-2.5 py-1`}><X size={14} className="mr-1" />Cancelar</button></div>)}<button onClick={() => handleDeleteClick(at)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-4 w-4" /></button></div></div>))}</div>); };

// ** Atendimentos (ATUALIZADO PARA GERAR FINANCEIRO AUTOMÁTICO + IMPORTAÇÃO CSV) **
const Atendimentos = ({ servicos = [], atendimentos = [], onUpdateAtendimento, onAddAtendimento, onDeleteAtendimento, onAddTransaction, financeiro = [], showToast, pacientes = [] }) => {
      const [showNew, setShowNew] = useState(false);
      const [showDel, setShowDel] = useState(false);
      const [showImport, setShowImport] = useState(false);
      const [toDelete, setToDelete] = useState(null);
      const [tab, setTab] = useState('historico');
      const [isSubmitting, setIsSubmitting] = useState(false);

      const delClick = (i) => { setToDelete(i); setShowDel(true); };
      const confirmDelete = () => { if (toDelete) onDeleteAtendimento(toDelete.id); setShowDel(false); setToDelete(null); };

      const updateStatus = async (atendimento, newStatus) => {
            const updated = { ...atendimento, status: newStatus };
            try {
                  await onUpdateAtendimento(updated);
                  if (newStatus === 'Confirmado') {
                        const q = query(collection(db, 'financeiro'), where("atendimentoId", "==", atendimento.id));
                        const snap = await getDocs(q);
                        if (snap.empty) {
                              const categoriaFinanceira = atendimento.categoria || 'Atendimento Clínico';
                              const trans = { data: atendimento.data, descricao: atendimento.tipo, pagador: atendimento.paciente, categoria: categoriaFinanceira, tipo: 'Entrada', valor: parseFloat(atendimento.valor) || 0, status: 'A Receber', atendimentoId: atendimento.id };
                              await onAddTransaction(trans);
                              showToast(`"A Receber" criado.`, 'info');
                        }
                  }
            } catch (e) { console.error("Erro update status:", e); }
      };

      const addWrapper = async (newAt) => {
            setIsSubmitting(true);
            try {
                  const { lancarFinanceiro, ...atendimentoParaSalvar } = newAt;
                  const docSaved = await onAddAtendimento(atendimentoParaSalvar);
                  let deveLancar = typeof lancarFinanceiro !== 'undefined' ? lancarFinanceiro : ['Realizado', 'Confirmado'].includes(atendimentoParaSalvar.status);
                  if (deveLancar) {
                        const trans = { data: atendimentoParaSalvar.data, descricao: atendimentoParaSalvar.tipo, pagador: atendimentoParaSalvar.paciente, categoria: atendimentoParaSalvar.categoria || 'Atendimento Clínico', tipo: 'Entrada', valor: parseFloat(atendimentoParaSalvar.valor) || 0, status: 'Recebido', atendimentoId: docSaved.id };
                        await onAddTransaction(trans, false);
                        showToast('Salvo e lançado no Financeiro!', 'success');
                  } else { showToast('Agendamento salvo!', 'success'); }
                  return Promise.resolve();
            } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); }
      };

      const handleBatchImport = async (dataList) => {
            setIsSubmitting(true);
            try {
                  const batchSize = 20;
                  let processed = 0;
                  // Processa em lotes pequenos para não travar a UI (pseudo-batch visual, na vdd é promise.all)
                  for (let i = 0; i < dataList.length; i += batchSize) {
                        const chunk = dataList.slice(i, i + batchSize);
                        await Promise.all(chunk.map(async (item) => {
                              const { id, ...cleanItem } = item; // Remove ID temporário
                              // Adiciona Atendimento
                              const docRef = await addDoc(collection(db, 'atendimentos'), cleanItem);
                              // Adiciona Financeiro se Realizado
                              if (cleanItem.status === 'Realizado' || cleanItem.status === 'Confirmado') {
                                    await addDoc(collection(db, 'financeiro'), {
                                          data: cleanItem.data,
                                          descricao: cleanItem.tipo,
                                          pagador: cleanItem.paciente,
                                          categoria: 'Atendimento Clínico',
                                          tipo: 'Entrada',
                                          valor: parseFloat(cleanItem.valor) || 0,
                                          status: 'Recebido',
                                          atendimentoId: docRef.id
                                    });
                              }
                        }));
                        processed += chunk.length;
                  }
                  showToast(`${processed} atendimentos importados!`, 'success');
                  // Recarregar a página é o jeito mais seguro de ver tudo novo sem duplicar estado local complexo
                  setTimeout(() => window.location.reload(), 1500);
            } catch (e) {
                  console.error(e);
                  showToast("Erro na importação parcial.", 'error');
            } finally {
                  setIsSubmitting(false);
                  setShowImport(false);
            }
      };

      const exportPDF = () => { const { jsPDF } = window.jspdf; if (!jsPDF?.API?.autoTable) { showToast('Erro PDF.', 'error'); return; } const data = tab === 'proximos' ? proximos : historico; if (!data || data.length === 0) { showToast('Sem dados.', 'info'); return; } const doc = new jsPDF(); const title = tab === 'proximos' ? "Próximos" : "Histórico"; const file = tab === 'proximos' ? "proximos.pdf" : "historico.pdf"; doc.text(title, 14, 15); doc.autoTable({ startY: 20, head: [['Data', 'Paciente', 'Profissional', 'Serviço', 'Valor', 'Status']], body: data.map(a => [a.data ? new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-', a.paciente || '-', a.profissional || '-', a.tipo || '-', (Number(a.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), a.status || '-']), styles: { fontSize: 8 }, headStyles: { fillColor: [236, 72, 153] } }); doc.save(file); showToast('PDF gerado!', 'success'); };
      const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
      const proximos = useMemo(() => (atendimentos || []).filter(a => a.data >= today && a.status !== 'Realizado').sort((x, y) => new Date(x.data) - new Date(y.data)), [atendimentos, today]);
      const historico = useMemo(() => (atendimentos || []).filter(a => a.data < today || a.status === 'Realizado').sort((x, y) => new Date(y.data) - new Date(x.data)), [atendimentos, today]);
      const openNew = () => setShowNew(true);

      return (
            <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Atendimentos</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto">
                              <button onClick={exportPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button>
                              <button onClick={() => setShowImport(true)} className={`${infoButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileUp size={16} className="mr-1 sm:mr-1.5" /> Importar Planilha</button>
                              <button onClick={openNew} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Lançamento</button>
                        </div>
                  </div>
                  <div className="border-b">
                        <nav className="-mb-px flex space-x-6 sm:space-x-8">
                              {['proximos', 'historico'].map(t => (<button key={t} onClick={() => setTab(t)} className={`${tab === t ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm`} aria-current={tab === t ? 'page' : undefined}>{t === 'proximos' ? 'Próximos' : 'Histórico'}</button>))}
                        </nav>
                  </div>
                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border min-h-[300px]">
                        {tab === 'proximos' ? <AtendimentoList items={proximos} handleUpdateStatus={updateStatus} handleDeleteClick={delClick} openAgendamentoModal={openNew} /> : <AtendimentoList items={historico} handleUpdateStatus={updateStatus} handleDeleteClick={delClick} openAgendamentoModal={openNew} />}
                  </div>
                  <AgendamentoModal show={showNew} onClose={() => setShowNew(false)} servicos={servicos} onAddAtendimento={addWrapper} pacientes={pacientes} isSubmitting={isSubmitting} />
                  <ImportacaoCSVModal show={showImport} onClose={() => setShowImport(false)} onImportConfirm={handleBatchImport} isSubmitting={isSubmitting} />
                  <ConfirmationModal show={showDel} onClose={() => setShowDel(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar atendimento de "${toDelete?.paciente}"?`} />
            </div>
      );
};

// ** PacienteModalForm **
const PacienteModalForm = ({ show, onClose, onSave, paciente, isSubmitting }) => { const [formData, setFormData] = useState({ nome: '', telefone: '', dataNascimento: '' }); useEffect(() => { if (show) { setFormData(paciente ? { nome: paciente.nome || '', telefone: paciente.telefone || '', dataNascimento: paciente.dataNascimento || '' } : { nome: '', telefone: '', dataNascimento: '' }); } }, [paciente, show]); const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value })); const handleSubmit = () => { const payload = paciente ? { ...paciente, ...formData } : formData; onSave(payload).then(() => { setFormData({ nome: '', telefone: '', dataNascimento: '' }); onClose(); }).catch(err => { }); }; return (<FormModal show={show} onClose={onClose} title={paciente ? "Editar Paciente" : "Novo Paciente"} onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="nome" label="Nome Completo" value={formData.nome} onChange={handleChange} required /> <FormInput id="telefone" label="Telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" /> <FormInput id="dataNascimento" label="Data de Nascimento" type="date" value={formData.dataNascimento} onChange={handleChange} max={new Date().toISOString().split("T")[0]} /> </FormModal>); };

// ** Pacientes **
const Pacientes = ({ pacientes = [], onAddPaciente, onUpdatePaciente, onDeletePaciente, showToast }) => { const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null); const [showDel, setShowDel] = useState(false); const [toDelete, setToDelete] = useState(null); const [isSubmitting, setIsSubmitting] = useState(false); const handleEdit = (p) => { setEditing(p); setShowModal(true); }; const handleClose = () => { setEditing(null); setShowModal(false); }; const handleSave = async (data) => { setIsSubmitting(true); try { if (editing) { await onUpdatePaciente({ ...editing, ...data }); } else { await onAddPaciente(data); } return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); } }; const handleDeleteClick = (p) => { setToDelete(p); setShowDel(true); }; const confirmDelete = () => { if (toDelete) onDeletePaciente(toDelete.id); setShowDel(false); setToDelete(null); }; const exportPDF = () => { const { jsPDF } = window.jspdf; if (!jsPDF?.API?.autoTable) { showToast('Erro PDF.', 'error'); return; } if (!sorted || sorted.length === 0) { showToast('Sem dados.', 'info'); return; } const doc = new jsPDF(); doc.text("Lista de Pacientes", 14, 15); doc.autoTable({ startY: 20, head: [['Nome', 'Telefone', 'Nascimento']], body: sorted.map(p => [p.nome || '-', p.telefone || '-', p.dataNascimento ? new Date(p.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-']), styles: { fontSize: 9 }, headStyles: { fillColor: [236, 72, 153] } }); doc.save("pacientes.pdf"); showToast('PDF gerado!', 'success'); }; const openNew = () => { setEditing(null); setShowModal(true); }; const sorted = useMemo(() => [...(pacientes || [])].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), [pacientes]); return (<div className="space-y-4 sm:space-y-6"> <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Pacientes</h1> <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto"> <button onClick={exportPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button> <button onClick={openNew} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Paciente</button> </div> </div> <div className="bg-white rounded-2xl shadow-sm border overflow-hidden min-h-[300px]"> {sorted.length > 0 ? (<table className="w-full text-sm text-left"> <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"> <tr> <th className="px-6 py-3 font-semibold">Nome</th> <th className="px-6 py-3 font-semibold hidden sm:table-cell">Telefone</th> <th className="px-6 py-3 font-semibold hidden md:table-cell">Nascimento</th> <th className="px-6 py-3 font-semibold text-right">Ações</th> </tr> </thead> <tbody className="text-gray-700 divide-y"> {sorted.map((p) => (<tr key={p.id} className="hover:bg-gray-50"> <td className="px-6 py-4 font-medium">{p.nome}</td> <td className="px-6 py-4 hidden sm:table-cell">{p.telefone || '-'}</td> <td className="px-6 py-4 hidden md:table-cell">{p.dataNascimento ? new Date(p.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td> <td className="px-6 py-4 text-right whitespace-nowrap"> <button onClick={() => handleEdit(p)} className={`${iconButtonStyles} text-blue-500 hover:text-blue-700`}><FilePenLine className="inline h-5 w-5" /></button> <button onClick={() => handleDeleteClick(p)} className={`${iconButtonStyles} text-red-500 hover:text-red-700 ml-4`}><Trash2 className="inline h-5 w-5" /></button> </td> </tr>))} </tbody> </table>) : (<EmptyState icon={<Users size={32} />} title="Nenhum paciente" message="Adicione o primeiro paciente." actionButton={{ label: "Novo Paciente", onClick: openNew }} />)} </div> <PacienteModalForm show={showModal} onClose={handleClose} onSave={handleSave} paciente={editing} isSubmitting={isSubmitting} /> <ConfirmationModal show={showDel} onClose={() => setShowDel(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar paciente "${toDelete?.nome}"?`} /> </div>); };

// ** NovaTransacaoModal **
const NovaTransacaoModal = ({ show, onClose, onAddTransaction, servicos = [], pacientes = [], isSubmitting }) => { const [formData, setFormData] = useState({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: '', atendimentoId: null }); useEffect(() => { if (show) { setFormData(p => ({ ...p, status: p.tipo === 'Entrada' ? 'Recebido' : 'Pago' })); } else { setFormData({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: 'Recebido', atendimentoId: null }); } }, [show]); const handleChange = (e) => { const { name, value } = e.target; setFormData(p => { const nS = { ...p, [name]: value }; if (name === 'tipo') { nS.status = value === 'Entrada' ? 'Recebido' : 'Pago'; } return nS; }); }; const handleSubmit = () => { const v = parseFloat(String(formData.valor).replace(',', '.')) || 0; const p = { ...formData, valor: v, atendimentoId: formData.atendimentoId || null }; onAddTransaction(p, true).then(onClose).catch(err => { }); }; const sOpts = useMemo(() => (servicos || []).map(s => <option key={s.id || s.nome} value={s.nome} />), [servicos]); const pOpts = useMemo(() => [...new Set((pacientes || []).map(p => p.nome))].map(p => <option key={p} value={p} />), [pacientes]); const stOpts = useMemo(() => (formData.tipo === 'Entrada' ? ['Recebido', 'A Receber'] : ['Pago', 'A Pagar']), [formData.tipo]); return (<FormModal show={show} onClose={onClose} title="Nova Transação" onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="data" label="Data" type="date" value={formData.data} onChange={handleChange} required /> <FormInput id="descricao" label="Descrição" value={formData.descricao} onChange={handleChange} list="servicos-fin-sug" placeholder="Serviço ou motivo" required /> <datalist id="servicos-fin-sug">{sOpts}</datalist> <FormInput id="pagador" label="Cliente/Origem" value={formData.pagador} onChange={handleChange} list="pacientes-fin-sug" placeholder="Nome" required /> <datalist id="pacientes-fin-sug">{pOpts}</datalist> <FormInput id="categoria" label="Categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Consulta, Despesa" required /> <div className="grid grid-cols-2 gap-4"> <FormSelect id="tipo" label="Tipo" value={formData.tipo} onChange={handleChange}><option>Entrada</option><option>Saída</option></FormSelect> <FormInput id="valor" label="Valor (R$)" value={formData.valor} onChange={handleChange} inputMode="decimal" placeholder="0,00" required /> </div> <FormSelect id="status" label="Status" value={formData.status} onChange={handleChange}>{stOpts.map(s => <option key={s} value={s}>{s}</option>)}</FormSelect> </FormModal>); };

// ** Financeiro **
const Financeiro = ({ financeiro = [], onUpdateTransaction, onDeleteTransaction, servicos = [], onAddTransaction, showToast, pacientes = [] }) => { const [search, setSearch] = useState(''); const [showModal, setShowModal] = useState(false); const [showDel, setShowDel] = useState(false); const [toDelete, setToDelete] = useState(null); const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); const [showFilters, setShowFilters] = useState(false); const handleAdd = async (data, alert) => { setIsSubmitting(true); try { await onAddTransaction(data, alert); return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); } }; const handleDeleteClick = (i) => { setToDelete(i); setShowDel(true); }; const confirmDelete = () => { if (toDelete) onDeleteTransaction(toDelete.id); setShowDel(false); setToDelete(null); }; const handleUpdateStatus = async (id) => { const i = (financeiro || []).find(x => x.id === id); if (!i) return; let ns = i.status; if (i.status === 'A Receber') ns = 'Recebido'; else if (i.status === 'A Pagar') ns = 'Pago'; if (ns === i.status) return; try { await onUpdateTransaction({ id: i.id, status: ns }); } catch (e) { } }; const filtered = useMemo(() => { const s = [...(financeiro || [])].sort((a, b) => new Date(b.data) - new Date(a.data)); return s.filter(f => { const t = search.toLowerCase(); const txt = !t || f.descricao?.toLowerCase().includes(t) || f.categoria?.toLowerCase().includes(t) || f.pagador?.toLowerCase().includes(t); const date = (!start || f.data >= start) && (!end || f.data <= end); return txt && date; }); }, [financeiro, search, start, end]); const clearFilters = () => { setSearch(''); setStart(''); setEnd(''); }; const formatForCSV = (v) => { if (v == null) return ''; let s = String(v); if (s.includes(',') || s.includes(';') || s.includes('"')) { s = '"' + s.replace(/"/g, '""') + '"'; } return s; }; const exportCSV = () => { if (!filtered || filtered.length === 0) { showToast('Sem dados.', 'info'); return; } const headers = ['Data', 'Descrição', 'Cliente/Origem', 'Categoria', 'Tipo', 'Valor', 'Status']; const rows = filtered.map(tr => [tr.data ? new Date(tr.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-', tr.descricao || '-', tr.pagador || '-', tr.categoria || '-', tr.tipo || '-', (Number(tr.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ''), tr.status || '-'].map(formatForCSV)); let csv = "data:text/csv;charset=utf-8,\uFEFF"; csv += headers.join(';') + "\r\n"; rows.forEach(r => csv += r.join(';') + "\r\n"); const link = document.createElement("a"); link.setAttribute("href", encodeURI(csv)); link.setAttribute("download", "financeiro.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast('CSV gerado!', 'success'); }; const exportPDF = () => { const { jsPDF } = window.jspdf; if (!jsPDF?.API?.autoTable) { showToast('Erro PDF.', 'error'); return; } if (!filtered || filtered.length === 0) { showToast('Sem dados.', 'info'); return; } const doc = new jsPDF(); doc.text("Relatório Financeiro", 14, 15); doc.autoTable({ startY: 20, head: [['Data', 'Descrição', 'Cliente/Origem', 'Categoria', 'Tipo', 'Valor', 'Status']], body: filtered.map(tr => [tr.data ? new Date(tr.data + 'T00:00:00').toLocaleDateString('pt-BR') : '-', tr.descricao || '-', tr.pagador || '-', tr.categoria || '-', tr.tipo || '-', (Number(tr.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), tr.status || '-']), styles: { fontSize: 8 }, headStyles: { fillColor: [236, 72, 153] } }); doc.save("financeiro.pdf"); showToast('PDF gerado!', 'success'); }; const openNew = () => setShowModal(true); const toggleFilters = () => setShowFilters(p => !p); const totals = useMemo(() => { let e = 0, s = 0; filtered.forEach(t => { const v = Number(t.valor) || 0; if (t.tipo === 'Entrada' && t.status === 'Recebido') e += v; if (t.tipo === 'Saída' && t.status === 'Pago') s += v; }); return { entradas: e, saidas: s, saldo: e - s }; }, [filtered]); const formatCurrency = (v) => (typeof v !== 'number' || isNaN(v) ? 0 : v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); return (<div className="space-y-4 sm:space-y-6"> <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Financeiro</h1> <div className="flex flex-row items-center flex-wrap gap-2 sm:gap-3 justify-center sm:justify-end w-full lg:w-auto"> <button onClick={toggleFilters} className={`${secondaryButtonStyles} px-3 py-1.5 text-xs sm:hidden`}>{showFilters ? <X size={16} className="mr-1" /> : <Filter size={16} className="mr-1" />} Filtros</button> <button onClick={exportPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button> <button onClick={exportCSV} className={`${infoButtonStyles} hidden sm:inline-flex px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><Download size={16} className="mr-1 sm:mr-1.5" /> CSV</button> <button onClick={openNew} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Nova Transação</button> </div> </div> <div className={`bg-white p-4 sm:p-6 rounded-2xl shadow-sm border ${showFilters ? 'block' : 'hidden'} sm:block`}> <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"> <div className="md:col-span-2"><FormInput id="search-fin" label="Pesquisar" placeholder="Descrição, categoria, cliente..." value={search} onChange={(e) => setSearch(e.target.value)} /></div> <FormInput id="startDate-fin" label="De" type="date" value={start} onChange={e => setStart(e.target.value)} /> <FormInput id="endDate-fin" label="Até" type="date" value={end} onChange={e => setEnd(e.target.value)} /> <div className="md:col-span-4 flex justify-end"><button onClick={clearFilters} className={`${secondaryButtonStyles} mt-2 md:mt-0 w-full md:w-auto text-sm py-2`}>Limpar</button></div> </div> </div> <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 bg-white p-4 rounded-2xl shadow-sm border"> <div><p className="text-xs font-medium text-gray-500">Entradas Recebidas</p><p className="text-lg font-bold text-green-600">{formatCurrency(totals.entradas)}</p></div> <div><p className="text-xs font-medium text-gray-500">Saídas Pagas</p><p className="text-lg font-bold text-red-600">{formatCurrency(totals.saidas)}</p></div> <div><p className="text-xs font-medium text-gray-500">Saldo no Período</p><p className={`text-lg font-bold ${totals.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(totals.saldo)}</p></div> </div> <div className="bg-white rounded-2xl shadow-sm border overflow-hidden min-h-[300px]"> {filtered.length > 0 ? (<> <div className="sm:hidden divide-y">{filtered.map((tr) => { const c = tr.status === 'A Receber' || tr.status === 'A Pagar'; return (<div key={tr.id} className="p-4 space-y-1.5 hover:bg-gray-50"><div className="flex justify-between items-start gap-2"><span className="font-semibold text-gray-800 text-sm flex-grow truncate mr-2">{tr.descricao}</span><span className={`flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200'} ${c ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={() => c && handleUpdateStatus(tr.id)}>{tr.status}</span></div><div className="flex justify-between items-center text-sm"><span className={`font-bold text-base ${tr.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(tr.valor)}</span><span className="text-gray-500 text-xs">{new Date(tr.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div><div className="text-xs text-gray-500 flex flex-wrap gap-x-4 pt-1">{tr.pagador && <span>Origem: <span className="text-gray-600">{tr.pagador}</span></span>} {tr.categoria && <span>Cat: <span className="text-gray-600">{tr.categoria}</span></span>}</div><div className="flex justify-end pt-1"><button onClick={() => handleDeleteClick(tr)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-4 w-4" /></button></div></div>); })}</div> <div className="overflow-x-auto hidden sm:block"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Data</th><th className="px-6 py-3 font-semibold">Descrição</th><th className="px-6 py-3 font-semibold hidden md:table-cell">Cliente/Origem</th><th className="px-6 py-3 font-semibold hidden md:table-cell">Categoria</th><th className="px-6 py-3 font-semibold hidden sm:table-cell">Tipo</th><th className="px-6 py-3 font-semibold">Valor</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{filtered.map((tr) => { const c = tr.status === 'A Receber' || tr.status === 'A Pagar'; return (<tr key={tr.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap">{new Date(tr.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td className="px-6 py-4 font-medium text-gray-800">{tr.descricao}</td><td className="px-6 py-4 hidden md:table-cell">{tr.pagador}</td><td className="px-6 py-4 hidden md:table-cell">{tr.categoria}</td><td className="px-6 py-4 hidden sm:table-cell"><span className={`px-3 py-1 text-xs font-bold rounded-full ${tr.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{tr.tipo}</span></td><td className="px-6 py-4 font-bold whitespace-nowrap">{formatCurrency(tr.valor)}</td><td className="px-6 py-4 whitespace-nowrap"><span onClick={() => c && handleUpdateStatus(tr.id)} className={`px-3 py-1 text-xs font-semibold rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200'} ${c ? 'cursor-pointer hover:scale-105 hover:opacity-80' : ''}`}>{tr.status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteClick(tr)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-5 w-5" /></button></td></tr>); })}</tbody></table></div></>) : (<EmptyState icon={<Wallet size={32} />} title="Nenhuma transação" message="Crie uma nova ou ajuste os filtros." actionButton={{ label: "Nova Transação", onClick: openNew }} />)} </div> <NovaTransacaoModal show={showModal} onClose={() => setShowModal(false)} onAddTransaction={handleAdd} servicos={servicos} pacientes={pacientes} isSubmitting={isSubmitting} /> <ConfirmationModal show={showDel} onClose={() => setShowDel(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar transação "${toDelete?.descricao}"?`} /> </div>); };

// ** NovoEstoqueModal **
const NovoEstoqueModal = ({ show, onClose, onAddItem, isSubmitting }) => { const [formData, setFormData] = useState({ item: '', categoria: '', consumoMedio: '', atual: '' }); useEffect(() => { if (!show) setFormData({ item: '', categoria: '', consumoMedio: '', atual: '' }); }, [show]); const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value })); const handleSubmit = () => { const c = parseInt(formData.consumoMedio, 10); const a = parseInt(formData.atual, 10); if (isNaN(c) || c < 0 || isNaN(a) || a < 0) { return; } onAddItem({ ...formData, consumoMedio: c, atual: a }).then(onClose).catch(err => { }); }; return (<FormModal show={show} onClose={onClose} title="Novo Item de Estoque" onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="item" label="Nome do Item" value={formData.item} onChange={handleChange} required /> <FormInput id="categoria" label="Categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Material Escritório, Limpeza" required /> <div className="grid grid-cols-2 gap-4"><FormInput id="consumoMedio" label="Consumo Médio (Mensal)" type="number" value={formData.consumoMedio} onChange={handleChange} required inputMode="numeric" min="0" /> <FormInput id="atual" label="Estoque Atual" type="number" value={formData.atual} onChange={handleChange} required inputMode="numeric" min="0" /></div> </FormModal>); };

// ** Estoque **
const Estoque = ({ estoque = [], onUpdateItem, onAddItem, onDeleteItem, showToast }) => { const [editing, setEditing] = useState(null); const [editV, setEditV] = useState(''); const [search, setSearch] = useState(''); const [showNew, setShowNew] = useState(false); const [showDel, setShowDel] = useState(false); const [toDelete, setToDelete] = useState(null); const [isSubmitting, setIsSubmitting] = useState(false); const handleAdd = async (item) => { setIsSubmitting(true); try { await onAddItem(item); return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubmitting(false); } }; const handleDeleteClick = (i) => { setToDelete(i); setShowDel(true); }; const confirmDelete = () => { if (toDelete) onDeleteItem(toDelete.id); setShowDel(false); setToDelete(null); }; const handleEdit = (i, f) => { setEditing({ item: i, field: f }); setEditV(String(i[f] ?? '')); }; const handleInlineChange = (e) => setEditV(e.target.value); const handleSave = async () => { if (!editing) return; const { item, field } = editing; const vS = editV.trim(); const vN = parseInt(vS, 10); if (vS === '' || isNaN(vN) || vN < 0) { showToast('Valor inválido.', 'error'); setEditing(null); return; } if (vN === item[field]) { setEditing(null); return; } try { await onUpdateItem({ id: item.id, [field]: vN }); } catch (e) { } finally { setEditing(null); } }; const handleKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } else if (e.key === 'Escape') { setEditing(null); } }; const filtered = useMemo(() => { const f = (estoque || []).filter(i => i.item?.toLowerCase().includes(search.toLowerCase()) || i.categoria?.toLowerCase().includes(search.toLowerCase())); return f.sort((a, b) => (a.item || "").localeCompare(b.item || "")); }, [estoque, search]); const exportPDF = () => { const { jsPDF } = window.jspdf; if (!jsPDF?.API?.autoTable) { showToast('Erro PDF.', 'error'); return; } if (!filtered || filtered.length === 0) { showToast('Sem dados.', 'info'); return; } const doc = new jsPDF(); doc.text("Relatório de Estoque", 14, 15); doc.autoTable({ startY: 20, head: [['Item', 'Categoria', 'Cons. Médio', 'Atual', 'Mínimo', 'Status']], body: filtered.map(i => { const c = Number(i.consumoMedio) || 0; const a = Number(i.atual) || 0; const m = Math.ceil(c * 0.3); const s = c > 0 && a <= m ? 'COMPRAR' : 'OK'; return [i.item || '-', i.categoria || '-', c, a, m > 0 ? m : '-', s]; }), styles: { fontSize: 9 }, headStyles: { fillColor: [236, 72, 153] } }); doc.save("estoque.pdf"); showToast('PDF gerado!', 'success'); }; const openNew = () => setShowNew(true); return (<div className="space-y-4 sm:space-y-6"> <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Estoque</h1> <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 justify-center sm:justify-end w-full lg:w-auto"> <button onClick={exportPDF} className={`${destructiveButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}><FileText size={16} className="mr-1 sm:mr-1.5" /> PDF</button> <div className="relative flex-grow w-full sm:w-auto"><input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 sm:py-2.5 border rounded-lg w-full focus:ring-pink-400" /><Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /></div> <button onClick={openNew} className={`${primaryButtonStyles} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`}>Novo Item</button> </div> </div> <div className="bg-white rounded-2xl shadow-sm border overflow-hidden min-h-[300px]"> {filtered.length > 0 ? (<> <div className="sm:hidden grid grid-cols-1 gap-3 p-4">{filtered.map((i) => { const c = Number(i.consumoMedio) || 0; const a = Number(i.atual) || 0; const m = Math.ceil(c * 0.3); const s = c > 0 && a <= m ? 'COMPRAR' : 'OK'; const isEA = editing?.item.id === i.id && editing?.field === 'atual'; const isEC = editing?.item.id === i.id && editing?.field === 'consumoMedio'; return (<div key={i.id} className="p-4 bg-white border rounded-xl shadow-sm space-y-2 hover:bg-gray-50"><div className="flex justify-between items-start gap-2"><span className="font-semibold text-gray-800 text-sm flex items-center"><Box size={14} className="mr-1.5 text-gray-400" />{i.item}</span><span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${s === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s}</span></div><div className="text-xs text-gray-500 pl-5">Cat: <span className="text-gray-600">{i.categoria}</span></div><div className="flex justify-between items-center text-sm pt-2 border-t mt-2"><div onClick={() => !isEC && handleEdit(i, 'consumoMedio')} className="cursor-pointer p-1 -m-1 rounded hover:bg-gray-100"><span className="text-xs text-gray-500">Cons. Médio: </span>{isEC ? (<input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-16 p-1 border rounded text-sm" autoFocus min="0" />) : (<span className="font-medium text-gray-700">{c}</span>)}</div><div onClick={() => !isEA && handleEdit(i, 'atual')} className="cursor-pointer p-1 -m-1 rounded hover:bg-gray-100"><span className="text-xs text-gray-500">Atual: </span>{isEA ? (<input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-16 p-1 border rounded text-sm" autoFocus min="0" />) : (<span className={`font-bold ${s === 'COMPRAR' ? 'text-red-600' : 'text-gray-800'}`}>{a}</span>)}</div></div><div className="flex justify-end pt-1"><button onClick={() => handleDeleteClick(i)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-4 w-4" /></button></div></div>); })}</div> <div className="overflow-x-auto hidden sm:block"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Item</th><th className="px-6 py-3 font-semibold">Categoria</th><th className="px-6 py-3 font-semibold hidden sm:table-cell">Cons. Médio</th><th className="px-6 py-3 font-semibold">Atual</th><th className="px-6 py-3 font-semibold hidden md:table-cell">Mínimo (30%)</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{filtered.map((i) => { const c = Number(i.consumoMedio) || 0; const a = Number(i.atual) || 0; const m = Math.ceil(c * 0.3); const s = c > 0 && a <= m ? 'COMPRAR' : 'OK'; const isEA = editing?.item.id === i.id && editing?.field === 'atual'; const isEC = editing?.item.id === i.id && editing?.field === 'consumoMedio'; return (<tr key={i.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium text-gray-800">{i.item}</td><td className="px-6 py-4">{i.categoria}</td><td className="px-6 py-4 font-medium hidden sm:table-cell" onClick={() => !isEC && handleEdit(i, 'consumoMedio')}>{isEC ? <input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-20 p-1 border rounded" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-100 p-1 rounded-md">{c}</span>}</td><td className="px-6 py-4 font-medium" onClick={() => !isEA && handleEdit(i, 'atual')}>{isEA ? <input type="number" value={editV} onChange={handleInlineChange} onBlur={handleSave} onKeyDown={handleKeyDown} className="w-20 p-1 border rounded" autoFocus min="0" /> : <span className="cursor-pointer hover:bg-gray-100 p-1 rounded-md">{a}</span>}</td><td className="px-6 py-4 hidden md:table-cell text-gray-500">{m > 0 ? m : '-'}</td><td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${s === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s}</span></td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteClick(i)} className={`${iconButtonStyles} text-gray-400 hover:text-red-500`}><Trash2 className="h-5 w-5" /></button></td></tr>); })}</tbody></table></div></>) : (<EmptyState icon={<Box size={32} />} title="Nenhum item no estoque" message="Adicione itens para controlar." actionButton={{ label: "Novo Item", onClick: openNew }} />)} </div> <NovoEstoqueModal show={showNew} onClose={() => setShowNew(false)} onAddItem={handleAdd} isSubmitting={isSubmitting} /> <ConfirmationModal show={showDel} onClose={() => setShowDel(false)} onConfirm={confirmDelete} title="Confirmar Exclusão" message={`Apagar "${toDelete?.item}"?`} /> </div>); };

// ** NovaRegraRepasseModal **
const NovaRegraRepasseModal = ({ show, onClose, onAddRepasse, servicosDisponivis = [], isSubmitting }) => { const [formData, setFormData] = useState({ servico: '', tipo: 'Percentual', valor: '' }); useEffect(() => { if (!show) setFormData({ servico: '', tipo: 'Percentual', valor: '' }); }, [show]); const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value })); const handleSubmit = () => { if (!formData.valor || formData.valor.trim() === '') { return; } onAddRepasse({ ...formData }).then(onClose).catch(err => { }); }; const sOpts = useMemo(() => (servicosDisponivis || []).map(s => <option key={s.id || s.nome} value={s.nome} />), [servicosDisponivis]); return (<FormModal show={show} onClose={onClose} title="Nova Regra de Repasse" onSubmit={handleSubmit} isSubmitting={isSubmitting}> <FormInput id="servico" label="Serviço" value={formData.servico} onChange={handleChange} list="serv-disp-sug" placeholder="Nome do serviço" required /> <datalist id="serv-disp-sug">{sOpts}</datalist> <div className="grid grid-cols-2 gap-4"><FormSelect id="tipo" label="Tipo (Comissão)" value={formData.tipo} onChange={handleChange}><option value="Percentual">Percentual</option><option value="Fixo">Fixo</option></FormSelect><FormInput id="valor" label="Valor" value={formData.valor} onChange={handleChange} placeholder={formData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: 50,00'} required /></div> </FormModal>); };

// ** Configuracoes **
const Configuracoes = ({ servicos = [], onUpdateServico, repasses = [], onUpdateRepasse, onAddRepasse, onDeleteRepasse, onAddServico, onDeleteServico, showToast }) => { const [editing, setEditing] = useState(null); const [editData, setEditData] = useState({}); const [showNewRule, setShowNewRule] = useState(false); const [showDelRule, setShowDelRule] = useState(false); const [toDeleteRule, setToDeleteRule] = useState(null); const [newService, setNewService] = useState(''); const [isSubSvc, setIsSubSvc] = useState(false); const [isSubRuleModal, setIsSubRuleModal] = useState(false); const [isSubRuleInline, setIsSubRuleInline] = useState(false); const handleAddSvc = async (e) => { e.preventDefault(); if (newService.trim() === '') return; setIsSubSvc(true); try { await onAddServico({ nome: newService }); setNewService(''); } catch (e) { } finally { setIsSubSvc(false); } }; const handleAddRule = async (data) => { setIsSubRuleModal(true); try { await onAddRepasse(data); return Promise.resolve(); } catch (e) { return Promise.reject(e); } finally { setIsSubRuleModal(false); } }; const handleDeleteRuleClick = (i) => { setToDeleteRule(i); setShowDelRule(true); }; const confirmDeleteRule = () => { if (toDeleteRule) onDeleteRepasse(toDeleteRule.id); setShowDelRule(false); setToDeleteRule(null); }; const handleEditRule = (idx) => { setEditing(idx); setEditData({ ...(repasses[idx] || {}) }); }; const handleCancelEditRule = () => { setEditing(null); setEditData({}); }; const handleEditRuleChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value }); const handleSaveRule = async (idx) => { const item = repasses[idx]; const p = { id: item.id, ...editData }; if (!p.valor || String(p.valor).trim() === '') { showToast('Valor vazio.', 'error'); return; } setIsSubRuleInline(true); try { await onUpdateRepasse(p); } catch (e) { } finally { setEditing(null); setEditData({}); setIsSubRuleInline(false); } }; const ruleServices = useMemo(() => new Set((repasses || []).map(r => r.servico)), [repasses]); const availableServices = useMemo(() => (servicos || []).filter(s => !ruleServices.has(s.nome)), [servicos, ruleServices]); const openNewRule = () => setShowNewRule(true); const sortedSvcs = useMemo(() => [...(servicos || [])].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), [servicos]); const sortedRules = useMemo(() => [...(repasses || [])].sort((a, b) => (a.servico || "").localeCompare(b.servico || "")), [repasses]); return (<div className="space-y-6 sm:space-y-8"> <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 hidden lg:block">Configurações</h1> {/* Serviços */} <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border"> <h3 className="text-xl font-semibold text-gray-700 mb-5">Gestão de Serviços</h3> <form onSubmit={handleAddSvc} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"> <div className="flex-grow"><FormInput id="novo-servico" value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="Nome do novo serviço" required /></div> <button type="submit" className={`${primaryButtonStyles} w-full sm:w-auto py-2.5 text-sm`} disabled={isSubSvc}>{isSubSvc && <Loader2 className="animate-spin h-5 w-5 mr-1.5" />} Adicionar</button> </form> <div className="overflow-x-auto min-h-[150px]">{sortedSvcs.length > 0 ? (<table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Serviço</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{sortedSvcs.map((s) => (<tr key={s.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{s.nome}</td><td className="px-6 py-4 text-right"><button onClick={() => onDeleteServico(s.id)} className={`${iconButtonStyles} text-red-500 hover:text-red-700`}><Trash2 className="inline h-5 w-5" /></button></td></tr>))}</tbody></table>) : (<div className="pt-4"><EmptyState icon={<FilePlus size={32} />} title="Nenhum serviço" message="Adicione serviços." /></div>)}</div> </div> {/* Repasses */} <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border"> <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-4"> <h3 className="text-xl font-semibold text-gray-700">Regras de Repasse (Comissão)</h3> <button onClick={openNewRule} className={`${primaryButtonStyles} py-2 text-sm`}>Nova Regra</button> </div> <div className="overflow-x-auto min-h-[150px]">{sortedRules.length > 0 ? (<table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3 font-semibold">Serviço</th><th className="px-6 py-3 font-semibold">Tipo</th><th className="px-6 py-3 font-semibold">Valor</th><th className="px-6 py-3 font-semibold text-right">Ações</th></tr></thead><tbody className="text-gray-700 divide-y">{sortedRules.map((r, idx) => (<tr key={r.id} className={`hover:bg-gray-50 ${isSubRuleInline && editing === idx ? 'opacity-50' : ''}`}><td className="px-6 py-4 font-medium">{r.servico}</td>{editing === idx ? (<> <td className="px-6 py-4"><select name="tipo" value={editData.tipo} onChange={handleEditRuleChange} className="w-full p-1.5 border rounded" disabled={isSubRuleInline}><option value="Percentual">Percentual</option><option value="Fixo">Fixo</option></select></td> <td className="px-6 py-4"><input name="valor" type="text" value={editData.valor} onChange={handleEditRuleChange} placeholder={editData.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: 50,00'} className="w-full p-1.5 border rounded" disabled={isSubRuleInline} /></td> <td className="px-6 py-4 text-right whitespace-nowrap"><button onClick={() => handleSaveRule(idx)} className={`${iconButtonStyles} text-green-600 hover:text-green-700`} disabled={isSubRuleInline}>{isSubRuleInline ? <Loader2 className="animate-spin h-5 w-5" /> : <Check size={20} />}</button><button onClick={handleCancelEditRule} className={`${iconButtonStyles} text-gray-500 hover:text-gray-700 ml-2`} disabled={isSubRuleInline}><X size={20} /></button></td> </>) : (<> <td className="px-6 py-4">{r.tipo}</td><td className="px-6 py-4 font-bold">{r.valor}</td><td className="px-6 py-4 text-right whitespace-nowrap"><button onClick={() => handleEditRule(idx)} className={`${iconButtonStyles} text-blue-500 hover:text-blue-700`}><FilePenLine className="inline h-5 w-5" /></button><button onClick={() => handleDeleteRuleClick(r)} className={`${iconButtonStyles} text-red-500 hover:text-red-700 ml-4`}><Trash2 className="inline h-5 w-5" /></button></td> </>)}</tr>))}</tbody></table>) : (<div className="pt-4"><EmptyState icon={<FilePlus size={32} />} title="Nenhuma regra" message="Adicione regras de comissão." actionButton={{ label: "Nova Regra", onClick: openNewRule }} /></div>)}</div> </div> {/* Modais */} <NovaRegraRepasseModal show={showNewRule} onClose={() => setShowNewRule(false)} onAddRepasse={handleAddRule} servicosDisponivis={availableServices} isSubmitting={isSubRuleModal} /> <ConfirmationModal show={showDelRule} onClose={() => setShowDelRule(false)} onConfirm={confirmDeleteRule} title="Confirmar Exclusão" message={`Apagar regra para "${toDeleteRule?.servico}"?`} /> </div>); };


// --- Componente Principal App ---
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

      // --- Funções Firestore CRUD ---
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
      const handleAddAtendimento = (i) => atendimentoOps.add(i, null); // Null pois controlamos toast no wrapper
      const handleAddTransaction = (i, a) => financeiroOps.add(i, a ? 'Transação adicionada!' : null); const handleAddItem = (i) => estoqueOps.add(i, 'Item adicionado!'); const handleAddRepasse = (i) => repasseOps.add(i, 'Regra adicionada!'); const handleAddServico = (i) => servicoOps.add(i, 'Serviço adicionado!'); const handleAddPaciente = (i) => pacienteOps.add(i, 'Paciente adicionado!');
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
      };

      // Efeito Tema
      useEffect(() => { document.documentElement.classList.remove('dark'); localStorage.removeItem('theme'); }, []);

      // Efeito Auth
      useEffect(() => {
            console.log("Auth listener setup."); setLoading(true);
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                  console.log("Auth state changed:", currentUser?.uid);
                  setUser(currentUser);
                  if (currentUser) {
                        console.log("User logged in. Fetching data...");
                        await fetchData();
                        setLoading(false);
                  } else {
                        console.log("User logged out.");
                        setAtendimentos(null); setFinanceiro(null); setEstoque(null); setServicos(null); setRepasses(null); setPacientes(null); setLoading(false);
                  }
            });
            return () => { console.log("Auth listener cleanup."); unsubscribe(); };
      }, []);

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
                  <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                        <Header onMenuClick={() => setIsSidebarOpen(true)} title={pageTitles[currentPage] || "Clínica"} />
                        <div className="flex-grow p-4 md:p-6 lg:p-8">
                              {renderPage()}
                        </div>
                  </main>
            </div>
      );
}