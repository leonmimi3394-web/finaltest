import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Lightbulb, 
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { AppView, Transaction } from './types';
import { getTransactions } from './services/storageService';
import { auth } from './services/firebase';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Login } from './components/Login';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        refreshData();
      }
    });
    return () => unsubscribe();
  }, []);

  // History Handling
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ view: AppView.DASHBOARD }, '');
    }
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        setCurrentView(AppView.DASHBOARD);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const refreshData = async () => {
    setDataLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setDataLoading(false);
    }
  };

  const navigateTo = (view: AppView) => {
    if (currentView !== view) {
      setCurrentView(view);
      window.history.pushState({ view }, '');
    }
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setTransactions([]);
  };

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.TRANSACTIONS, label: 'Transactions', icon: Receipt },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-indigo-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-indigo-800">
            <div className="bg-yellow-400 p-2 rounded-lg text-indigo-900">
              <Lightbulb size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold">adbfc</h1>
              <p className="text-xs text-indigo-300">LED Manager</p>
            </div>
            <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4">
             <div className="flex items-center gap-3 p-3 bg-indigo-800 rounded-lg">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-8 h-8 rounded-full" alt="User" />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.displayName}</p>
                  <p className="text-xs text-indigo-300 truncate">Online</p>
                </div>
             </div>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentView === item.id 
                    ? 'bg-indigo-700 text-white shadow-lg translate-x-1' 
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-indigo-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 justify-center p-2 text-indigo-300 hover:text-white hover:bg-indigo-800 rounded-lg transition"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
            <div className="mt-4 text-center text-xs text-indigo-400">
              v1.0.0 • Server: Firebase
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-800">
            {navItems.find(n => n.id === currentView)?.label}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {dataLoading ? (
               <div className="flex items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                 <span className="ml-3 text-gray-500">Syncing data...</span>
               </div>
            ) : (
              <>
                {currentView === AppView.DASHBOARD && <Dashboard transactions={transactions} />}
                {currentView === AppView.TRANSACTIONS && <Transactions transactions={transactions} onUpdate={refreshData} />}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;