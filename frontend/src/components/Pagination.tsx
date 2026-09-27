import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, limit, onChange }: Props) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btn = 'px-3 py-1.5 rounded-lg text-sm border transition-colors';
  const active = `${btn} bg-brand-600 text-white border-brand-600`;
  const inactive = `${btn} border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-600`;
  const disabled = `${btn} border-slate-200 text-slate-300 cursor-not-allowed`;

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-xs text-slate-400">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} z {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={page === 1 ? disabled : inactive}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1 text-slate-400">…</span>
            : <button key={p} onClick={() => onChange(p as number)} className={p === page ? active : inactive}>{p}</button>
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={page === totalPages ? disabled : inactive}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
