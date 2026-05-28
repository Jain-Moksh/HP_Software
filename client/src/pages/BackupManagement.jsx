import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Database, Settings, Save, ArrowLeft, Download, RotateCw } from 'lucide-react';
import API_BASE_URL from '../config';

export default function BackupManagement() {
  const navigate = useNavigate();
  const { setHeaderActions } = useOutletContext();

  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    interval: 1440,
    path: 'C:/Moksh Software',
    lastBackup: null,
    lastFile: null
  });

  const fetchConfig = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/utility/backup/config`);
      const json = await resp.json();
      setConfig(json);
    } catch (err) {
      console.error('Failed to load backup configuration:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Configure toolbar/header refresh action
  useEffect(() => {
    setHeaderActions?.(() => (
      <div className="flex items-center gap-2">
        <button
          onClick={fetchConfig}
          className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] hover:text-[#0F172A] transition-all"
          title="Refresh Configurations"
        >
          <RotateCw size={18} />
        </button>
      </div>
    ));
    return () => setHeaderActions?.(null);
  }, [setHeaderActions, config]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const resp = await fetch(`${API_BASE_URL}/utility/backup/download`);
      if (!resp.ok) throw new Error('Backup failed');
      const blob = await resp.blob();

      const disposition = resp.headers.get('content-disposition');
      let filename = 'HP_Backup.sql';
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate manual backup');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveConfig = async () => {
    const isFtp = config.backupType === 'ftp';
    
    if (isFtp) {
      if (!config.ftpHost || !config.ftpHost.trim()) {
        alert('FTP Host/IP cannot be empty.');
        return;
      }
    } else {
      const pathStr = (config.path || '').trim();
      if (!pathStr) {
        alert('Backup path cannot be empty.');
        return;
      }

      if (/^(ftp|http|https|sftp|ftps):/i.test(pathStr)) {
        alert('Invalid backup path. Network URLs (like ftp:// or http://) are not supported.\n\nPlease use a local directory (e.g. C:/Backups) or a network share path (e.g. \\\\192.168.1.1\\share).');
        return;
      }

      const invalidChars = /[*\?"<>|]/;
      if (invalidChars.test(pathStr)) {
        alert('Backup path contains invalid characters (e.g. *, ?, ", <, >, |).');
        return;
      }

      const colonIndex = pathStr.indexOf(':');
      if (colonIndex !== -1) {
        if (colonIndex !== 1 && !(colonIndex === 2 && (pathStr.startsWith('/') || pathStr.startsWith('\\')))) {
          alert('Backup path contains an invalid colon character. Colons are only allowed for Windows drive letters (e.g. C:).');
          return;
        }
        const driveLetter = pathStr[colonIndex - 1];
        if (!/^[a-zA-Z]$/.test(driveLetter)) {
          alert('Backup path contains an invalid drive letter.');
          return;
        }
      }
    }

    try {
      setSaving(true);
      const resp = await fetch(`${API_BASE_URL}/utility/backup/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (resp.ok) {
        alert('Configuration saved successfully!');
        fetchConfig();
      } else {
        const errJson = await resp.json().catch(() => ({}));
        alert(errJson.error || 'Failed to save configuration');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const formatBackupDate = (dateStr) => {
    if (!dateStr) return 'NEVER';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* ── Page Toolbar ── */}
      <div className="flex-none bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/utility')}
            className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] hover:text-[#0F172A] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              Backup Management
            </h1>
            <p className="text-xs text-[#64748B]">Manual and automatic database protection</p>
          </div>
        </div>
      </div>

      {/* ── Grid Container ── */}
      <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Manual Backup */}
        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shadow-sm">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0F172A]">Manual Backup</h3>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Download a complete copy of your database</p>
            </div>
          </div>

          <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 text-sm leading-relaxed text-[#334155]">
            Creating a manual backup will generate a <strong className="font-bold text-[#2563EB]">.sql</strong> file containing all tables, sequences, and data. This file is saved directly to your computer and can be used to restore the system in case of emergency.
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full mt-4 py-3.5 px-6 font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#93C5FD] rounded-xl shadow-lg shadow-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            {downloading ? 'Generating Backup...' : 'Create & Download Backup'}
          </button>
        </div>

        {/* Right Side: Automatic Backup Settings */}
        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center shadow-sm">
              <Settings size={22} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0F172A]">Automatic Backup Settings</h3>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-0.5">Configure background data protection</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 mt-2">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-sm font-bold text-[#0F172A]">Enable Auto-Backup</span>
                <p className="text-xs text-[#64748B] mt-0.5">Triggers after every save/edit/delete</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center ${config.enabled ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                  }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${config.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Interval */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Backup Interval (Minutes)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={config.interval}
                  onChange={e => setConfig(prev => ({ ...prev, interval: Math.max(1, Number(e.target.value)) }))}
                  className="w-40 px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
                />
                <span className="text-xs font-medium text-[#64748B]">Minimum time between backups</span>
              </div>
            </div>

            {/* Backup Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Backup Destination</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, backupType: 'local' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    config.backupType === 'local'
                      ? 'border-[#2563EB] bg-blue-50/20'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <span className="block text-sm font-bold text-[#0F172A]">Local Server Storage</span>
                  <span className="block text-xs text-[#64748B] mt-0.5">Save to a local folder or UNC network share</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, backupType: 'ftp' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    config.backupType === 'ftp'
                      ? 'border-[#2563EB] bg-blue-50/20'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <span className="block text-sm font-bold text-[#0F172A]">Remote FTP Server</span>
                  <span className="block text-xs text-[#64748B] mt-0.5">Upload automatically to a remote FTP/FTPS host</span>
                </button>
              </div>
            </div>

            {config.backupType === 'ftp' ? (
              <div className="flex flex-col gap-4 border border-[#E2E8F0] p-5 rounded-xl bg-slate-50/30">
                <span className="text-xs font-bold text-[#475569] uppercase tracking-wider -mb-1 block">FTP Server Credentials</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B]">FTP Host / IP</label>
                    <input
                      type="text"
                      value={config.ftpHost || ''}
                      onChange={e => setConfig(prev => ({ ...prev, ftpHost: e.target.value }))}
                      className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
                      placeholder="e.g. 192.168.1.1"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B]">Port</label>
                    <input
                      type="number"
                      value={config.ftpPort || 21}
                      onChange={e => setConfig(prev => ({ ...prev, ftpPort: Number(e.target.value) }))}
                      className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
                      placeholder="21"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B]">Username</label>
                    <input
                      type="text"
                      value={config.ftpUser || ''}
                      onChange={e => setConfig(prev => ({ ...prev, ftpUser: e.target.value }))}
                      className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
                      placeholder="Anonymous / User"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B]">Password</label>
                    <input
                      type="password"
                      value={config.ftpPassword || ''}
                      onChange={e => setConfig(prev => ({ ...prev, ftpPassword: e.target.value }))}
                      className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
                      placeholder="Password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B]">Remote Directory Path</label>
                    <input
                      type="text"
                      value={config.ftpPath || ''}
                      onChange={e => setConfig(prev => ({ ...prev, ftpPath: e.target.value }))}
                      className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
                      placeholder="e.g. /usb1_1_1/entry"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white border border-[#CBD5E1] rounded-lg h-[34px]">
                    <span className="text-[10px] font-bold text-[#64748B]">FTPS (TLS)</span>
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, ftpSecure: !prev.ftpSecure }))}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${
                        config.ftpSecure ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                          config.ftpSecure ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">Local Backup Path (Server Machine)</label>
                <input
                  type="text"
                  value={config.path}
                  onChange={e => setConfig(prev => ({ ...prev, path: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
                  placeholder="C:/Moksh Software"
                />
                <span className="text-[11px] text-[#64748B] -mt-0.5">Note: The server will attempt to create this folder if it doesn't exist.</span>
              </div>
            )}

            {/* Last Backup Details */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Last Backup</span>
                <span className="text-xs font-extrabold text-[#0F172A] mt-1 block">
                  {formatBackupDate(config.lastBackup)}
                </span>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">Current File</span>
                <span className="text-xs font-extrabold text-[#2563EB] truncate mt-1 block" title={config.lastFile || 'None'}>
                  {config.lastFile || '---'}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full mt-2 py-3.5 px-6 font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#93C5FD] rounded-xl shadow-lg shadow-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>

            {/* Performance Policy */}
            <div className="mt-2 p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 text-xs leading-relaxed text-[#64748B]">
              <span className="text-[#2563EB] font-bold select-none">•</span>
              <p>
                <strong className="font-bold text-[#475569] uppercase tracking-tighter">Performance Policy</strong>: To ensure maximum performance, automatic backups are performed at a minimum interval of <strong className="font-bold text-[#2563EB]">{config.interval} minutes</strong>. Manual backups can be triggered at any time from the main Utility page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
