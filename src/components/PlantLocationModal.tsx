import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, MapPin, X, Check, RotateCcw, Factory, Layers } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface PlantLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlant: string;
  currentLocation: string;
  onSave: (plant: string, location: string) => void;
}

export const PlantLocationModal: React.FC<PlantLocationModalProps> = ({
  isOpen,
  onClose,
  currentPlant,
  currentLocation,
  onSave,
}) => {
  const { t } = useTranslation();
  const [plant, setPlant] = useState(currentPlant);
  const [location, setLocation] = useState(currentLocation);

  useEffect(() => {
    if (isOpen) {
      setPlant(currentPlant);
      setLocation(currentLocation);
    }
  }, [isOpen, currentPlant, currentLocation]);

  if (!isOpen) return null;

  const plantSuggestions = [
    'Planta 01 - São Paulo (SP)',
    'Planta Betim - MG',
    'Complexo Fabril Joinville - SC',
    'Unidade Automotiva Camaçari - BA',
    'Planta Curitiba - PR',
    'Polo Industrial Manaus - AM',
  ];

  const locationSuggestions = [
    'Linha 01 - Usinagem de Precisão',
    'Pavilhão B - Estamparia & Prensas',
    'Galpão 03 - Solda & Robótica',
    'Célula 04 - Montagem Final',
    'Setor de Laminação & Fornos',
    'Área Central de Utilidades',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlant = plant.trim() || 'Planta Industrial 01 - SP';
    const finalLocation = location.trim() || 'Linha Principal de Produção';
    onSave(finalPlant, finalLocation);
    onClose();
  };

  const handleResetDefaults = () => {
    setPlant('Planta 01 - SP');
    setLocation('Usinagem de Precisão / Linha 01');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
        <motion.div
          key="plant-location-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-5 my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Configurar Planta e Local</span>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30">
                    EDITÁVEL
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personalize livremente a identificação da planta fabril e o local operacional.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Input: Nome da Planta */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Nome da Planta Industrial
                </span>
                <span className="text-[11px] font-normal text-slate-400">Texto livre</span>
              </label>
              <input
                type="text"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                placeholder="Ex: Planta 01 - SP, Complexo Joinville, etc."
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors"
              />

              {/* Quick suggestions chips */}
              <div className="pt-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                  Sugestões Rápidas de Plantas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {plantSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setPlant(sug)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-blue-900/40 text-slate-300 hover:text-blue-200 border border-slate-700/80 hover:border-blue-600/50 transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input: Local / Setor / Linha */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Local / Setor / Pavilhão / Linha
                </span>
                <span className="text-[11px] font-normal text-slate-400">Texto livre</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Setor de Usinagem - Linha 01, Pavilhão A, etc."
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors"
              />

              {/* Quick suggestions chips */}
              <div className="pt-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                  Sugestões Rápidas de Locais:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {locationSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setLocation(sug)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-900/40 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-600/50 transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3.5 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-salvar-planta-local"
                  className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition-colors cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Planta e Local</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
