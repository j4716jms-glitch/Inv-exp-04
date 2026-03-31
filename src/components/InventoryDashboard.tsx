'use client';
// components/InventoryDashboard.tsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search, SlidersHorizontal, Download, ChevronUp, ChevronDown,
  ChevronsUpDown, LayoutGrid, Table2, Loader2, AlertTriangle,
  Package, TrendingUp, Hash, Layers, X, RefreshCw,
} from 'lucide-react';
import { InventoryRow, toCSV } from '@/lib/ExcelParser';
import {
  CURRENCY_LOCALE, CURRENCY_SYMBOL, DEFAULT_PAGE_SIZE, THEME_COLOR,
} from '@/config/settings.config';

// ─── Helpers ────────────────────────────────────────────────
const formatINR = (val: number) =>
  CURRENCY_SYMBOL +
  new Intl.NumberFormat(CURRENCY_LOCALE, { maximumFractionDigits: 2 }).format(val);

function isMonetary(key: string): boolean {
  return /price|cost|amount|value|mrp|rate|revenue|sales|total/i.test(key);
}
function isStock(key: string): boolean {
  return /stock|qty|quantity|units|count|inventory/i.test(key);
}
function isCategoryKey(key: string): boolean {
  return /category|type|group|class|dept|department|segment/i.test(key);
}

function detectColumns(columns: string[]) {
  return {
    name:     columns.find((c) => /^name|product|item|sku|title/i.test(c)) ?? columns[0],
    stock:    columns.find(isStock),
    price:    columns.find(isMonetary),
    category: columns.find(isCategoryKey),
  };
}

function stockBadge(val: number | null) {
  if (val === null) return <span className="badge badge-slate">N/A</span>;
  if (val <= 0)   return <span className="badge badge-red">Out of Stock</span>;
  if (val < 20)   return <span className="badge badge-amber">Low — {val}</span>;
  return <span className="badge badge-teal">{val}</span>;
}

type SortDir = 'asc' | 'desc' | null;

// ─── Summary cards ──────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="font-display text-2xl font-bold text-slate-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────
interface Props {
  data: InventoryRow[];
  columns: string[];
  sheets: string[];
  sourceFileName: string;
  loadingData: boolean;
  parseError: string | null;
  onReload: () => void;
}

export default function InventoryDashboard({
  data, columns, sheets, sourceFileName, loadingData, parseError, onReload,
}: Props) {
  const detected = useMemo(() => detectColumns(columns), [columns]);

  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('');
  const [sortCol, setSortCol]           = useState<string | null>(null);
  const [sortDir, setSortDir]           = useState<SortDir>(null);
  const [page, setPage]                 = useState(1);
  const [view, setView]                 = useState<'table' | 'cards'>('table');
  const [pageSize]                      = useState(DEFAULT_PAGE_SIZE);
  const [activeSheet, setActiveSheet]   = useState<string>('All');

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, category, activeSheet]);

  // ── Category options ──
  const categoryOptions = useMemo(() => {
    if (!detected.category) return [];
    const vals = Array.from(new Set(data.map((r) => String(r[detected.category!] ?? '')).filter(Boolean))).sort();
    return vals;
  }, [data, detected.category]);

  // ── Sheet tabs ──
  const sheetTabs = ['All', ...sheets];

  // ── Filtered + sorted data ──
  const processed = useMemo(() => {
    let rows = data;

    if (activeSheet !== 'All') {
      rows = rows.filter((r) => r._sheet === activeSheet);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        columns.some((c) => String(r[c] ?? '').toLowerCase().includes(q))
      );
    }

    if (category && detected.category) {
      rows = rows.filter((r) => String(r[detected.category!] ?? '') === category);
    }

    if (sortCol && sortDir) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol];
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, search, category, sortCol, sortDir, activeSheet, columns, detected.category]);

  // ── Stats ──
  const stats = useMemo(() => {
    const totalItems = processed.length;
    const totalStock = detected.stock
      ? processed.reduce((acc, r) => acc + (Number(r[detected.stock!]) || 0), 0)
      : null;
    const totalValue = detected.price && detected.stock
      ? processed.reduce((acc, r) => {
          const p = Number(r[detected.price!]) || 0;
          const s = Number(r[detected.stock!]) || 0;
          return acc + p * s;
        }, 0)
      : null;
    const outOfStock = detected.stock
      ? processed.filter((r) => Number(r[detected.stock!]) <= 0).length
      : null;

    return { totalItems, totalStock, totalValue, outOfStock };
  }, [processed, detected]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paged      = processed.slice((page - 1) * pageSize, page * pageSize);

  // ── Sorting ──
  const toggleSort = useCallback((col: string) => {
    setSortCol((prev) => {
      if (prev !== col) { setSortDir('asc'); return col; }
      setSortDir((d) => { if (d === 'asc') return 'desc'; if (d === 'desc') { setSortCol(null); return null; } return 'asc'; });
      return col;
    });
  }, []);

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ChevronsUpDown size={13} className="opacity-30" />;
    if (sortDir === 'asc')  return <ChevronUp size={13} style={{ color: THEME_COLOR }} />;
    if (sortDir === 'desc') return <ChevronDown size={13} style={{ color: THEME_COLOR }} />;
    return <ChevronsUpDown size={13} className="opacity-30" />;
  };

  // ── Export ──
  const exportCSV = () => {
    const csv   = toCSV(processed, columns);
    const blob  = new Blob([csv], { type: 'text/csv' });
    const link  = document.createElement('a');
    link.href   = URL.createObjectURL(blob);
    link.download = `inventory-export-${Date.now()}.csv`;
    link.click();
  };

  // ── Cell renderer ──
  const renderCell = (row: InventoryRow, col: string) => {
    const val = row[col];
    if (val === null) return <span className="text-slate-300">—</span>;
    if (col === detected.stock) return stockBadge(Number(val));
    if (col === detected.price && typeof val === 'number') return (
      <span className="font-mono text-xs" style={{ color: THEME_COLOR }}>{formatINR(val)}</span>
    );
    if (col === detected.category) return <span className="badge badge-slate">{String(val)}</span>;
    if (typeof val === 'number') return (
      <span className="font-mono text-xs text-slate-500">{val.toLocaleString(CURRENCY_LOCALE)}</span>
    );
    return <span>{String(val)}</span>;
  };

  // ─── Loading / Error states ──────────────────────────────
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
        <Loader2 size={32} className="animate-spin" style={{ color: THEME_COLOR }} />
        <p className="text-sm">Parsing spreadsheet…</p>
      </div>
    );
  }

  if (parseError) {
    return (
      <div className="card p-8 flex flex-col items-center gap-4 text-center max-w-md mx-auto mt-8">
        <AlertTriangle size={32} className="text-amber-500" />
        <div>
          <p className="font-semibold text-slate-800">Could not parse file</p>
          <p className="text-sm text-slate-500 mt-1">{parseError}</p>
        </div>
        <button onClick={onReload} className="btn-secondary">
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <Package size={36} className="text-slate-200" />
        <p className="font-display font-semibold text-slate-500">No data loaded</p>
        <p className="text-sm text-slate-400">Select or upload a spreadsheet file to get started.</p>
      </div>
    );
  }

  // ─── Main Dashboard ──────────────────────────────────────
  return (
    <div className="space-y-5 fade-in">

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Hash}       label="Total Items"   value={stats.totalItems.toLocaleString()} sub={`from ${sourceFileName}`}               color={THEME_COLOR} />
        {stats.totalStock   !== null && <StatCard icon={Layers}    label="Total Stock"   value={stats.totalStock.toLocaleString(CURRENCY_LOCALE)} sub="units across all products" color="#0ea5e9" />}
        {stats.totalValue   !== null && <StatCard icon={TrendingUp} label="Portfolio Value" value={formatINR(stats.totalValue)} sub="stock × unit price"  color="#8b5cf6" />}
        {stats.outOfStock   !== null && <StatCard icon={AlertTriangle} label="Out of Stock" value={String(stats.outOfStock)} sub="items need restocking" color="#f59e0b" />}
      </div>

      {/* Sheet tabs (only if multi-sheet) */}
      {sheets.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {sheetTabs.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSheet(s)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSheet === s
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700'
              }`}
              style={activeSheet === s ? { background: THEME_COLOR } : undefined}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anything…"
            className="input pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter */}
        {categoryOptions.length > 0 && (
          <div className="relative">
            <SlidersHorizontal size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input pl-9 pr-8 min-w-[160px] appearance-none"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* View toggle */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
          {(['table', 'cards'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3.5 py-2 transition-all ${
                view === v ? 'text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
              style={view === v ? { background: THEME_COLOR } : undefined}
              title={v === 'table' ? 'Table view' : 'Card view'}
            >
              {v === 'table' ? <Table2 size={16} /> : <LayoutGrid size={16} />}
            </button>
          ))}
        </div>

        {/* Export */}
        <button onClick={exportCSV} className="btn-secondary">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <strong className="text-slate-800">{processed.length.toLocaleString()}</strong> rows
          {search && <> matching "<em>{search}</em>"</>}
          {category && <> in <em>{category}</em></>}
        </p>
        <p className="text-xs text-slate-400 hidden sm:block font-mono">
          {columns.length} columns · {sheets.length} sheet{sheets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="desktop-table card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                {columns.filter((c) => c !== '_sheet').map((col) => (
                  <th key={col} onClick={() => toggleSort(col)}>
                    <span className="inline-flex items-center gap-1.5">
                      {col.replace(/_/g, ' ')}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                {sheets.length > 1 && <th>Sheet</th>}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-12 text-slate-400 text-sm">
                    No results found.
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => (
                  <tr key={i}>
                    {columns.filter((c) => c !== '_sheet').map((col) => (
                      <td key={col}>{renderCell(row, col)}</td>
                    ))}
                    {sheets.length > 1 && (
                      <td>
                        <span className="badge badge-slate text-[10px]">{String(row._sheet)}</span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="mobile-cards space-y-3">
        {paged.length === 0 ? (
          <div className="card p-8 text-center text-slate-400 text-sm">No results found.</div>
        ) : (
          paged.map((row, i) => (
            <div key={i} className="card p-4 space-y-3">
              {/* Primary row: name + stock */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {detected.name ? String(row[detected.name] ?? '—') : `Row ${i + 1}`}
                  </p>
                  {detected.category && (
                    <span className="badge badge-slate text-[10px] mt-1">
                      {String(row[detected.category] ?? '')}
                    </span>
                  )}
                </div>
                {detected.stock && stockBadge(Number(row[detected.stock]))}
              </div>

              {/* Price */}
              {detected.price && row[detected.price] !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Unit Price</span>
                  <span className="font-mono font-semibold" style={{ color: THEME_COLOR }}>
                    {formatINR(Number(row[detected.price]))}
                  </span>
                </div>
              )}

              {/* Other columns */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {columns
                  .filter((c) => c !== '_sheet' && c !== detected.name && c !== detected.stock && c !== detected.price && c !== detected.category)
                  .slice(0, 6)
                  .map((col) => (
                    <div key={col} className="text-xs">
                      <span className="text-slate-400 capitalize">{col.replace(/_/g, ' ')}: </span>
                      <span className="text-slate-700">{String(row[col] ?? '—')}</span>
                    </div>
                  ))
                }
              </div>

              {sheets.length > 1 && (
                <p className="text-[10px] text-slate-400 font-mono">Sheet: {String(row._sheet)}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Card view override for desktop */}
      {view === 'cards' && (
        <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-4">
          {paged.map((row, i) => (
            <div key={i} className="card p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800 truncate leading-tight">
                  {detected.name ? String(row[detected.name] ?? `Row ${i + 1}`) : `Row ${i + 1}`}
                </p>
                {detected.stock && stockBadge(Number(row[detected.stock]))}
              </div>

              {detected.price && row[detected.price] !== null && (
                <p className="font-mono text-lg font-bold" style={{ color: THEME_COLOR }}>
                  {formatINR(Number(row[detected.price]))}
                </p>
              )}

              {detected.category && (
                <span className="badge badge-slate text-xs">
                  {String(row[detected.category] ?? '')}
                </span>
              )}

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                {columns
                  .filter((c) => c !== '_sheet' && c !== detected.name && c !== detected.stock && c !== detected.price && c !== detected.category)
                  .slice(0, 4)
                  .map((col) => (
                    <div key={col} className="text-xs">
                      <span className="text-slate-400 capitalize block">{col.replace(/_/g, ' ')}</span>
                      <span className="text-slate-700 font-medium">{String(row[col] ?? '—')}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            >
              ← Prev
            </button>
            {/* Page numbers (show up to 5) */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pg    = start + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    pg === page
                      ? 'text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  style={pg === page ? { background: THEME_COLOR } : undefined}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
