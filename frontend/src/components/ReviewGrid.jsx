import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { AlertTriangle, Check, X, FileJson, AlertCircle } from 'lucide-react';

const ReviewGrid = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('PENDING_REVIEW');
  const [selectedRawData, setSelectedRawData] = useState(null); // For JSON modal

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/records/?status=${activeTab}`);
      setRecords(res.data);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const toggleSelect = (id) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(id)) newIds.delete(id);
    else newIds.add(id);
    setSelectedIds(newIds);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const handleBulkAction = async (newStatus) => {
    if (selectedIds.size === 0) return;
    try {
      await axios.post('/api/records/bulk_update_status/', {
        record_ids: Array.from(selectedIds),
        status: newStatus
      });
      fetchRecords(); // refresh
    } catch (err) {
      console.error('Bulk update failed', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Review Data</h1>
        <p className="text-slate-500 mt-1">Verify normalized data before locking for audit.</p>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg">
          {['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'LOCKED_FOR_AUDIT'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {activeTab === 'PENDING_REVIEW' && (
          <div className="flex space-x-3">
            <button 
              onClick={() => handleBulkAction('REJECTED')}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center"
            >
              <X size={16} className="mr-2" /> Reject Selected
            </button>
            <button 
              onClick={() => handleBulkAction('APPROVED')}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center shadow-sm"
            >
              <Check size={16} className="mr-2" /> Approve & Lock ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center h-full">
            <Check className="text-emerald-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900">All caught up</h3>
            <p className="text-slate-500 mt-1">No records in this queue.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-sm">
                <tr className="text-slate-600">
                  {activeTab === 'PENDING_REVIEW' && (
                    <th className="py-3 px-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === records.length && records.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Factor Hint / Details</th>
                  <th className="py-3 px-4 font-semibold">Quantity</th>
                  <th className="py-3 px-4 font-semibold">Dates</th>
                  <th className="py-3 px-4 font-semibold">Validation</th>
                  <th className="py-3 px-4 font-semibold text-center">Audit Raw</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(record => {
                  const hasIssues = record.validation_issues && record.validation_issues.length > 0;
                  return (
                    <tr 
                      key={record.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        selectedIds.has(record.id) ? 'bg-emerald-50/50' : ''
                      } ${hasIssues ? 'bg-red-50/30' : ''}`}
                    >
                      {activeTab === 'PENDING_REVIEW' && (
                        <td className="py-3 px-4 text-center border-r border-slate-100">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block">{record.category?.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-slate-500">{record.scope?.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{record.emission_factor_hint || '-'}</div>
                        <div className="text-xs text-slate-500 max-w-[200px] truncate" title={record.source_of_truth_id}>
                          ID: {record.source_of_truth_id}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {record.quantity ? Number(record.quantity).toLocaleString() : '-'} <span className="text-slate-500">{record.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {record.date_start ? record.date_start : '-'}
                        {record.date_end && record.date_end !== record.date_start ? ` to ${record.date_end}` : ''}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {hasIssues ? (
                          <div className="flex items-start text-red-600">
                            <AlertTriangle size={16} className="mr-1.5 mt-0.5 shrink-0" />
                            <div className="text-xs whitespace-normal break-words">
                              {record.validation_issues.map((issue, idx) => <div key={idx}>{issue}</div>)}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-emerald-600 text-xs font-medium">
                            <Check size={14} className="mr-1" /> OK
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => setSelectedRawData(record.raw_data)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50 inline-block"
                          title="View Raw Source JSON"
                        >
                          <FileJson size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Modal for Audit Trail */}
      {selectedRawData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <FileJson className="mr-2 text-indigo-500" size={18} /> Source Payload
              </h3>
              <button onClick={() => setSelectedRawData(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-auto bg-slate-900 text-slate-300 font-mono text-sm">
              <pre>{JSON.stringify(selectedRawData, null, 2)}</pre>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-start">
              <AlertCircle size={14} className="mr-2 shrink-0 text-slate-400" />
              <span>This is the immutable raw data exactly as received from the source system. It is preserved for audit trails and traceability.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewGrid;
