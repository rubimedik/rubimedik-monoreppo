import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function DetailModal({ isOpen, onClose, title, children }: DetailModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-sans transition-colors duration-300"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-textPrimary">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-background rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-textSecondary opacity-50" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 text-textSecondary">
              {children}
            </div>
            <div className="p-6 border-t border-border bg-background flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-background hover:brightness-95 text-textSecondary font-bold rounded-xl transition-colors border border-border"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
