/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useReceiptScanQuota } from '../lib/receiptScanQuota';
import { ExpenseCategory, CurrencyCode } from '../types';
import { 
  X, 
  Camera, 
  CameraOff, 
  Upload, 
  Sparkles, 
  Check, 
  ScanLine, 
  RotateCcw, 
  RefreshCw, 
  Zap, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface ParsedReceiptData {
  merchant: string;
  total: number;
  category: ExpenseCategory;
  date: string;
  currency: string;
  items: Array<{ name: string; amount: number }>;
  notes?: string;
  engine?: string;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptParsed: (data: ParsedReceiptData) => void;
  openUpgradeModal: () => void;
  defaultCurrency?: CurrencyCode;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onReceiptParsed,
  openUpgradeModal,
  defaultCurrency = 'USD',
}) => {
  const { currentUser, updateSubscriptionTier } = useAuth();
  const { t } = useLanguage();

  const quota = useReceiptScanQuota(currentUser?.id, currentUser?.tier);

  // Camera & Stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Scanning / Parsing states
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedReceiptData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream could not start:', err);
      setCameraError('Camera access unavailable. You can upload an image or test a sample receipt below.');
      setCameraActive(false);
    }
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Manage camera lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen && quota.canScan && !previewImage && !parsedResult) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, quota.canScan, previewImage, parsedResult, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Capture frame from video onto canvas
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !cameraActive) return;

    if (!quota.canScan) {
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    setPreviewImage(dataUrl);
    processReceiptImage(dataUrl);
  };

  // Process uploaded or captured image
  const processReceiptImage = async (imageBase64: string) => {
    if (!quota.canScan) {
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setParsingStep('Capturing high-resolution frame...');

    try {
      setTimeout(() => {
        setParsingStep('Running Google Gemini 3.8 Flash AI parser...');
      }, 500);

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          defaultCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      setParsingStep('Extracting line items and merchant categories...');

      const result: ParsedReceiptData = {
        merchant: data.merchant || 'Scanned Receipt',
        total: typeof data.total === 'number' ? data.total : parseFloat(data.total) || 0,
        category: (data.category as ExpenseCategory) || 'dining',
        date: data.date || new Date().toISOString().split('T')[0],
        currency: data.currency || defaultCurrency,
        items: Array.isArray(data.items) ? data.items : [],
        notes: data.notes || '',
        engine: data.engine || 'gemini-3.8-flash',
      };

      setParsedResult(result);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg('Could not parse receipt image. Please try another photo or pick a sample receipt.');
    } finally {
      setIsParsing(false);
    }
  };

  // Test Sample Preset trigger
  const handleTestPreset = async (presetKey: 'dinner' | 'groceries' | 'travel' | 'coffee') => {
    if (!quota.canScan) {
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setParsingStep(`Loading ${presetKey} sample bill into Gemini AI...`);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          samplePreset: presetKey,
          defaultCurrency,
        }),
      });

      const data = await response.json();

      const result: ParsedReceiptData = {
        merchant: data.merchant,
        total: data.total,
        category: data.category as ExpenseCategory,
        date: data.date,
        currency: data.currency || defaultCurrency,
        items: data.items || [],
        notes: data.notes,
        engine: data.engine || 'teiln-neural-preset',
      };

      setParsedResult(result);
    } catch (err) {
      console.error('Sample preset failed:', err);
      setErrorMsg('Failed to process sample bill.');
    } finally {
      setIsParsing(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!quota.canScan) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCamera();
        setPreviewImage(dataUrl);
        processReceiptImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Confirm and apply parsed receipt
  const handleApply = () => {
    if (!parsedResult) return;

    // Record 1 scan against user's quota
    quota.recordScan();

    // Pass data back to parent expense modal
    onReceiptParsed(parsedResult);
    onClose();
  };

  // Reset and retake photo
  const handleRetake = () => {
    setPreviewImage(null);
    setParsedResult(null);
    setErrorMsg(null);
    startCamera();
  };

  // Toggle front/back camera
  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // 1-Click upgrade handler
  const handleQuickUpgrade = (tier: 'supporter' | 'pro') => {
    updateSubscriptionTier(tier);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative my-6 text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanner-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-20"
          aria-label="Close scanner dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 id="scanner-modal-title" className="text-lg font-display font-bold text-white flex items-center gap-2">
              <span>AI Receipt Scanner</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 font-semibold uppercase tracking-wider">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Capture or upload receipt photos to auto-populate split amounts & line items
            </p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUBSCRIPTION QUOTA STATUS BAR                                   */}
        {/* Free users: 5 scans/month. Supporter/Pro: Unlimited             */}
        {/* ============================================================== */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {quota.isUnlimited ? (
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ScanLine className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-slate-200">
                {quota.isUnlimited ? (
                  <span className="text-amber-300 font-bold">Unlimited Scans Active</span>
                ) : (
                  <span>
                    Monthly Quota: <strong className="text-white">{quota.scansRemaining} of {quota.monthlyLimit}</strong> free scans left
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {quota.isUnlimited 
                  ? `${currentUser?.tier === 'pro' ? 'Annual Pro' : 'Supporter'} tier unlocked`
                  : `${quota.scansUsed}/5 scans used in ${quota.monthName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quota.isUnlimited ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                {currentUser?.tier}
              </span>
            ) : (
              <button
                type="button"
                onClick={openUpgradeModal}
                className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold shadow-sm shadow-amber-500/20 cursor-pointer transition-transform active:scale-95"
              >
                Go Unlimited
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUOTA REACHED PAYWALL / UPGRADE PROMPT                         */}
        {/* ============================================================== */}
        {!quota.canScan && !parsedResult ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-gradient-to-b from-[#181326] to-[#0e1320] border border-amber-500/30 my-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-display font-extrabold text-white">
              Monthly Free Scan Limit Reached
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
              You have used all <strong>5 free receipt scans</strong> for this month ({quota.monthName}). Upgrade to a <strong className="text-emerald-400">Supporter</strong> or <strong className="text-amber-400">Pro</strong> subscription for unlimited AI receipt camera scans and automated line-item itemization!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-left max-w-md mx-auto">
              {/* Supporter Option */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Supporter</span>
                    <span>$9.99</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">3 Months unlimited AI camera scanning & budget limits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickUpgrade('supporter')}
                  className="mt-3 w-full py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Get Supporter ($9.99)
                </button>
              </div>

              {/* Annual Pro Option */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Annual Pro</span>
                    <span>$29.99</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Full year of unlimited AI scanning + itemized split parsing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickUpgrade('pro')}
                  className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Get Annual Pro ($29.99)
                </button>
              </div>
            </div>

            {/* Test Helper: Reset scan count in dev */}
            <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-2">
              <span>Evaluation Mode:</span>
              <button
                type="button"
                onClick={quota.resetScan}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset Scan Count (0/5)
              </button>
            </div>
          </div>
        ) : isParsing ? (
          /* ============================================================ */
          /* PARSING IN PROGRESS VIEW                                      */
          /* ============================================================ */
          <div className="py-12 px-4 text-center rounded-2xl bg-slate-950 border border-slate-800 my-2">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 animate-ping opacity-75" />
              <div className="relative w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                <ScanLine className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <h3 className="text-base font-display font-bold text-white">
              Parsing Receipt with AI...
            </h3>
            <p className="text-xs text-emerald-400 font-medium mt-1.5 animate-pulse">
              {parsingStep || 'Extracting merchant, totals, and line items...'}
            </p>
            <p className="text-[11px] text-slate-500 mt-3 max-w-xs mx-auto">
              Our neural OCR checks merchant names, subtotal sums, sales taxes, and line-item breakdowns.
            </p>
          </div>
        ) : parsedResult ? (
          /* ============================================================ */
          /* PARSED RESULT REVIEW VIEW                                    */
          /* ============================================================ */
          <div className="space-y-4 my-2">
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3 h-3" /> Extracted Successfully
                  </span>
                  <h3 className="text-xl font-display font-extrabold text-white">
                    {parsedResult.merchant}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{parsedResult.date}</span>
                    <span>•</span>
                    <span className="capitalize px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                      {parsedResult.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400">Calculated Total</span>
                  <div className="text-2xl font-display font-black text-emerald-400">
                    {parsedResult.currency === 'EUR' ? '€' : parsedResult.currency === 'GBP' ? '£' : '$'}
                    {parsedResult.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Line items breakdown */}
              {parsedResult.items.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                    <span>Itemized Line Items ({parsedResult.items.length})</span>
                    <span className="text-slate-500 font-mono text-[10px]">auto-parsed</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {parsedResult.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/60 border border-slate-850">
                        <span className="text-slate-300 truncate pr-2">{item.name}</span>
                        <span className="font-mono text-emerald-300 font-semibold shrink-0">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedResult.notes && (
                <p className="mt-3 text-[11px] text-slate-400 italic">
                  Note: {parsedResult.notes}
                </p>
              )}
            </div>

            {/* Actions: Apply or Retake */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake / Scan Another</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-2 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Auto-Fill This Expense</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* CAMERA VIEWFINDER & CAPTURE CONTROLS                          */
          /* ============================================================ */
          <div className="space-y-3">
            {/* Viewfinder Container */}
            <div className="relative rounded-2xl bg-black border border-slate-800 overflow-hidden aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Scanning Reticle & Corner Brackets Overlay */}
                  <div className="absolute inset-6 pointer-events-none border-2 border-emerald-400/40 rounded-xl flex flex-col justify-between p-2">
                    {/* Glowing Top Corners */}
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                      <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                    </div>

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse my-auto" />

                    {/* Glowing Bottom Corners */}
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                      <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                    </div>
                  </div>

                  {/* Camera Controls inside overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-colors cursor-pointer"
                      title="Flip camera"
                      aria-label="Flip camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Guidance caption */}
                  <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                    <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                      Align receipt within frame & tap Shutter
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CameraOff className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Camera Offline</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {cameraError || 'Allow camera permissions to capture receipts live with your lens.'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer"
                  >
                    Try Camera Again
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Shutter & File Upload Action Bar */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {/* File upload from device */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                title="Upload receipt photo from library"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Choose Photo</span>
              </button>

              {/* Primary Shutter Button */}
              <div className="flex items-center justify-center flex-1">
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  disabled={!cameraActive}
                  className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-90 transition-all cursor-pointer"
                  aria-label="Capture receipt snapshot"
                >
                  <div className="w-13 h-13 rounded-full border-2 border-slate-950 flex items-center justify-center">
                    <Camera className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </button>
              </div>

              {/* Sample Presets Quick Menu */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTestPreset('dinner')}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 cursor-pointer"
                  title="Try sample dinner bill"
                >
                  🍽️ Sample Bill
                </button>
              </div>
            </div>

            {/* Test Sample Quick Chips */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider block mb-2">
                Instant Test Receipts (No camera needed):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleTestPreset('dinner')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left text-xs transition-colors cursor-pointer"
                >
                  <span className="block font-semibold text-white truncate">🍝 Osteria Del Sole</span>
                  <span className="text-[10px] text-emerald-400 font-mono">$165.80 (Dining)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestPreset('groceries')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left text-xs transition-colors cursor-pointer"
                >
                  <span className="block font-semibold text-white truncate">🛒 Organic Market</span>
                  <span className="text-[10px] text-emerald-400 font-mono">$54.00 (Groceries)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestPreset('travel')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left text-xs transition-colors cursor-pointer"
                >
                  <span className="block font-semibold text-white truncate">⛷️ Alpine Lodge</span>
                  <span className="text-[10px] text-emerald-400 font-mono">$360.00 (Travel)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestPreset('coffee')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-left text-xs transition-colors cursor-pointer"
                >
                  <span className="block font-semibold text-white truncate">☕ Blue Bottle</span>
                  <span className="text-[10px] text-emerald-400 font-mono">$14.75 (Dining)</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
