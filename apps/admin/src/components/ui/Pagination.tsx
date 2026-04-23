import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
      <div className="text-xs font-medium text-textSecondary uppercase tracking-widest opacity-70">
        Page {currentPage} of {lastPage}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-border rounded-lg disabled:opacity-30 hover:bg-background transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-2 border border-border rounded-lg disabled:opacity-30 hover:bg-background transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
