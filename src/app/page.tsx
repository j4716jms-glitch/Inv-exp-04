'use client';
// app/page.tsx
import { useState, useEffect, useCallback } from 'react';
import AccessKeyModal from '@/components/AccessKeyModal';
import Header from '@/components/Header';
import FileUploader, { BlobFile } from '@/components/FileUploader';
import InventoryDashboard from '@/components/InventoryDashboard';
import { InventoryRow } from '@/lib/ExcelParser';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { THEME_COLOR } from '@/config/settings.config';

export default function Home() {
  // ── Auth ────────────────────────────────────────────────
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('inv_access_key');
    if (saved) setAccessKey(saved);
    setAuthChecked(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('inv_access_key');
    setAccessKey(null);
  };

  // ── Files ────────────────────────────────────────────────
  const [files, setFiles]         = useState<BlobFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BlobFile | null>(null);

  // ── Parsed data ──────────────────────────────────────────
  const [data, setData]           = useState<InventoryRow[]>([]);
  const [columns, setColumns]     = useState<string[]>([]);
  const [sheets, setSheets]       = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [parseError, setParseError]   = useState<string | null>(null);

  // ── Sidebar ──────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Fetch file list ──────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const res  = await fetch('/api/list-files');
      const json = await res.json();
      setFiles(json.files ?? []);
    } catch {
      // silently fail — user will see "no files"
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessKey) fetchFiles();
  }, [accessKey, fetchFiles]);

  // ── Parse selected file (via server-side API to avoid 403) ──
  const parseFile = useCallback(async (file: BlobFile) => {
    setLoadingData(true);
    setParseError(null);
    setData([]);
    setColumns([]);
    setSheets([]);

    try {
      const res = await fetch('/api/parse-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: file.url }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Parse failed');
      setData(result.data);
      setColumns(result.columns);
      setSheets(result.sheets);
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : 'Unknown parse error');
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleSelectFile = useCallback((file: BlobFile) => {
    setSelectedFile(file);
    parseFile(file);
  }, [parseFile]);

  const handleUploadSuccess = useCallback((file: BlobFile) => {
    setFiles((prev) => [file, ...prev]);
    handleSelectFile(file);
  }, [handleSelectFile]);

  const handleDelete = useCallback(async (url: string) => {
    await fetch('/api/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    setFiles((prev) => prev.filter((f) => f.url !== url));
    if (selectedFile?.url === url) {
      setSelectedFile(null);
      setData([]);
      setColumns([]);
      setSheets([]);
    }
  }, [selectedFile]);

  // ── Render ───────────────────────────────────────────────
  if (!authChecked) return null;

  if (!accessKey) {
    return <AccessKeyModal onAuthenticated={setAccessKey} />;
  }

  const sourceFileName = selectedFile
    ? selectedFile.pathname.split('/').pop()?.replace(/-[a-z0-9]{8,}(\.[^.]+)$/, '$1') ?? 'file'
    : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header userName={accessKey} onLogout={handleLogout} />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-5 items-start">

          {/* ── Sidebar ── */}
          <aside
            className={`shrink-0 transition-all duration-300 ease-in-out ${
              sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
            }`}
          >
            <div className="w-80">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-sm uppercase tracking-widest text-slate-500">
                  File Manager
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors lg:hidden"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              <FileUploader
                files={files}
                loading={filesLoading}
                onRefresh={fetchFiles}
                onDelete={handleDelete}
                onSelectFile={handleSelectFile}
                selectedUrl={selectedFile?.url ?? null}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb / controls bar */}
            <div className="flex items-center gap-3 mb-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                  title="Open file manager"
                >
                  <PanelLeftOpen size={16} />
                </button>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-xl text-slate-900 truncate">
                  {selectedFile ? (
                    <>
                      <span className="text-slate-400 font-normal text-base mr-1">Viewing</span>
                      {sourceFileName}
                    </>
                  ) : 'Inventory Dashboard'}
                </h2>
                {selectedFile && sheets.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sheets.length} sheet{sheets.length !== 1 ? 's' : ''} · {data.length.toLocaleString()} rows · {columns.length} columns
                  </p>
                )}
              </div>

              {/* Accent dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 hidden sm:block"
                style={{ background: data.length > 0 ? THEME_COLOR : '#e2e8f0' }}
              />
            </div>

            {/* Dashboard */}
            <InventoryDashboard
              data={data}
              columns={columns}
              sheets={sheets}
              sourceFileName={sourceFileName}
              loadingData={loadingData}
              parseError={parseError}
              onReload={() => selectedFile && parseFile(selectedFile)}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
