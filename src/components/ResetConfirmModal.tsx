import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, AlertTriangle, X, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
        <motion.div
          key="reset-confirm-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5 my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t('resetData')}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja zerar <b>todos os dados cadastrados</b> (máquinas, falhas, diagnósticos e cronograma)?
            </p>
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Esta ação apagará as informações salvas no dispositivo e deixará a aplicação 100% zerada para novos registros de campo.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors border border-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-confirmar-zerar-dados"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/40 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Confirmar e Zerar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
