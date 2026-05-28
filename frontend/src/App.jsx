import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, CheckSquare } from 'lucide-react';
import Dashboard from './components/Dashboard';
import UploadSync from './components/UploadSync';
import ReviewGrid from './components/ReviewGrid';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Ingest Data', path: '/ingest', icon: UploadCloud },
    { name: 'Review Data', path: '/review', icon: CheckSquare },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Breathe ESG</h1>
        <p className="text-sm text-slate-400 mt-1">Data Ingestion Engine</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(link.path)
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500">Tenant: Acme Corp</div>
        <div className="text-xs text-slate-500">User: analyst@breathe.esg</div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen font-sans">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingest" element={<UploadSync />} />
            <Route path="/review" element={<ReviewGrid />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
