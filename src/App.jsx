import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
import {
  LayoutGrid, Calendar as CalendarIcon, Wallet, Box, Settings, X, Menu,
  TrendingUp, ArrowLeftRight, CreditCard, DollarSign,
  AlertTriangle, CheckCircle2, Search, Trash2, FilePenLine, Info, Check, AlertCircle, LogOut, Download, Users
} from 'lucide-react';

// Register Chart.js components
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


// --- Componentes ---

const LoginPage = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pink-500">AMELDY</h1>
          <p className="mt-2 text-gray-500">Bem-vindo(a) de volta!</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const toastStyles = {
    success: { bg: 'bg-green-500', icon: <Check size={20} /> },
    error: { bg: 'bg-red-500', icon: <AlertCircle size={20} /> },
    info: { bg: 'bg-blue-500', icon: <Info size={20} /> },
  };

  return (
    <div className={`flex items-center text-white p-4 rounded-lg shadow-lg animate-fade-in-up ${toastStyles[type].bg}`}>
      <div className="mr-3">{toastStyles[type].icon}</div>
      <p>{message}</p>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-5 right-5 z-50 space-y-2 w-full max-w-xs sm:max-w-sm">
    {toasts.map(toast => (
      <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);


const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-5 w-5 mr-3" /> },
    { id: 'atendimentos', label: 'Atendimentos', icon: <CalendarIcon className="h-5 w-5 mr-3" /> },
    { id: 'pacientes', label: 'Pacientes', icon: <Users className="h-5 w-5 mr-3" /> },
    { id: 'financeiro', label: 'Financeiro', icon: <Wallet className="h-5 w-5 mr-3" /> },
    { id: 'estoque', label: 'Estoque', icon: <Box className="h-5 w-5 mr-3" /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  const linkClasses = (id) => `flex items-center px-4 py-3 text-gray-600 font-semibold rounded-xl transition-all duration-300 ${currentPage === id ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100'}`;

  const sidebarClasses = `fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  const handleLinkClick = (pageId) => {
    setCurrentPage(pageId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }

  return (
    <aside className={sidebarClasses}>
      <div className="h-20 flex items-center justify-between px-4 border-b border-gray-100">
        <h1 className="text-3xl font-bold text-pink-500">AMELDY</h1>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 lg:hidden">
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          <a href="#" key={item.id} className={linkClasses(item.id)} onClick={(e) => { e.preventDefault(); handleLinkClick(item.id); }}>
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={onLogout} className="flex w-full items-center justify-center px-4 py-3 text-red-500 font-semibold rounded-xl transition-all duration-300 hover:bg-red-100">
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </button>
      </div>
    </aside>
  );
};

const Header = ({ onMenuClick, title }) => (
  <header className="lg:hidden bg-white/70 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between h-20 px-4 sm:px-6 border-b border-gray-100">
    <button onClick={onMenuClick} className="text-gray-600">
      <Menu className="h-6 w-6" />
    </button>
    <h1 className="text-xl font-bold text-pink-500">{title}</h1>
    <div className="w-6"></div>
  </header>
);

const AtendimentosChart = ({ atendimentos }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && atendimentos) {
      const ctx = chartRef.current.getContext('2d');
      const atendimentosPorSetor = atendimentos.reduce((acc, curr) => {
        acc[curr.setor] = (acc[curr.setor] || 0) + 1;
        return acc;
      }, {});

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(atendimentosPorSetor),
          datasets: [{
            label: 'Atendimentos por Setor',
            data: Object.values(atendimentosPorSetor),
            backgroundColor: ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899'],
            borderColor: '#fff',
            borderWidth: 4,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20
              }
            }
          }
        }
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [atendimentos]);

  return (
    <div className="relative w-full h-64 sm:h-80">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

const DailyRevenueChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data) {
      const ctx = chartRef.current.getContext('2d');

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Faturamento Diário',
            data: data.values,
            backgroundColor: '#f9a8d4',
            borderColor: '#f472b6',
            borderWidth: 1,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return 'R$ ' + value;
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="relative w-full h-64 sm:h-80">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};


const StatCard = ({ icon, title, value, subtitle, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 flex items-center space-x-5 transition-all duration-300 hover:scale-105 hover:shadow-xl">
    <div className={`rounded-full p-4 ${colorClass.bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${colorClass.text}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const Dashboard = ({ estoque, atendimentos, financeiro, repasses }) => {
  const today = new Date();
  const dateString = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const formatCurrency = (value) => {
    if (typeof value !== 'number') {
      value = 0;
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calculateTotals = () => {
    let faturamentoBruto = 0;
    let despesaPaga = 0;
    let repassesRecebidos = 0;

    financeiro.forEach(transaction => {
      if (transaction.tipo === 'Entrada' && transaction.status === 'Recebido') {
        faturamentoBruto += transaction.valor;

        const regra = repasses.find(r => r.servico === transaction.descricao);
        if (regra) {
          if (regra.tipo === 'Percentual') {
            const percentualClinica = parseFloat(regra.valor) / 100;
            repassesRecebidos += transaction.valor * percentualClinica;
          } else if (regra.tipo === 'Fixo') {
            repassesRecebidos += parseFloat(String(regra.valor).replace(/[^0-9,-]+/g, "").replace(",", "."));
          }
        }
      }
      if (transaction.tipo === 'Saída' && transaction.status === 'Pago') {
        despesaPaga += transaction.valor;
      }
    });

    const saldoEmCaixa = faturamentoBruto - despesaPaga;

    return { faturamentoBruto, despesaPaga, repassesRecebidos, saldoEmCaixa };
  };

  const getDailyRevenueData = () => {
    const labels = [];
    const values = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().slice(0, 10);

      labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

      const dailyRevenue = financeiro
        .filter(t => t.data === dateString && t.tipo === 'Entrada' && t.status === 'Recebido')
        .reduce((sum, t) => sum + t.valor, 0);

      values.push(dailyRevenue);
    }
    return { labels, values };
  };

  const totals = calculateTotals();
  const dailyRevenueData = getDailyRevenueData();

  const itensParaComprar = estoque.filter(item => {
    const minimo = Math.ceil(item.consumoMedio * 0.3);
    return item.atual <= minimo;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Olá, Bem-vindo(a)!</h1>
        <p className="text-gray-500">{dateString}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 mb-8">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(totals.faturamentoBruto)}
          subtitle="Total de entradas recebidas"
          icon={<TrendingUp className="h-7 w-7 text-blue-600" />}
          colorClass={{ bg: "bg-blue-100", text: "text-blue-600" }}
        />
        <StatCard
          title="Repasses Recebidos"
          value={formatCurrency(totals.repassesRecebidos)}
          subtitle="Comissão dos profissionais parceiros"
          icon={<ArrowLeftRight className="h-7 w-7 text-orange-600" />}
          colorClass={{ bg: "bg-orange-100", text: "text-orange-600" }}
        />
        <StatCard
          title="Despesa Paga"
          value={formatCurrency(totals.despesaPaga)}
          icon={<CreditCard className="h-7 w-7 text-red-600" />}
          colorClass={{ bg: "bg-red-100", text: "text-red-600" }}
        />
        <StatCard
          title="Saldo em Caixa"
          value={formatCurrency(totals.saldoEmCaixa)}
          subtitle="Entradas - Saídas"
          icon={<DollarSign className="h-7 w-7 text-green-600" />}
          colorClass={{ bg: "bg-green-100", text: "text-green-600" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-lg shadow-gray-200/50">
          <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-amber-500" />
            Avisos de Estoque
          </h3>
          {itensParaComprar.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-700 mb-3">Os seguintes itens precisam de reposição:</p>
              <ul className="space-y-2">
                {itensParaComprar.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm p-3 rounded-lg bg-white hover:shadow-md transition-shadow">
                    <span className="text-gray-700 font-semibold">{item.item}</span>
                    <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">{item.atual} unid.</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-400" />
              <p className="text-sm text-gray-500 mt-2 font-medium">Estoque em dia!</p>
              <p className="text-xs text-gray-400">Nenhum item com estoque baixo.</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Faturamento nos Últimos 7 Dias</h3>
          <DailyRevenueChart data={dailyRevenueData} />
        </div>
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Atendimentos por Setor</h3>
          <AtendimentosChart atendimentos={atendimentos} />
        </div>
      </div>
    </div>
  )
};

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-bold">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-600 mb-8">{message}</p>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition-all">Cancelar</button>
          <button type="button" onClick={onConfirm} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-lg transition-all">Apagar</button>
        </div>
      </div>
    </div>
  );
};

const AgendamentoModal = ({ show, onClose, servicos, onAddAtendimento, pacientes }) => {
  const [formData, setFormData] = useState({
    paciente: '',
    profissional: 'Enf.ª Andreia',
    servico: '',
    valor: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newAtendimento = {
      data: new Date().toISOString().slice(0, 10),
      paciente: formData.paciente,
      profissional: formData.profissional,
      tipo: formData.servico,
      valor: formData.valor,
      setor: 'Consultório',
      status: 'Agendado'
    };
    await onAddAtendimento(newAtendimento);
    setFormData({ paciente: '', profissional: 'Enf.ª Andreia', servico: '', valor: '' });
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title="Novo Agendamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="paciente" className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
          <input
            type="text"
            id="paciente"
            name="paciente"
            value={formData.paciente}
            onChange={handleChange}
            list="pacientes-sugestoes"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="Digite o nome do paciente"
            required
          />
          <datalist id="pacientes-sugestoes">
            {[...new Set(pacientes.map(p => p.nome))].map(p => <option key={p} value={p} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="profissional" className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
          <select id="profissional" name="profissional" value={formData.profissional} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent">
            <option>Enf.ª Andreia</option>
            <option>Tec. Bruno</option>
            <option>Enf.ª Ana</option>
            <option>Tec. Marilia</option>
            <option>Dr Ciarline</option>
          </select>
        </div>
        <div>
          <label htmlFor="servico" className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
          <input
            type="text"
            id="servico"
            name="servico"
            value={formData.servico}
            onChange={handleChange}
            list="servicos-sugestoes"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
            placeholder="Digite o nome do serviço"
            required
          />
          <datalist id="servicos-sugestoes">
            {servicos.map(s => <option key={s.id} value={s.nome} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
          <input type="number" id="valor" name="valor" value={formData.valor} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" placeholder="0,00" required />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition-all">Cancelar</button>
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all">Salvar</button>
        </div>
      </form>
    </Modal>
  );
};

const Atendimentos = ({ servicos, atendimentos, onUpdateAtendimento, onAddAtendimento, onDeleteAtendimento, onAddTransaction, financeiro, showToast, pacientes }) => {
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('proximos');

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteAtendimento(itemToDelete.id);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleUpdateStatus = async (atendimento, newStatus) => {
    const updatedItem = { ...atendimento, status: newStatus };
    await onUpdateAtendimento(updatedItem);

    if (newStatus === 'Confirmado') {
      const existingTransaction = financeiro.find(t => t.atendimentoId === atendimento.id);
      if (!existingTransaction) {
        const newTransaction = {
          data: atendimento.data,
          descricao: atendimento.tipo,
          pagador: atendimento.paciente,
          categoria: 'Atendimento Clínico',
          tipo: 'Entrada',
          valor: parseFloat(atendimento.valor) || 0,
          status: 'A Receber',
          atendimentoId: atendimento.id
        };
        await onAddTransaction(newTransaction);
        showToast('Lançamento financeiro "A Receber" criado automaticamente.', 'success');
      }
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const proximosAtendimentos = atendimentos.filter(at => at.data >= today).sort((a, b) => new Date(a.data) - new Date(b.data));
  const historicoAtendimentos = atendimentos.filter(at => at.data < today);

  const AtendimentoList = ({ items }) => (
    <div className="space-y-4">
      {items.length > 0 ? items.map(at => (
        <div key={at.id} className="p-5 border border-gray-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex-1 mb-3 md:mb-0">
            <p className="font-bold text-lg text-gray-800">{at.paciente}</p>
            <p className="text-sm text-gray-600">{at.tipo} - {at.profissional}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(at.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {at.setor}</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <span className="text-lg font-bold text-gray-700">R$ {at.valor}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusMap[at.status] || 'bg-gray-200 text-gray-800'}`}>{at.status.toUpperCase()}</span>
            {at.status === 'Agendado' && (
              <div className="flex gap-2">
                <button onClick={() => handleUpdateStatus(at, 'Confirmado')} className="bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-full hover:bg-green-600">Confirmar</button>
                <button onClick={() => handleUpdateStatus(at, 'Cancelado')} className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-full hover:bg-red-600">Cancelar</button>
              </div>
            )}
            <button onClick={() => handleDeleteClick(at)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )) : <p className="text-center text-gray-500">Nenhum atendimento encontrado.</p>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Atendimentos</h1>
        <button onClick={() => setShowAgendamentoModal(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg flex-shrink-0">Novo Agendamento</button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('proximos')}
            className={`${activeTab === 'proximos' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>
            Próximos
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`${activeTab === 'historico' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>
            Histórico
          </button>
        </nav>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg shadow-gray-200/50">
        {activeTab === 'proximos' && <AtendimentoList items={proximosAtendimentos} />}
        {activeTab === 'historico' && <AtendimentoList items={historicoAtendimentos} />}
      </div>

      <AgendamentoModal show={showAgendamentoModal} onClose={() => setShowAgendamentoModal(false)} servicos={servicos} onAddAtendimento={onAddAtendimento} pacientes={pacientes} />
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

const Pacientes = ({ pacientes, onAddPaciente, onUpdatePaciente, onDeletePaciente, showToast }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);

  const handleEdit = (paciente) => {
    setEditingPaciente(paciente);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingPaciente(null);
    setShowModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Pacientes</h1>
        <button onClick={() => { setEditingPaciente(null); setShowModal(true); }} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg flex-shrink-0">Novo Paciente</button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Nome</th>
              <th scope="col" className="px-6 py-4 font-semibold hidden sm:table-cell">Telefone</th>
              <th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Data de Nascimento</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {pacientes.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.nome}</td>
                <td className="px-6 py-4 hidden sm:table-cell">{p.telefone}</td>
                <td className="px-6 py-4 hidden md:table-cell">{p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 font-medium"><FilePenLine className="inline h-5 w-5" /></button>
                  <button onClick={() => onDeletePaciente(p.id)} className="text-red-600 hover:text-red-800 font-medium ml-4"><Trash2 className="inline h-5 w-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal &&
        <PacienteModal
          show={showModal}
          onClose={handleCloseModal}
          onSave={editingPaciente ? onUpdatePaciente : onAddPaciente}
          paciente={editingPaciente}
        />
      }
    </div>
  );
};

const PacienteModal = ({ show, onClose, onSave, paciente }) => {
  const [formData, setFormData] = useState({
    nome: paciente?.nome || '',
    telefone: paciente?.telefone || '',
    dataNascimento: paciente?.dataNascimento || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = paciente ? { ...paciente, ...formData } : formData;
    await onSave(payload);
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title={paciente ? "Editar Paciente" : "Novo Paciente"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" required />
        </div>
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
        </div>
        <div>
          <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
          <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg">Salvar</button>
        </div>
      </form>
    </Modal>
  )
}

const NovaTransacaoModal = ({ show, onClose, onAddTransaction, servicos, pacientes }) => {
  const [newTransaction, setNewTransaction] = useState({
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    pagador: '',
    categoria: '',
    tipo: 'Entrada',
    valor: '',
    status: 'Recebido'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const transactionPayload = {
      ...newTransaction,
      valor: parseFloat(newTransaction.valor) || 0,
    };
    await onAddTransaction(transactionPayload, true); // Pass true to show alert
    setNewTransaction({ data: new Date().toISOString().slice(0, 10), descricao: '', pagador: '', categoria: '', tipo: 'Entrada', valor: '', status: 'Recebido' });
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title="Nova Transação Financeira">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input type="date" name="data" value={newTransaction.data} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" required />
        </div>
        <div>
          <label htmlFor="descricao-transacao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <input
            type="text"
            id="descricao-transacao"
            name="descricao"
            value={newTransaction.descricao}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
            required
            list="servicos-financeiro-sugestoes"
            placeholder="Digite o nome do serviço"
          />
          <datalist id="servicos-financeiro-sugestoes">
            {servicos.map(s => <option key={s.id} value={s.nome} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="pagador" className="block text-sm font-medium text-gray-700 mb-1">Cliente/Origem</label>
          <input
            type="text"
            name="pagador"
            value={newTransaction.pagador}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="Nome do cliente ou responsável"
            list="pacientes-financeiro-sugestoes"
            required
          />
          <datalist id="pacientes-financeiro-sugestoes">
            {[...new Set(pacientes.map(p => p.nome))].map(p => <option key={p} value={p} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <input type="text" name="categoria" value={newTransaction.categoria} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" placeholder="Ex: Consultas, Despesas Fixas" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select name="tipo" value={newTransaction.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent">
              <option>Entrada</option>
              <option>Saída</option>
            </select>
          </div>
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input type="number" step="0.01" name="valor" value={newTransaction.valor} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" required />
          </div>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" value={newTransaction.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent">
            <option>Recebido</option>
            <option>A Receber</option>
            <option>Pago</option>
            <option>A Pagar</option>
          </select>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition-all">Cancelar</button>
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

const Financeiro = ({ financeiro, onUpdateTransaction, onDeleteTransaction, servicos, onAddTransaction, showToast, pacientes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteTransaction(itemToDelete.id);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleUpdateStatus = async (id) => {
    const itemToUpdate = financeiro.find(item => item.id === id);
    if (!itemToUpdate) return;

    let newStatus = itemToUpdate.status;
    if (itemToUpdate.status === 'A Receber') newStatus = 'Recebido';
    if (itemToUpdate.status === 'A Pagar') newStatus = 'Pago';

    if (newStatus === itemToUpdate.status) return;

    const updatedItem = { ...itemToUpdate, status: newStatus };
    await onUpdateTransaction(updatedItem);
  };

  const filteredFinanceiro = financeiro.filter(f => {
    const textMatch = f.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.pagador && f.pagador.toLowerCase().includes(searchTerm.toLowerCase()));

    const dateMatch = (!startDate || f.data >= startDate) && (!endDate || f.data <= endDate);

    return textMatch && dateMatch;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const exportToCSV = () => {
    const headers = ["Data", "Descrição", "Cliente/Origem", "Categoria", "Tipo", "Valor", "Status"];
    const rows = filteredFinanceiro.map(row =>
      [row.data, `"${row.descricao}"`, `"${row.pagador}"`, `"${row.categoria}"`, row.tipo, row.valor, row.status].join(';')
    );

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(';') + "\n"
      + rows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_financeiro.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório exportado com sucesso!', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Financeiro</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button onClick={exportToCSV} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            <Download size={18} /> Exportar CSV
          </button>
          <button onClick={() => setShowModal(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg flex-shrink-0">Nova Transação</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Descrição, categoria, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">De</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Até</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <button onClick={clearFilters} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition-all md:col-start-4 lg:col-start-auto">Limpar Filtros</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Data</th>
              <th scope="col" className="px-6 py-4 font-semibold">Descrição</th>
              <th scope="col" className="px-6 py-4 font-semibold hidden sm:table-cell">Cliente/Origem</th>
              <th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Categoria</th>
              <th scope="col" className="px-6 py-4 font-semibold">Tipo</th>
              <th scope="col" className="px-6 py-4 font-semibold">Valor</th>
              <th scope="col" className="px-6 py-4 font-semibold">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredFinanceiro.map((tr) => {
              const isClickable = tr.status === 'A Receber' || tr.status === 'A Pagar';
              return (
                <tr key={tr.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(tr.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{tr.descricao}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">{tr.pagador}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{tr.categoria}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${tr.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tr.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold whitespace-nowrap">{tr.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      onClick={() => isClickable && handleUpdateStatus(tr.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${financialStatusMap[tr.status] || 'bg-gray-200 text-gray-800'} ${isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                    >
                      {tr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteClick(tr)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <NovaTransacaoModal show={showModal} onClose={() => setShowModal(false)} onAddTransaction={onAddTransaction} servicos={servicos} pacientes={pacientes} />
      <ConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem a certeza que deseja apagar a transação "${itemToDelete?.descricao}"?`}
      />
    </div>
  );
};

const NovoEstoqueModal = ({ show, onClose, onAddItem }) => {
  const [newItem, setNewItem] = useState({ item: '', categoria: '', consumoMedio: '', atual: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemPayload = {
      ...newItem,
      consumoMedio: parseInt(newItem.consumoMedio, 10) || 0,
      atual: parseInt(newItem.atual, 10) || 0
    };
    await onAddItem(itemPayload);
    setNewItem({ item: '', categoria: '', consumoMedio: '', atual: '' });
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title="Adicionar Novo Item ao Estoque">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
          <input type="text" name="item" value={newItem.item} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" required />
        </div>
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <input type="text" name="categoria" value={newItem.categoria} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="consumoMedio" className="block text-sm font-medium text-gray-700 mb-1">Consumo Médio</label>
            <input type="number" name="consumoMedio" value={newItem.consumoMedio} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" required />
          </div>
          <div>
            <label htmlFor="atual" className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
            <input type="number" name="atual" value={newItem.atual} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" required />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition-all">Cancelar</button>
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all">Salvar Item</button>
        </div>
      </form>
    </Modal>
  );
};


const Estoque = ({ estoque, onUpdateItem, onAddItem, onDeleteItem, showToast }) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNovoItemModal, setShowNovoItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleEdit = (item, field) => {
    setEditingItem({ item, field });
    setEditValue(String(item[field]));
  };

  const handleSave = async () => {
    if (!editingItem) return;

    const { item, field } = editingItem;
    const newValue = parseInt(editValue, 10);

    if (isNaN(newValue)) {
      setEditingItem(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/estoque/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      });
      const updatedItem = await response.json();
      onUpdateItem(updatedItem);
    } catch (error) {
      console.error("Falha ao atualizar o item do estoque:", error);
      showToast('Erro ao atualizar item.', 'error');
    } finally {
      setEditingItem(null);
    }
  };

  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingItem(null);
    }
  };

  const filteredEstoque = estoque.filter(item =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Controle de Estoque</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button onClick={() => setShowNovoItemModal(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg flex-shrink-0">Novo Item</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Item</th>
              <th scope="col" className="px-6 py-4 font-semibold">Categoria</th>
              <th scope="col" className="px-6 py-4 font-semibold hidden sm:table-cell">Consumo Médio</th>
              <th scope="col" className="px-6 py-4 font-semibold">Estoque Atual</th>
              <th scope="col" className="px-6 py-4 font-semibold hidden md:table-cell">Estoque Mínimo (30%)</th>
              <th scope="col" className="px-6 py-4 font-semibold">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredEstoque.map((item) => {
              const minimo = Math.ceil(item.consumoMedio * 0.3);
              const status = item.atual <= minimo ? 'COMPRAR' : 'OK';
              const isEditingAtual = editingItem && editingItem.item.id === item.id && editingItem.field === 'atual';
              const isEditingConsumo = editingItem && editingItem.item.id === item.id && editingItem.field === 'consumoMedio';

              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.item}</td>
                  <td className="px-6 py-4">{item.categoria}</td>
                  <td className="px-6 py-4 font-medium hidden sm:table-cell" onClick={() => !isEditingConsumo && handleEdit(item, 'consumoMedio')}>
                    {isEditingConsumo ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={handleInputChange}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-20 p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="cursor-pointer hover:bg-gray-200 p-1 rounded-md">{item.consumoMedio}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium" onClick={() => !isEditingAtual && handleEdit(item, 'atual')}>
                    {isEditingAtual ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={handleInputChange}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="w-20 p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="cursor-pointer hover:bg-gray-200 p-1 rounded-md">{item.atual}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">{minimo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteClick(item)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <NovoEstoqueModal
        show={showNovoItemModal}
        onClose={() => setShowNovoItemModal(false)}
        onAddItem={onAddItem}
      />
      <ConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem a certeza que deseja apagar o item "${itemToDelete?.item}" do estoque?`}
      />
    </div>
  );
};

const NovaRegraRepasseModal = ({ show, onClose, onAddRepasse, servicosDisponiveis }) => {
  const [newRule, setNewRule] = useState({ servico: '', tipo: 'Percentual', valor: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRule(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAddRepasse({ ...newRule });
    setNewRule({ servico: '', tipo: 'Percentual', valor: '' });
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title="Nova Regra de Repasse">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="servico-regra" className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
          <input
            type="text"
            id="servico-regra"
            name="servico"
            value={newRule.servico}
            onChange={handleChange}
            list="servicos-regras-sugestoes"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
            placeholder="Digite o nome do serviço"
            required
          />
          <datalist id="servicos-regras-sugestoes">
            {servicosDisponiveis.map(s => <option key={s.id} value={s.nome} />)}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tipo-regra" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select id="tipo-regra" name="tipo" value={newRule.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent">
              <option value="Percentual">Percentual</option>
              <option value="Fixo">Fixo</option>
            </select>
          </div>
          <div>
            <label htmlFor="valor-regra" className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input id="valor-regra" type="text" name="valor" value={newRule.valor} onChange={handleChange} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" placeholder={newRule.tipo === 'Percentual' ? 'Ex: 40%' : 'Ex: R$ 50,00'} required />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300 transition-all">Cancelar</button>
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all">Salvar Regra</button>
        </div>
      </form>
    </Modal>
  );
};

const Configuracoes = ({ servicos, onUpdateServico, repasses, onUpdateRepasse, onAddRepasse, onDeleteRepasse, onAddServico, onDeleteServico, showToast }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [novoServico, setNovoServico] = useState('');

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteRepasse(itemToDelete.id);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditData(repasses[index]);
  };

  const handleCancel = () => {
    setEditingIndex(null);
  };

  const handleSave = async (index) => {
    const itemToUpdate = repasses[index];
    const updatedItem = { ...itemToUpdate, ...editData };
    await onUpdateRepasse(updatedItem);
    setEditingIndex(null);
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleAddServicoSubmit = (e) => {
    e.preventDefault();
    if (novoServico.trim() === '') return;
    onAddServico({ nome: novoServico });
    setNovoServico('');
  }

  const servicosComRegra = repasses.map(r => r.servico);
  const servicosDisponiveis = servicos.filter(s => !servicosComRegra.includes(s.nome));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Configurações</h1>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg shadow-gray-200/50">
        <h3 className="text-xl lg:text-2xl font-bold text-gray-700 mb-6">Gestão de Serviços</h3>
        <form onSubmit={handleAddServicoSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            value={novoServico}
            onChange={(e) => setNovoServico(e.target.value)}
            placeholder="Nome do novo serviço"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400"
          />
          <button type="submit" className="bg-pink-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-pink-600">Adicionar</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold">Serviço</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {servicos.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{s.nome}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDeleteServico(s.id)} className="text-red-600 hover:text-red-800 font-medium"><Trash2 className="inline h-5 w-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg shadow-gray-200/50">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h3 className="text-xl lg:text-2xl font-bold text-gray-700">Regras de Repasse (Comissão da Clínica)</h3>
          <button onClick={() => setShowModal(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-lg transition-all shadow-md hover:shadow-lg w-full sm:w-auto">Nova Regra</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-semibold">Serviço</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Valor</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {repasses.map((r, index) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.servico}</td>
                  {editingIndex === index ? (
                    <>
                      <td className="px-6 py-4">
                        <select name="tipo" value={editData.tipo} onChange={handleChange} className="w-full p-1 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none">
                          <option value="Percentual">Percentual</option>
                          <option value="Fixo">Fixo</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input name="valor" type="text" value={editData.valor} onChange={handleChange} className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleSave(index)} className="text-green-600 hover:text-green-800 font-medium">Salvar</button>
                        <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 ml-4 font-medium">Cancelar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">{r.tipo}</td>
                      <td className="px-6 py-4 font-bold">{r.valor}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(index)} className="text-blue-600 hover:text-blue-800 font-medium"><FilePenLine className="inline h-5 w-5" /></button>
                        <button onClick={() => handleDeleteClick(r)} className="text-red-600 hover:text-red-800 font-medium ml-4"><Trash2 className="inline h-5 w-5" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <NovaRegraRepasseModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onAddRepasse={onAddRepasse}
        servicosDisponiveis={servicos}
      />
      <ConfirmationModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem a certeza que deseja apagar a regra para o serviço "${itemToDelete?.servico}"?`}
      />
    </div>
  );
};


// --- Main App Component ---

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');


  const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/api';

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLogin = (username, password) => {
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Utilizador ou senha inválidos.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Busca todos os dados iniciais do backend
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoints = ['atendimentos', 'financeiro', 'estoque', 'servicos', 'repasses', 'pacientes'];
        const responses = await Promise.all(endpoints.map(e => fetch(`${API_URL}/${e}`)));

        const data = await Promise.all(responses.map(async (res) => {
          if (res.ok) {
            return res.json();
          }
          if (res.status === 404) {
            console.warn(`Endpoint não encontrado: ${res.url}. Usando um array vazio como fallback.`);
            return []; // Fallback for missing endpoints
          }
          throw new Error(`Falha ao buscar dados de ${res.url}: ${res.statusText}`);
        }));

        setAtendimentos(data[0].sort((a, b) => new Date(b.data) - new Date(a.data)));
        setFinanceiro(data[1].sort((a, b) => new Date(b.data) - new Date(a.data)));
        setEstoque(data[2]);
        setServicos(data[3]);
        setRepasses(data[4]);
        setPacientes(data[5]);
      } catch (error) {
        console.error("Falha ao buscar dados do backend:", error);
        showToast('Falha ao carregar dados do servidor.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  // Funções para ADICIONAR
  const handleAddAtendimento = async (newAtendimento) => {
    try {
      const response = await fetch(`${API_URL}/atendimentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAtendimento),
      });
      const addedAtendimento = await response.json();
      setAtendimentos(prev => [addedAtendimento, ...prev].sort((a, b) => new Date(b.data) - new Date(a.data)));
      showToast('Novo agendamento salvo!', 'success');
    } catch (error) {
      console.error("Falha ao adicionar atendimento:", error);
      showToast('Erro ao salvar agendamento.', 'error');
    }
  };

  const handleAddTransaction = async (newTransaction, showAlert = false) => {
    try {
      const response = await fetch(`${API_URL}/financeiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
      const addedTransaction = await response.json();
      setFinanceiro(prev => [addedTransaction, ...prev].sort((a, b) => new Date(b.data) - new Date(a.data)));
      if (showAlert) {
        showToast('Nova transação adicionada!', 'success');
      }
    } catch (error) {
      console.error("Falha ao adicionar transação:", error);
      showToast('Erro ao adicionar transação.', 'error');
    }
  };

  const handleAddItem = async (newItem) => {
    try {
      const response = await fetch(`${API_URL}/estoque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const addedItem = await response.json();
      setEstoque(prev => [...prev, addedItem]);
      showToast('Novo item adicionado ao estoque!', 'success');
    } catch (error) {
      console.error("Falha ao adicionar item ao estoque:", error);
      showToast('Erro ao adicionar item.', 'error');
    }
  };

  const handleAddRepasse = async (newRule) => {
    try {
      const response = await fetch(`${API_URL}/repasses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      const addedRule = await response.json();
      setRepasses(prev => [...prev, addedRule]);
      showToast('Nova regra de repasse adicionada!', 'success');
    } catch (error) {
      console.error("Falha ao adicionar regra de repasse:", error);
      showToast('Erro ao salvar regra.', 'error');
    }
  };

  const handleAddServico = async (newServico) => {
    try {
      const response = await fetch(`${API_URL}/servicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newServico)
      });
      const addedServico = await response.json();
      setServicos(prev => [...prev, addedServico]);
      showToast('Novo serviço adicionado!', 'success');
    } catch (error) {
      console.error("Falha ao adicionar serviço:", error);
      showToast('Erro ao adicionar serviço.', 'error');
    }
  };

  const handleAddPaciente = async (newPaciente) => {
    try {
      const response = await fetch(`${API_URL}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPaciente)
      });
      const addedPaciente = await response.json();
      setPacientes(prev => [addedPaciente, ...prev]);
      showToast('Novo paciente adicionado!', 'success');
    } catch (error) {
      console.error("Falha ao adicionar paciente:", error);
      showToast('Erro ao adicionar paciente.', 'error');
    }
  };

  // Funções para ATUALIZAR
  const handleUpdateAtendimento = (updatedAtendimento) => {
    setAtendimentos(prev => prev.map(at => at.id === updatedAtendimento.id ? updatedAtendimento : at));
  };
  const handleUpdateTransaction = (updatedTransaction) => {
    setFinanceiro(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };
  const handleUpdateItemEstoque = (updatedItem) => {
    setEstoque(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };
  const handleUpdateRepasse = (updatedRepasse) => {
    setRepasses(prev => prev.map(r => r.id === updatedRepasse.id ? updatedRepasse : r));
  };
  const handleUpdatePaciente = (updatedPaciente) => {
    setPacientes(prev => prev.map(p => p.id === updatedPaciente.id ? updatedPaciente : p));
  };


  // Funções para APAGAR
  const handleDeleteAtendimento = async (id) => {
    try {
      await fetch(`${API_URL}/atendimentos/${id}`, { method: 'DELETE' });
      setAtendimentos(prev => prev.filter(item => item.id !== id));
      showToast('Atendimento apagado!', 'success');
    } catch (error) {
      console.error("Falha ao apagar atendimento:", error);
      showToast('Erro ao apagar atendimento.', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await fetch(`${API_URL}/financeiro/${id}`, { method: 'DELETE' });
      setFinanceiro(prev => prev.filter(item => item.id !== id));
      showToast('Transação apagada!', 'success');
    } catch (error) {
      console.error("Falha ao apagar transação:", error);
      showToast('Erro ao apagar transação.', 'error');
    }
  };

  const handleDeleteItemEstoque = async (id) => {
    try {
      await fetch(`${API_URL}/estoque/${id}`, { method: 'DELETE' });
      setEstoque(prev => prev.filter(item => item.id !== id));
      showToast('Item do estoque apagado!', 'success');
    } catch (error) {
      console.error("Falha ao apagar item do estoque:", error);
      showToast('Erro ao apagar item.', 'error');
    }
  };

  const handleDeleteRepasse = async (id) => {
    try {
      await fetch(`${API_URL}/repasses/${id}`, { method: 'DELETE' });
      setRepasses(prev => prev.filter(r => r.id !== id));
      showToast('Regra de repasse apagada!', 'success');
    } catch (error) {
      console.error("Falha ao apagar regra de repasse:", error);
      showToast('Erro ao apagar regra.', 'error');
    }
  };

  const handleDeleteServico = async (id) => {
    try {
      await fetch(`${API_URL}/servicos/${id}`, { method: 'DELETE' });
      setServicos(prev => prev.filter(s => s.id !== id));
      showToast('Serviço apagado!', 'success');
    } catch (error) {
      console.error("Falha ao apagar serviço:", error);
      showToast('Erro ao apagar serviço.', 'error');
    }
  };

  const handleDeletePaciente = async (id) => {
    try {
      await fetch(`${API_URL}/pacientes/${id}`, { method: 'DELETE' });
      setPacientes(prev => prev.filter(p => p.id !== id));
      showToast('Paciente apagado!', 'success');
    } catch (error) {
      console.error("Falha ao apagar paciente:", error);
      showToast('Erro ao apagar paciente.', 'error');
    }
  };


  const pageTitles = {
    dashboard: "Dashboard",
    atendimentos: "Atendimentos",
    pacientes: "Pacientes",
    financeiro: "Financeiro",
    estoque: "Estoque",
    configuracoes: "Configurações"
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard estoque={estoque} atendimentos={atendimentos} financeiro={financeiro} repasses={repasses} />;
      case 'atendimentos':
        return <Atendimentos servicos={servicos} atendimentos={atendimentos} onUpdateAtendimento={handleUpdateAtendimento} financeiro={financeiro} onAddAtendimento={handleAddAtendimento} onDeleteAtendimento={handleDeleteAtendimento} onAddTransaction={handleAddTransaction} showToast={showToast} pacientes={pacientes} />;
      case 'pacientes':
        return <Pacientes pacientes={pacientes} onAddPaciente={handleAddPaciente} onDeletePaciente={handleDeletePaciente} onUpdatePaciente={handleUpdatePaciente} showToast={showToast} />;
      case 'financeiro':
        return <Financeiro financeiro={financeiro} onUpdateTransaction={handleUpdateTransaction} servicos={servicos} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} showToast={showToast} pacientes={pacientes} />;
      case 'estoque':
        return <Estoque estoque={estoque} onUpdateItem={handleUpdateItemEstoque} onAddItem={handleAddItem} onDeleteItem={handleDeleteItemEstoque} showToast={showToast} />;
      case 'configuracoes':
        return <Configuracoes servicos={servicos} setServicos={setServicos} repasses={repasses} onUpdateRepasse={handleUpdateRepasse} onAddRepasse={handleAddRepasse} onDeleteRepasse={handleDeleteRepasse} onAddServico={handleAddServico} onDeleteServico={handleDeleteServico} showToast={showToast} />;
      default:
        return <Dashboard estoque={estoque} atendimentos={atendimentos} financeiro={financeiro} repasses={repasses} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <p className="text-xl font-semibold text-gray-600">A carregar dados...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-gray-800">
      <style>{`
                 @keyframes fade-in-up {
                     from { opacity: 0; transform: translateY(20px); }
                     to { opacity: 1; transform: translateY(0); }
                 }
                 .animate-fade-in-up {
                     animation: fade-in-up 0.3s ease-out forwards;
                 }
             `}</style>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto lg:ml-64 transition-all duration-300 ease-in-out">
        <Header onMenuClick={() => setIsSidebarOpen(true)} title={pageTitles[currentPage]} />
        {renderPage()}
      </main>
    </div>
  );
}

