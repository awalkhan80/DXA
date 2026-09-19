import React, { useState } from 'react';
import { Database, Terminal, Play, Download, RotateCcw, X, Copy, Check, Table } from 'lucide-react';
import { db } from '../db/sqlite';

interface SqliteConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSql: () => void;
  onResetDb: () => void;
}

export const SqliteConsoleModal: React.FC<SqliteConsoleModalProps> = ({
  isOpen,
  onClose,
  onExportSql,
  onResetDb
}) => {
  const [query, setQuery] = useState('SELECT * FROM expenses;');
  const [result, setResult] = useState<{ columns: string[]; rows: any[][]; message?: string }>({
    columns: [],
    rows: []
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunQuery = (sqlToRun?: string) => {
    const q = sqlToRun || query;
    const res = db.executeQuery(q);
    setResult(res);
  };

  const handleCopySchema = () => {
    const schema = `
-- Sales Table (Step 1)
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_date DATE NOT NULL,
    sale_time TIME NOT NULL,
    sale_counter TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    reference_no TEXT,
    customer_name TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table (Step 2)
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_date DATE NOT NULL,
    expense_time TIME NOT NULL,
    expense_category TEXT NOT NULL,
    expense_source TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid_to TEXT,
    description TEXT,
    reference_no TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Capital Injections Table (Step 2)
CREATE TABLE capital_injections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    injection_date DATE NOT NULL,
    injection_time TIME NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    source TEXT DEFAULT 'Owner Capital',
    purpose TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expense Categories (Step 2)
CREATE TABLE expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1
);

-- Cash Sources (Step 2)
CREATE TABLE cash_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1
);

-- Sale Counters (Step 1)
CREATE TABLE sale_counters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    counter_name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1
);

-- Payment Methods (Step 1)
CREATE TABLE payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method_name TEXT UNIQUE NOT NULL,
    is_active INTEGER DEFAULT 1
);
    `.trim();

    navigator.clipboard.writeText(schema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e222d] text-stone-200 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-700 animate-in fade-in zoom-in-95 duration-150 font-mono text-xs">
        {/* Terminal Header */}
        <div className="bg-[#141720] px-4 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-[#06D6A0]" />
            <span className="font-bold text-white text-sm">
              System Database Inspector • Desert Xtreme Adventure
            </span>
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
              database.db [CONNECTED]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportSql}
              className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded text-[11px] transition-colors border border-stone-700 cursor-pointer"
            >
              <Download className="w-3 h-3 text-[#FF6B35]" />
              <span>Export Backup</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Schema Info Bar */}
        <div className="bg-[#181c26] px-4 py-2 border-b border-stone-800 flex items-center justify-between text-[11px] text-stone-400 overflow-x-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-stone-500">Tables:</span>
            <button
              onClick={() => {
                setQuery('SELECT * FROM expenses;');
                handleRunQuery('SELECT * FROM expenses;');
              }}
              className="hover:text-rose-400 text-rose-300 font-semibold underline cursor-pointer"
            >
              expenses
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setQuery('SELECT * FROM capital_injections;');
                handleRunQuery('SELECT * FROM capital_injections;');
              }}
              className="hover:text-emerald-400 text-emerald-300 font-semibold underline cursor-pointer"
            >
              capital_injections
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setQuery('SELECT * FROM sales;');
                handleRunQuery('SELECT * FROM sales;');
              }}
              className="hover:text-amber-400 underline cursor-pointer"
            >
              sales
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setQuery('SELECT * FROM expense_categories;');
                handleRunQuery('SELECT * FROM expense_categories;');
              }}
              className="hover:text-stone-200 underline cursor-pointer"
            >
              expense_categories
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setQuery('SELECT * FROM cash_sources;');
                handleRunQuery('SELECT * FROM cash_sources;');
              }}
              className="hover:text-stone-200 underline cursor-pointer"
            >
              cash_sources
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setQuery('SELECT * FROM sale_counters;');
                handleRunQuery('SELECT * FROM sale_counters;');
              }}
              className="hover:text-stone-200 underline cursor-pointer"
            >
              sale_counters
            </button>
          </div>

          <button
            onClick={handleCopySchema}
            className="flex items-center gap-1 hover:text-white transition-colors ml-4 text-[10px] shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copy Full DDL Schema</span>
          </button>
        </div>

        {/* Query Input Area */}
        <div className="p-4 bg-[#1a1d27] border-b border-stone-800 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-stone-400">SQL Query:</span>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => {
                  setQuery('SELECT * FROM expenses;');
                  handleRunQuery('SELECT * FROM expenses;');
                }}
                className="text-[10px] bg-rose-950/60 hover:bg-rose-900 px-2 py-0.5 rounded text-rose-300 border border-rose-800 cursor-pointer"
              >
                Expenses
              </button>
              <button
                onClick={() => {
                  setQuery('SELECT * FROM capital_injections;');
                  handleRunQuery('SELECT * FROM capital_injections;');
                }}
                className="text-[10px] bg-emerald-950/60 hover:bg-emerald-900 px-2 py-0.5 rounded text-emerald-300 border border-emerald-800 cursor-pointer"
              >
                Capital
              </button>
              <button
                onClick={() => {
                  setQuery('SELECT * FROM sales;');
                  handleRunQuery('SELECT * FROM sales;');
                }}
                className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-0.5 rounded text-stone-300 border border-stone-700 cursor-pointer"
              >
                Sales
              </button>
              <button
                onClick={() => {
                  setQuery('SELECT * FROM expense_categories;');
                  handleRunQuery('SELECT * FROM expense_categories;');
                }}
                className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-0.5 rounded text-stone-300 border border-stone-700 cursor-pointer"
              >
                Categories
              </button>
              <button
                onClick={() => {
                  setQuery('SELECT * FROM cash_sources;');
                  handleRunQuery('SELECT * FROM cash_sources;');
                }}
                className="text-[10px] bg-stone-800 hover:bg-stone-700 px-2 py-0.5 rounded text-stone-300 border border-stone-700 cursor-pointer"
              >
                Cash Sources
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunQuery();
              }}
              className="flex-1 bg-[#12141c] border border-stone-700 rounded-lg px-3 py-2 text-stone-100 focus:outline-hidden focus:border-[#06D6A0] font-mono text-xs"
              placeholder="e.g. SELECT * FROM expenses;"
            />
            <button
              onClick={() => handleRunQuery()}
              className="bg-[#06D6A0] hover:bg-[#05b88a] text-stone-950 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute</span>
            </button>
          </div>
        </div>

        {/* Query Results Table */}
        <div className="flex-1 overflow-auto p-4 bg-[#12141c]">
          {result.message && (
            <div className="text-[11px] text-emerald-400 mb-2 font-mono">
              &gt; {result.message}
            </div>
          )}

          {result.columns.length > 0 ? (
            <div className="overflow-x-auto border border-stone-800 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-[#181c26] text-stone-400 border-b border-stone-800 uppercase tracking-wider">
                  <tr>
                    {result.columns.map((col, idx) => (
                      <th key={idx} className="p-2 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-stone-800/40">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 font-mono text-stone-300">
                          {cell === null ? (
                            <span className="text-stone-600 italic">NULL</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500">
              <Table className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Type an SQL query or select a table above and click Execute</p>
              <p className="text-[10px] text-stone-600 mt-1">
                Supported: SELECT * FROM expenses | capital_injections | sales | expense_categories | cash_sources
              </p>
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="bg-[#141720] px-4 py-2.5 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]"></span>
            <span>Local SQLite simulation backed by localStorage</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Reset database to a clean slate with zero dummy data? All transaction tables will be emptied.')) {
                  onResetDb();
                  handleRunQuery('SELECT * FROM sales;');
                }
              }}
              className="text-stone-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Clean Slate (Zero Data)</span>
            </button>
            <span>•</span>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-white px-3 py-1 bg-stone-800 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
