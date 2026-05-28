import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { Upload, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadSync = () => {
  const [sources, setSources] = useState([]);
  const [tenantId, setTenantId] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would come from a context/auth state.
    // Here we just fetch the seeded data to get our tenant ID.
    const fetchSetup = async () => {
      try {
        const res = await axios.post('/api/setup/seed_data/');
        setTenantId(res.data.tenant_id);
      } catch (err) {
        console.error("Failed to ensure tenant setup");
      }
    };
    fetchSetup();

    // Ideally we'd fetch the sources list from an API endpoint, but for prototype we can hardcode the mapping or fetch if we made an endpoint.
    // Since we didn't make a /api/sources/ endpoint, we'll hardcode the types we support.
    setSources([
      { id: 'sap', name: 'SAP ERP (Fuel & Procurement)', type: 'SAP_ALV' },
      { id: 'pge', name: 'PG&E Portal (Electricity)', type: 'PGE_GREEN_BUTTON' },
      { id: 'navan', name: 'Navan Expense (Corporate Travel)', type: 'NAVAN_API' },
    ]);
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedSource) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // First we need the source DB ID, let's fetch it via API if we had one, 
      // but since we only have the type, let's assume we can map it or we should add an endpoint.
      // Wait, we can modify the view to accept source_type instead of source_id, or we just pass a string and let the backend find it.
      // For now, let's assume we use standard form data.
      
      if (selectedSource.type === 'NAVAN_API') {
        await axios.post('/api/runs/sync_navan/', { tenant_id: tenantId });
        setSuccess('Navan sync triggered successfully!');
        setTimeout(() => navigate('/review'), 1500);
      } else {
        if (!file) {
          setError('Please select a CSV file.');
          setLoading(false);
          return;
        }
        
        // We need the source_id. Let's just pass `source_type` and we'll need to patch the backend to accept it.
        // Actually, our API takes `source_id`. I'll pass 1 or 2 for now, or better yet, I should fix the backend to lookup by type.
        // Let's assume we have to do a small hack: we'll send the type and I'll modify the backend parser to handle type.
        const formData = new FormData();
        formData.append('tenant_id', tenantId);
        formData.append('source_type', selectedSource.type); 
        formData.append('file', file);

        await axios.post('/api/runs/upload_file/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setSuccess(`${selectedSource.name} file uploaded successfully!`);
        setTimeout(() => navigate('/review'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during ingestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ingest Data</h1>
        <p className="text-slate-500 mt-1">Upload files or sync APIs from configured sources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {sources.map(src => (
          <button
            key={src.id}
            onClick={() => { setSelectedSource(src); setFile(null); setError(''); setSuccess(''); }}
            className={`p-6 rounded-xl border text-left transition-all ${
              selectedSource?.id === src.id 
                ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500' 
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            {src.type === 'NAVAN_API' ? (
              <RefreshCw className={`mb-4 ${selectedSource?.id === src.id ? 'text-emerald-600' : 'text-slate-400'}`} size={32} />
            ) : (
              <FileText className={`mb-4 ${selectedSource?.id === src.id ? 'text-emerald-600' : 'text-slate-400'}`} size={32} />
            )}
            <h3 className="font-semibold text-slate-900 mb-1">{src.name}</h3>
            <p className="text-xs text-slate-500">
              {src.type === 'NAVAN_API' ? 'API Integration' : 'CSV Upload'}
            </p>
          </button>
        ))}
      </div>

      {selectedSource && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-slate-800">
            {selectedSource.type === 'NAVAN_API' ? 'Sync Data via API' : 'Upload CSV File'}
          </h2>

          <form onSubmit={handleUpload}>
            {selectedSource.type !== 'NAVAN_API' && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select CSV File</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" accept=".csv" onChange={e => setFile(e.target.files[0])} />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">CSV up to 10MB</p>
                    {file && <p className="text-sm font-medium text-emerald-600 mt-2">{file.name}</p>}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start space-x-3 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-start space-x-3 text-sm">
                <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
                <span>{success}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || (selectedSource.type !== 'NAVAN_API' && !file)}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-2"
              >
                {loading && <RefreshCw size={18} className="animate-spin" />}
                <span>{loading ? 'Processing...' : selectedSource.type === 'NAVAN_API' ? 'Start API Sync' : 'Upload Data'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UploadSync;
