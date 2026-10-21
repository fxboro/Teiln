/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { 
  ArrowRight, 
  Check, 
  Sparkles, 
  Share2, 
  Receipt, 
  PieChart, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  MessageSquare,
  Repeat,
  Flag,
  UserPlus,
  BarChart3,
  Camera,
  Minus,
  ChevronDown,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Coins,
  Bell
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  openUpgradeModal: () => void;
  openSupabaseModal: () => void;
}

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
  liftAmount?: number;
  onClick?: () => void;
}

/**
 * Interactive card with smooth scroll entrance and dynamic cursor spotlight & lift
 */
const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(52, 211, 153, 0.15)',
  delay = 0,
  liftAmount = -8,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.97 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      whileHover={shouldReduceMotion ? undefined : { y: liftAmount, transition: { duration: 0.28, ease: 'easeOut' } }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(420px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 75%)`,
        }}
      />
      {children}
    </motion.div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  openUpgradeModal,
  openSupabaseModal,
}) => {
  const { t } = useLanguage();
  const [simplifiedMode, setSimplifiedMode] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'free' | 'paid'>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const features = [
    {
      id: 'split',
      icon: Receipt,
      titleKey: 'feat.splitTitle',
      descKey: 'feat.splitDesc',
      category: 'free' as const,
      isNew: false,
      badgeText: '100% FREE',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      freeAllowance: 'Unlimited custom, equal & itemized splits',
      paidAllowance: 'Included in all plans',
      glowColor: 'rgba(52, 211, 153, 0.16)',
      borderColor: 'border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
    {
      id: 'recurring',
      icon: Repeat,
      titleKey: 'feat.recurringTitle',
      descKey: 'feat.recurringDesc',
      category: 'both' as const,
      isNew: true,
      badgeText: 'NEW RELEASE',
      badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/35',
      freeAllowance: 'Up to 3 active recurring schedules per group',
      paidAllowance: 'Unlimited recurring schedules & instant auto-triggers',
      glowColor: 'rgba(20, 184, 166, 0.18)',
      borderColor: 'border-slate-800 hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-950/20',
      iconBg: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    },
    {
      id: 'guest',
      icon: UserPlus,
      titleKey: 'feat.guestTitle',
      descKey: 'feat.guestDesc',
      category: 'free' as const,
      isNew: true,
      badgeText: 'NEW · ZERO SIGNUP',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/35',
      freeAllowance: 'Unlimited magic invite links for any friend',
      paidAllowance: 'Included in all plans',
      glowColor: 'rgba(168, 85, 247, 0.18)',
      borderColor: 'border-slate-800 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20',
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    },
    {
      id: 'diary',
      icon: Flag,
      titleKey: 'feat.diaryTitle',
      descKey: 'feat.diaryDesc',
      category: 'free' as const,
      isNew: true,
      badgeText: 'NEW · FREE FOREVER',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/35',
      freeAllowance: 'Full chronological itinerary day timeline',
      paidAllowance: 'Included in all plans',
      glowColor: 'rgba(56, 189, 248, 0.18)',
      borderColor: 'border-slate-800 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-950/20',
      iconBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    },
    {
      id: 'budget_dash',
      icon: BarChart3,
      titleKey: 'feat.budgetDashTitle',
      descKey: 'feat.budgetDashDesc',
      category: 'paid' as const,
      isNew: true,
      badgeText: 'NEW · SUPPORTER & PRO',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
      freeAllowance: 'Basic group spending totals',
      paidAllowance: 'Interactive monthly visualizer & variance chart',
      glowColor: 'rgba(52, 211, 153, 0.18)',
      borderColor: 'border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
    {
      id: 'ocr',
      icon: Camera,
      titleKey: 'analytics.smartOcr',
      descKey: 'feat.analyticsDesc',
      category: 'both' as const,
      isNew: true,
      badgeText: 'AI OCR · 5 FREE/MO',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/35',
      freeAllowance: '5 free AI camera receipt scans per month',
      paidAllowance: 'Unlimited AI camera scans & line item extraction',
      glowColor: 'rgba(251, 191, 36, 0.18)',
      borderColor: 'border-slate-800 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-950/20',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    },
    {
      id: 'chat',
      icon: MessageSquare,
      titleKey: 'feat.chatTitle',
      descKey: 'feat.chatDesc',
      category: 'free' as const,
      isNew: false,
      badgeText: '100% FREE',
      badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      freeAllowance: 'Real-time discussion board & emoji reactions',
      paidAllowance: 'Included in all plans',
      glowColor: 'rgba(45, 212, 191, 0.16)',
      borderColor: 'border-slate-800 hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-950/20',
      iconBg: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    },
    {
      id: 'export',
      icon: FileText,
      titleKey: 'feat.exportTitle',
      descKey: 'feat.exportDesc',
      category: 'paid' as const,
      isNew: false,
      badgeText: 'SUPPORTER & PRO',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      freeAllowance: 'In-app real-time history & balance view',
      paidAllowance: 'Full CSV & JSON spreadsheet exports',
      glowColor: 'rgba(251, 191, 36, 0.16)',
      borderColor: 'border-slate-800 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-950/20',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    },
    {
      id: 'analytics',
      icon: PieChart,
      titleKey: 'feat.analyticsTitle',
      descKey: 'analytics.desc',
      category: 'paid' as const,
      isNew: false,
      badgeText: 'PRO EXCLUSIVE',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/35',
      freeAllowance: 'Overview category list',
      paidAllowance: 'Deep velocity analytics, category charts & contributor rank',
      glowColor: 'rgba(192, 132, 252, 0.18)',
      borderColor: 'border-slate-800 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20',
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    },
    {
      id: 'push_notifications',
      icon: Bell,
      titleKey: 'notif.title',
      descKey: 'notif.pushDesc',
      category: 'free' as const,
      isNew: true,
      badgeText: 'NEW · 100% FREE',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
      freeAllowance: 'Instant browser push alerts for expenses & settlement requests',
      paidAllowance: 'Included for all users with custom sound chimes',
      glowColor: 'rgba(52, 211, 153, 0.18)',
      borderColor: 'border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
  ];

  const filteredFeatures = features.filter((feat) => {
    if (activeFilter === 'new') return feat.isNew;
    if (activeFilter === 'free') return feat.category === 'free' || feat.category === 'both';
    if (activeFilter === 'paid') return feat.category === 'paid' || feat.category === 'both';
    return true;
  });

  return (
    <div className="min-h-screen pb-24 md:pb-16 text-slate-100">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{t('hero.badge')}</span>
          </motion.div>

          <motion.h1 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto"
          >
            {t('hero.title1')} <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              {t('hero.title2')}
            </span>
          </motion.h1>

          <motion.p 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            {t('hero.desc')}
          </motion.p>

          <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto"
          >
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-emerald-400/30"
            >
              <span>{t('hero.ctaLaunch')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={openUpgradeModal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer hover:border-slate-600"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t('hero.ctaPricing')}</span>
            </button>
          </motion.div>

          {/* Trust Markers */}
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400"
          >
            <span className="flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t('hero.trustRls')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-slate-200 transition-colors">{t('hero.trustMath')}</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-slate-200 transition-colors">{t('hero.trustChat')}</span>
          </motion.div>
        </div>
      </section>

      {/* Interactive Debt Simplification Sandbox */}
      <section className="py-14 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto mb-8"
          >
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              {t('sandbox.badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
              {t('sandbox.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {t('sandbox.desc')}
            </p>
          </motion.div>

          {/* Sandbox Main Container Card with Spotlight */}
          <SpotlightCard
            glowColor="rgba(52, 211, 153, 0.12)"
            liftAmount={-4}
            className="p-5 sm:p-7 rounded-3xl bg-[#0e1320] border border-slate-800 shadow-2xl hover:border-slate-700/80 hover:shadow-emerald-950/20"
          >
            {/* Mode Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-6 border-b border-slate-800">
              <div>
                <p className="text-xs text-slate-400">{t('sandbox.example')}</p>
                <p className="text-sm font-semibold text-white">{t('sandbox.exampleSub')}</p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSimplifiedMode(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    !simplifiedMode ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('sandbox.rawTrans')}
                </button>
                <button
                  onClick={() => setSimplifiedMode(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    simplifiedMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('sandbox.simplified')}
                </button>
              </div>
            </div>

            {/* Visual Settlement Graph with Dynamic Mode Animations */}
            <div className="pt-6 min-h-[140px] flex items-center">
              <AnimatePresence mode="wait">
                {simplifiedMode ? (
                  <motion.div
                    key="simplified"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -12 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-400/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 cursor-default group/card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 group-hover/card:scale-110 transition-transform">
                        S
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover/card:text-emerald-300 transition-colors">
                          Sam Chen → Alex Rivera
                        </p>
                        <p className="text-xs text-emerald-400/90">{t('sandbox.settlesAll')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-display font-extrabold text-emerald-400 tabular-nums group-hover/card:scale-105 transition-transform">
                        $60.00
                      </span>
                      <span className="text-xs text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/80">
                        {t('sandbox.settled100')}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="raw"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -12 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5"
                  >
                    <motion.div 
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-4 transition-colors cursor-default shadow-sm hover:shadow-rose-950/30"
                    >
                      <p className="text-xs text-slate-400 font-mono">#1</p>
                      <p className="text-sm font-medium text-slate-200 mt-1">Clara owes Alex</p>
                      <p className="text-xl font-bold text-rose-400 mt-2 tabular-nums">$20.00</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-4 transition-colors cursor-default shadow-sm hover:shadow-rose-950/30"
                    >
                      <p className="text-xs text-slate-400 font-mono">#2</p>
                      <p className="text-sm font-medium text-slate-200 mt-1">Sam owes Alex</p>
                      <p className="text-xl font-bold text-rose-400 mt-2 tabular-nums">$40.00</p>
                    </motion.div>

                    <motion.div 
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-4 transition-colors cursor-default shadow-sm hover:shadow-rose-950/30"
                    >
                      <p className="text-xs text-slate-400 font-mono">#3</p>
                      <p className="text-sm font-medium text-slate-200 mt-1">Sam owes Clara</p>
                      <p className="text-xl font-bold text-rose-400 mt-2 tabular-nums">$20.00</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/60">
              <span>{simplifiedMode ? t('sandbox.eliminated') : t('sandbox.warningTrans')}</span>
              <button
                onClick={onGetStarted}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer transition-colors hover:underline"
              >
                {t('sandbox.tryLive')} &rarr;
              </button>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* What's New in TEILN APP - Spotlight Showcase */}
      <section className="py-16 sm:py-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-slate-950/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('feat.newBannerBadge')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
              {t('feat.newBannerTitle')}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-2.5 max-w-2xl mx-auto leading-relaxed">
              {t('feat.newBannerSub')}
            </p>
          </motion.div>

          {/* 4 Spotlight New Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* 1. Automated Recurring Expenses */}
            <SpotlightCard
              delay={0}
              liftAmount={-6}
              glowColor="rgba(20, 184, 166, 0.22)"
              className="p-5 rounded-2xl bg-[#0c121e] border border-teal-500/30 hover:border-teal-400/60 shadow-lg hover:shadow-teal-950/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    JUST ADDED
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Automated Recurring Bills
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Monthly rent, Wi-Fi, or streaming subscriptions trigger splits automatically on schedule without manual logging.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium">Free: Up to 3</span>
                <span className="text-teal-300 font-semibold">Pro: Unlimited</span>
              </div>
            </SpotlightCard>

            {/* 2. 1-Click Magic Guest Links */}
            <SpotlightCard
              delay={0.08}
              liftAmount={-6}
              glowColor="rgba(168, 85, 247, 0.22)"
              className="p-5 rounded-2xl bg-[#0c121e] border border-purple-500/30 hover:border-purple-400/60 shadow-lg hover:shadow-purple-950/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    ZERO FRICTION
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  1-Click Guest Magic Links
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Friends join instantly via link on desktop or mobile. No passwords, app downloads, or signup forms required.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium">100% Free for all</span>
                <span className="text-purple-300 font-medium">Instant Join</span>
              </div>
            </SpotlightCard>

            {/* 3. Event Financial Diary & Milestones */}
            <SpotlightCard
              delay={0.16}
              liftAmount={-6}
              glowColor="rgba(56, 189, 248, 0.22)"
              className="p-5 rounded-2xl bg-[#0c121e] border border-sky-500/30 hover:border-sky-400/60 shadow-lg hover:shadow-sky-950/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                    <Flag className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    ITINERARY
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Event Financial Diary
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Organize vacations chronologically by itinerary day (Day 1: Arrival, Day 2: Cabin) with custom emoji badges.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium">100% Free Forever</span>
                <span className="text-sky-300 font-medium">Timeline View</span>
              </div>
            </SpotlightCard>

            {/* 4. Interactive Monthly Budget Visualizer */}
            <SpotlightCard
              delay={0.24}
              liftAmount={-6}
              glowColor="rgba(52, 211, 153, 0.22)"
              className="p-5 rounded-2xl bg-[#0c121e] border border-emerald-500/30 hover:border-emerald-400/60 shadow-lg hover:shadow-emerald-950/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ANALYTICS
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Monthly Budget Visualizer
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Compare group spending against your monthly spending ceilings with responsive visual charts & burn-rate alerts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Basic Totals Free</span>
                <span className="text-emerald-400 font-semibold">Supporter & Pro</span>
              </div>
            </SpotlightCard>

          </div>
        </div>
      </section>

      {/* Feature Highlights Grid with Category Filter Tabs */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-8 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
            {t('feat.heading')}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            {t('feat.sub')}
          </p>

          {/* Interactive Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('feat.filterAll')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('new')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'new'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('feat.filterNew')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('free')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'free'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('feat.filterFree')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'paid'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('feat.filterPaid')}
            </button>
          </div>
        </motion.div>

        {/* Feature Cards Grid with Dynamic Spotlight Animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredFeatures.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <SpotlightCard
                key={feat.id}
                delay={idx * 0.06}
                glowColor={feat.glowColor}
                liftAmount={-8}
                className={`p-6 rounded-3xl bg-[#0e1320] border ${feat.borderColor} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${feat.iconBg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border shadow-sm ${feat.badgeClass}`}>
                      {feat.badgeText}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-300 transition-colors">
                    {t(feat.titleKey)}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    {t(feat.descKey)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="flex items-start justify-between text-slate-400">
                    <span className="text-slate-500 font-medium">Free Tier:</span>
                    <span className="text-slate-300 text-right">{feat.freeAllowance}</span>
                  </div>
                  <div className="flex items-start justify-between text-slate-400">
                    <span className="text-emerald-500/80 font-medium">Paid Tier:</span>
                    <span className="text-emerald-300 text-right font-medium">{feat.paidAllowance}</span>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* Subscription Tiers Summary on Landing Page */}
      <section className="py-16 sm:py-24 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-3">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transparent & Fair</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
              {t('price.heading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2.5 max-w-xl mx-auto leading-relaxed">
              {t('price.sub')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Free Tier Card */}
            <SpotlightCard
              delay={0}
              liftAmount={-8}
              glowColor="rgba(148, 163, 184, 0.14)"
              className="p-6 sm:p-7 rounded-3xl bg-[#0e1320] border border-slate-800 hover:border-slate-700 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('price.freeTitle')}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-semibold">
                    FOREVER $0
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-display font-extrabold text-white">$0</span>
                  <span className="text-xs text-slate-400">/ forever</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{t('price.freeDesc')}</p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited groups, members & friends</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Smart debt simplification engine</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-teal-300">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Up to 3 Automated recurring bills / group</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-sky-300">
                    <Check className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Event Financial Diary (day milestones)</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-purple-300">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>1-Click Guest Mode & Magic Links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time in-group chat & reactions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-currency support (USD, EUR, GBP...)</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <Check className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>5 AI Receipt OCR camera scans / mo</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <Check className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Zero advertisements & private data</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="mt-8 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs transition-colors cursor-pointer active:scale-95"
              >
                {t('price.startFree')}
              </button>
            </SpotlightCard>

            {/* Supporter Tier Card (Elevated Popular Card) */}
            <SpotlightCard
              delay={0.1}
              liftAmount={-12}
              glowColor="rgba(52, 211, 153, 0.22)"
              className="p-6 sm:p-7 rounded-3xl bg-[#0e1320] border-2 border-emerald-500/50 hover:border-emerald-400 relative flex flex-col justify-between shadow-2xl shadow-emerald-950/30 scale-[1.02]"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px] tracking-wide uppercase shadow-md shadow-emerald-500/25">
                {t('price.popular')}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('price.supporterTitle')}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                    $3.33 / MO
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-display font-extrabold text-white">$9.99</span>
                  <span className="text-xs text-slate-400">/ 3 months</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{t('price.supporterDesc')}</p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Everything in Free Tier included</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-teal-300">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Unlimited Automated Recurring Bills</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Interactive Monthly Budget Visualizer</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Group Budget Limit Ceiling & alerts</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Export to CSV & JSON format</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-teal-300">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Unlimited AI Camera Receipt Scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Supporter Profile Badge & priority icon</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={openUpgradeModal}
                className="mt-8 w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                {t('price.donateSupporter')}
              </button>
            </SpotlightCard>

            {/* Annual Pro Tier Card */}
            <SpotlightCard
              delay={0.2}
              liftAmount={-8}
              glowColor="rgba(251, 191, 36, 0.22)"
              className="p-6 sm:p-7 rounded-3xl bg-[#0e1320] border border-amber-500/40 hover:border-amber-400/80 flex flex-col justify-between shadow-xl hover:shadow-amber-950/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">{t('price.proTitle')}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 font-bold">
                    BEST VALUE · 25% OFF
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-display font-extrabold text-white">$29.99</span>
                  <span className="text-xs text-slate-400">/ full year</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{t('price.proDesc')}</p>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Everything in Supporter Tier included</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Advanced Visual Financial Analytics</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-amber-300">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Smart Itemized Bill Receipt Breakdown</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Spending velocity & category charts</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Top contributors intelligence breakdown</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Annual Pro Gold Profile Badge</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Priority feature requests & early access</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={openUpgradeModal}
                className="mt-8 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-semibold text-xs shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                {t('price.subscribePro')}
              </button>
            </SpotlightCard>

          </div>

          {/* Categorized Feature Comparison Matrix */}
          <div className="mt-16 sm:mt-20 pt-12 border-t border-slate-800/80">
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
                {t('feat.matrixTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                {t('feat.matrixSub')}
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0e1320] shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70">
                    <th className="py-4 px-4 sm:px-6 font-semibold text-slate-200">
                      Capability & Feature
                    </th>
                    <th className="py-4 px-3 sm:px-4 font-semibold text-slate-300 text-center w-28 sm:w-36">
                      Free ($0)
                    </th>
                    <th className="py-4 px-3 sm:px-4 font-semibold text-emerald-400 text-center w-28 sm:w-36 bg-emerald-500/5">
                      Supporter ($9.99)
                    </th>
                    <th className="py-4 px-3 sm:px-4 font-semibold text-amber-400 text-center w-28 sm:w-36 bg-amber-500/5">
                      Annual Pro ($29.99)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/80 text-slate-300">

                  {/* Section 1: Core Splitting */}
                  <tr className="bg-slate-950/90 font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                    <td colSpan={4} className="py-2.5 px-4 sm:px-6 bg-slate-900/40 text-emerald-400">
                      Core Splitting & Math Engine
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Unlimited Friends & Groups
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-200">Unlimited</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300 bg-emerald-500/5">Unlimited</td>
                    <td className="py-3.5 px-3 text-center text-amber-300 bg-amber-500/5">Unlimited</td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Debt Simplification Graph Engine
                    </td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Equal, Exact Dollar & Custom Weight Splits
                    </td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Multi-Currency Support (USD, EUR, GBP, JPY...)
                    </td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  {/* Section 2: New Automation & Collaboration */}
                  <tr className="bg-slate-950/90 font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                    <td colSpan={4} className="py-2.5 px-4 sm:px-6 bg-slate-900/40 text-teal-400">
                      New Automation & Collaboration (✨ Recently Shipped)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white flex items-center gap-1.5">
                      <span>Automated Recurring Expenses (Rent, WiFi, Subs)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">NEW</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-teal-300 font-medium">Up to 3 / group</td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-300 font-semibold">Unlimited</td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5 text-amber-300 font-semibold">Unlimited</td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white flex items-center gap-1.5">
                      <span>Event Financial Diary & Day Milestones</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">NEW</span>
                    </td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white flex items-center gap-1.5">
                      <span>1-Click Guest Mode & Magic Invite Links</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">NEW</span>
                    </td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      In-Group Chat Board & Live Emoji Reactions
                    </td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  {/* Section 3: Budgeting & Analytics */}
                  <tr className="bg-slate-950/90 font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                    <td colSpan={4} className="py-2.5 px-4 sm:px-6 bg-slate-900/40 text-emerald-400">
                      Budgeting & Visual Analytics
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Group Budget Ceiling & Burn-Rate Warning
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white flex items-center gap-1.5">
                      <span>Interactive Monthly Budget Visualizer (Recharts)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">NEW</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Advanced Velocity & Category Allocation Analytics
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center text-slate-600 bg-emerald-500/5"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Top Contributors Intelligence Breakdown
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center text-slate-600 bg-emerald-500/5"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  {/* Section 4: Smart Automation & Exports */}
                  <tr className="bg-slate-950/90 font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                    <td colSpan={4} className="py-2.5 px-4 sm:px-6 bg-slate-900/40 text-amber-400">
                      Smart Automation & Data Exports
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white flex items-center gap-1.5">
                      <span>Smart AI Camera Receipt OCR</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">AI</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-300">5 scans / mo</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300 font-semibold bg-emerald-500/5">Unlimited</td>
                    <td className="py-3.5 px-3 text-center text-amber-300 font-semibold bg-amber-500/5">Unlimited</td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Itemized Bill Line-Item Extraction & Splitting
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center text-slate-600 bg-emerald-500/5"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Clean CSV & JSON Spreadsheets Data Export
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600"><Minus className="w-3.5 h-3.5 mx-auto opacity-40" /></td>
                    <td className="py-3.5 px-3 text-center bg-emerald-500/5"><Check className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center bg-amber-500/5"><Check className="w-4 h-4 text-amber-400 mx-auto" /></td>
                  </tr>

                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                      Supporter / Pro Profile Status Badge
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-500">Free</td>
                    <td className="py-3.5 px-3 text-center text-emerald-300 font-semibold bg-emerald-500/5">Supporter</td>
                    <td className="py-3.5 px-3 text-center text-amber-300 font-semibold bg-amber-500/5">Gold Pro</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Free vs Paid FAQ Accordion */}
          <div className="mt-16 sm:mt-20 pt-12 border-t border-slate-800/80">
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-semibold mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                <span>{t('price.faqTitle')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
                {t('price.faqSub')}
              </h3>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {[
                { q: t('price.faq1Q'), a: t('price.faq1A') },
                { q: t('price.faq2Q'), a: t('price.faq2A') },
                { q: t('price.faq3Q'), a: t('price.faq3A') },
                { q: t('price.faq4Q'), a: t('price.faq4A') },
              ].map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800/90 bg-[#0c121e] overflow-hidden transition-colors hover:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-sm font-semibold text-white font-display">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-emerald-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-850">
                        <p className="mt-2.5">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 text-center text-xs text-slate-400 border-t border-slate-800/80">
        <p className="font-display font-semibold text-slate-300 text-sm">Teiln</p>
        <p className="mt-1">Collaborative Expense Tracking & Debt Simplification</p>
        <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
          <button onClick={openSupabaseModal} className="hover:text-slate-200 cursor-pointer transition-colors">
            Supabase Schema DDL
          </button>
          <span>·</span>
          <button onClick={openUpgradeModal} className="hover:text-slate-200 cursor-pointer transition-colors">
            Subscription Options
          </button>
          <span>·</span>
          <LanguageToggle showIcon={false} />
        </div>
      </footer>

    </div>
  );
};

