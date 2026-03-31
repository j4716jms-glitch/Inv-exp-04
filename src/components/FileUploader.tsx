'use client';
// components/FileUploader.tsx
import { useState, useCallback, useRef } from 'react';
import {
  Upload, FileSpreadsheet, Trash2, RefreshCw,
  CheckCircle2, AlertCircle, Loader2, Download, FolderOpen,
} from 'lucide-react';
import { THEME_COLOR } from '@/config/settings.config';

export interface BlobFile {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

interface Props {
  files: BlobFile[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (url: string) => Promise<void>;
  onSelectFile: (file: BlobFile) => void;
  selectedUrl: string | null;
  onUploadSuccess: (file: BlobFile) => void;
}

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function basename(pathname: string) {
  // Remove random suffix added by Vercel Blob
  return pathname.split('/').pop()?.replace(/-[a-z0-9]{8,}(\.[^.]+)$/, '$1') ?? pathname;
}

export default function FileUploader({
  files, loading, onRefresh, onDelete, onSelectFile, selectedUrl, onUploadSuccess,
}: Props) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setUploadMsg(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setUploadMsg({ type: 'ok', text: `"${basename(data.pathname)}" uploaded successfully!` });
      onUploadSuccess(data as BlobFile);
    } catch (e: unknown) {
      setUploadMsg({ type: 'err', text: e instanceof Error ? e.message : 'Upload error' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onUploadSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDelete = async (url: string) => {
    setDeletingUrl(url);
    await onDelete(url);
    setDeletingUrl(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`drop-zone rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragging ? 'dragging' : 'hover:border-teal-400 hover:bg-teal-50/40'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
        />

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `${THEME_COLOR}14` }}
        >
          {uploading
            ? <Loader2 size={24} className="animate-spin" style={{ color: THEME_COLOR }} />
            : <Upload size={24} style={{ color: THEME_COLOR }} />
          }
        </div>

        <p className="font-display font-semibold text-slate-700 mb-1">
          {uploading ? 'Uploading…' : 'Drop your file here'}
        </p>
        <p className="text-sm text-slate-400">
          .xlsx, .xls, or .csv · Max 10 MB · Click to browse
        </p>

        {uploadMsg && (
          <div
            className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${
              uploadMsg.type === 'ok' ? 'text-teal-700' : 'text-red-600'
            }`}
          >
            {uploadMsg.type === 'ok'
              ? <CheckCircle2 size={15} />
              : <AlertCircle size={15} />
            }
            {uploadMsg.text}
          </div>
        )}
      </div>

      {/* File list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-slate-400" />
            <span className="font-display text-sm font-semibold text-slate-700">
              Uploaded Files
            </span>
            <span className="badge badge-teal">{files.length}</span>
          </div>
          <button onClick={onRefresh} disabled={loading} className="btn-secondary py-1.5 px-3 text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading files…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <FileSpreadsheet size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No files uploaded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {files.map((f) => {
              const isSelected = f.url === selectedUrl;
              const isDeleting = deletingUrl === f.url;
              const name       = basename(f.pathname);

              return (
                <li
                  key={f.url}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => onSelectFile(f)}
                >
                  <FileSpreadsheet
                    size={18}
                    className="shrink-0"
                    style={{ color: isSelected ? THEME_COLOR : '#94a3b8' }}
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isSelected ? THEME_COLOR : '#1e293b' }}
                    >
                      {name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {fmt(f.size)} · {new Date(f.uploadedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="badge badge-teal text-[10px] shrink-0">Active</span>
                  )}

                  <a
                    href={f.downloadUrl}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.url); }}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {isDeleting
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
