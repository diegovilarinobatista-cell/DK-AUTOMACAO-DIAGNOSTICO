import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { Cpu, PlusCircle, Menu, X, LogOut, RotateCcw, Database, Volume2, VolumeX, Factory, MapPin, Pencil } from 'lucide-react';
import { alarmAudioService } from '../services/alarmAudioService';

interface NavbarProps {
  onNewDiagnostic: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onResetData: () => void;
  onLoadDemoData: () => void;
  isDataZeroed: boolean;
  currentPlant: string;
  currentLocation: string;
  onOpenPlantLocation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewDiagnostic,
  activeTab,
  setActiveTab,
  onLogout,
  onResetData,
  onLoadDemoData,
  isDataZeroed,
  currentPlant,
  currentLocation,
  onOpenPlantLocation,
}) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isAudioMuted, setIsAudioMuted] = React.useState(() => alarmAudioService.isMuted());
  const [isAlarmPlaying, setIsAlarmPlaying] = React.useState(() => alarmAudioService.isAlarmPlaying());

  React.useEffect(() => {
    const unsub = alarmAudioService.subscribe((playing) => {
      setIsAlarmPlaying(playing);
      setIsAudioMuted(alarmAudioService.isMuted());
    });
    return () => unsub();
  }, []);

  const navItems = [
    { id: 'dashboard', label: t('tabDashboard') },
    { id: 'agendador', label: t('tabScheduler') },
    { id: 'novo-diagnostico', label: t('tabNewDiagnostic'), isAction: true },
    { id: 'maquinas', label: t('tabMachines') },
    { id: 'falhas', label: t('tabFailures') },
    { id: 'relatorios', label: t('tabReports') },
    { id: 'tpm', label: t('tabTpm') },
    { id: 'rca', label: t('tabRca') },
    { id: 'base-tecnica', label: t('tabTechBase') },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      {/* Top Banner - Status da Planta Industrial & Language Selector */}
      <div className="bg-slate-950 px-4 py-1 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('systemOnline')}
          </span>
          <span className="hidden sm:inline-block text-slate-600">|</span>
          <span className="hidden sm:flex items-center gap-1 font-mono text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
            {t('aiReady')}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Zerar Todos os Dados - Always Accessible */}
          <button
            onClick={onResetData}
            id="btn-zerar-dados"
            title={t('resetData')}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/90 hover:border-rose-500 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>{t('resetData')}</span>
          </button>

          {/* Carregar Dados de Exemplo */}
          <button
            onClick={onLoadDemoData}
            id="btn-carregar-exemplo"
            title={t('loadDemo')}
            className="bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">{t('loadDemo')}</span>
          </button>

          {/* Alarm Audio Toggle / Status */}
          <button
            onClick={() => alarmAudioService.toggleMute()}
            title={isAudioMuted ? t('criticalAlarmUnmuteBtn') : t('criticalAlarmMuteBtn')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
              isAlarmPlaying && !isAudioMuted
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                : isAudioMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
            }`}
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="w-3 h-3 text-rose-400" />
                <span className="hidden md:inline">{t('criticalAlarmAudioMuted')}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">{t('criticalAlarmSoundToggle')}</span>
              </>
            )}
          </button>

          {/* Editable Plant & Location Identifier */}
          <button
            type="button"
            onClick={onOpenPlantLocation}
            id="btn-editar-planta-local"
            title="Clique para editar a Planta e o Local"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-blue-500 transition-colors cursor-pointer group shadow-sm active:scale-95"
          >
            <Factory className="w-3 h-3 text-blue-400 group-hover:text-blue-300 shrink-0" />
            <span className="font-semibold text-slate-200">{currentPlant}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <MapPin className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300 shrink-0 hidden sm:inline" />
            <span className="text-slate-300 hidden md:inline truncate max-w-[150px]">{currentLocation}</span>
            <Pencil className="w-2.5 h-2.5 text-slate-500 group-hover:text-amber-400 ml-0.5 shrink-0" />
          </button>

          {/* Language Selector in top bar */}
          <LanguageSelector variant="compact" />

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title={t('logout')}
            className="flex items-center gap-1 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Slogan */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-slate-900 border border-blue-400/40 flex items-center justify-center shadow-lg shadow-blue-900/30">
              <span className="text-xl font-black tracking-tighter text-white">DK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider text-white">{t('brandName')}</span>
                <span className="bg-blue-600/30 border border-blue-500/50 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {t('brandSubtitle')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-tight">
                {t('slogan')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isAction) {
                    onNewDiagnostic();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`relative px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  item.isAction
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-700/30 flex items-center gap-1.5 ml-2'
                    : activeTab === item.id
                    ? 'text-blue-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {!item.isAction && activeTab === item.id && (
                  <motion.span
                    layoutId="navbarActivePill"
                    className="absolute inset-0 rounded-lg bg-slate-800 border border-slate-700 z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {item.isAction && <PlusCircle className="w-3.5 h-3.5" />}
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          {/* Mobile / Tablet CTA & Menu Trigger */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              onClick={onNewDiagnostic}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/40 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('tabNewDiagnostic')}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 shadow-2xl overflow-hidden"
          >
            <p className="text-[11px] text-slate-400 px-3 pb-2 border-b border-slate-800 mb-2">
              {t('brandName')}: &ldquo;{t('slogan')}&rdquo;
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item.isAction) {
                    onNewDiagnostic();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                  item.isAction
                    ? 'bg-blue-600 text-white'
                    : activeTab === item.id
                    ? 'bg-slate-800 text-blue-400 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
                {item.isAction && <PlusCircle className="w-4 h-4" />}
              </button>
            ))}

            {/* Mobile Data Management & Plant Configuration */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPlantLocation();
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Factory className="w-4 h-4 text-blue-400" />
                <span>Editar Planta ({currentPlant})</span>
              </button>

              <button
                type="button"
                id="btn-zerar-dados-mobile"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onResetData();
                }}
                className="w-full bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>{t('resetData')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoadDemoData();
                }}
                className="w-full bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-700/60 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>{t('loadDemo')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
