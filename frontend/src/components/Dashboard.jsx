import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await axios.get('/api/runs/');
        setRuns(res.data);
      } catch (err) {
        console.error('Failed to fetch runs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, []);

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'FAILED': return <XCircle className="text-red-500" size={20} />;
      default: return <Clock className="text-amber-500 animate-pulse" size={20} />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of recent data ingestion runs</p>
        </div>
        <Link to="/ingest" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-2">
          <Activity size={18} />
          <span>New Ingestion</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Recent Ingestion Runs</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading data...</div>
        ) : runs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No data ingested yet</h3>
            <p className="text-slate-500 max-w-sm mt-2 mb-6">Start by uploading a CSV or syncing an API to populate your dashboard.</p>
            <Link to="/ingest" className="text-emerald-600 font-medium hover:text-emerald-700">Go to Ingestion &rarr;</Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-medium">
                <th className="py-3 px-6">Source</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Uploaded By</th>
                <th className="py-3 px-6">Records Total</th>
                <th className="py-3 px-6">Pending Review</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900">{run.data_source_name}</td>
                  <td className="py-4 px-6 text-slate-600">{new Date(run.created_at).toLocaleString()}</td>
                  <td className="py-4 px-6 text-slate-600">{run.uploaded_by}</td>
                  <td className="py-4 px-6 font-medium text-slate-900">{run.records_count}</td>
                  <td className="py-4 px-6">
                    {run.pending_count > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {run.pending_count} pending
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">0</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right flex justify-end">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600 capitalize">{run.status.toLowerCase().replace('_', ' ')}</span>
                      <StatusIcon status={run.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
