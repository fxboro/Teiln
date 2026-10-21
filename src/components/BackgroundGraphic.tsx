/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Minimalist, elegant vector background graphic for Teiln.
 * Restored to the previous clean topological aesthetic with a gentle,
 * refined increase in visibility so balance curves and nodal pathways
 * are discernable while remaining subtle and non-distracting.
 */
export const BackgroundGraphic: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 1. Deep Ambient Chromatic Glows (Soft atmospheric depth) */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[480px] rounded-full blur-[140px] opacity-55 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent pointer-events-none" 
      />
      <div 
        className="absolute top-[28%] -left-36 w-[550px] h-[550px] rounded-full blur-[160px] opacity-35 bg-emerald-600/15 pointer-events-none" 
      />
      <div 
        className="absolute top-[45%] -right-36 w-[600px] h-[600px] rounded-full blur-[170px] opacity-30 bg-teal-500/15 pointer-events-none" 
      />

      {/* 2. SVG Vector Graphic: Minimalist Contours, Coordinate Grid & Nodal Ledger Waves */}
      <svg
        className="absolute inset-0 w-full h-full text-slate-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* Radial mask that softly transitions toward the edges */}
          <radialGradient id="teiln-fade-mask" cx="50%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
          </radialGradient>

          <mask id="radial-mask">
            <rect width="1440" height="900" fill="url(#teiln-fade-mask)" />
          </mask>

          {/* Micro dot matrix pattern (slight visibility increase from 0.05 to 0.10) */}
          <pattern
            id="teiln-dot-grid"
            x="0"
            y="0"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.05" fill="#94a3b8" fillOpacity="0.10" />
          </pattern>

          {/* Precision Crosshair Marker */}
          <pattern
            id="teiln-cross-grid"
            x="0"
            y="0"
            width="288"
            height="288"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 140 144 L 148 144 M 144 140 L 144 148"
              stroke="#10b981"
              strokeWidth="0.95"
              strokeOpacity="0.20"
            />
          </pattern>

          {/* Linear stroke gradients for topological balance curves */}
          <linearGradient id="curve-emerald-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.02" />
            <stop offset="25%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#14b8a6" stopOpacity="0.26" />
            <stop offset="80%" stopColor="#34d399" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="curve-teal-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.01" />
            <stop offset="20%" stopColor="#06b6d4" stopOpacity="0.16" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.20" />
            <stop offset="85%" stopColor="#10b981" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
          </linearGradient>

          <linearGradient id="curve-slate-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#64748b" stopOpacity="0.01" />
            <stop offset="30%" stopColor="#94a3b8" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.01" />
          </linearGradient>

          <linearGradient id="nodal-ray-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* 2A. Micro Dot Matrix Pattern Layer */}
        <rect
          width="1440"
          height="900"
          fill="url(#teiln-dot-grid)"
          mask="url(#radial-mask)"
        />

        {/* 2B. Micro Crosshair Coordinate Markers */}
        <rect
          width="1440"
          height="900"
          fill="url(#teiln-cross-grid)"
          mask="url(#radial-mask)"
        />

        {/* 2C. Vector Topological Balance Contours (Muted, organic financial curves) */}
        <g mask="url(#radial-mask)">
          {/* Primary Balance Horizon Curve */}
          <path
            d="M -60 210 C 260 140, 520 340, 880 200 C 1120 110, 1340 180, 1500 230"
            stroke="url(#curve-emerald-1)"
            strokeWidth="1.35"
            strokeLinecap="round"
          />

          {/* Secondary Counter-Flow Curve */}
          <path
            d="M -80 340 C 240 460, 620 220, 1020 380 C 1220 460, 1380 410, 1520 370"
            stroke="url(#curve-teal-2)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />

          {/* Third Harmonic (Lightly dashed, indicating peer-to-peer distribution) */}
          <path
            d="M -40 170 C 340 280, 760 130, 1160 250 C 1320 300, 1440 280, 1520 260"
            stroke="url(#curve-slate-3)"
            strokeWidth="1.1"
            strokeDasharray="5 9"
            strokeLinecap="round"
          />

          {/* Fourth Subtle Low Arc */}
          <path
            d="M -60 490 C 310 390, 740 550, 1140 450 C 1310 410, 1440 450, 1520 470"
            stroke="url(#curve-emerald-1)"
            strokeWidth="1.1"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />

          {/* Nodal Connection Rays (Suggesting peer expense settling) */}
          <line
            x1="440"
            y1="230"
            x2="590"
            y2="310"
            stroke="url(#nodal-ray-grad)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <line
            x1="880"
            y1="200"
            x2="1020"
            y2="380"
            stroke="url(#nodal-ray-grad)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <line
            x1="240"
            y1="460"
            x2="340"
            y2="280"
            stroke="url(#nodal-ray-grad)"
            strokeWidth="0.9"
            strokeDasharray="3 5"
          />

          {/* Discrete Financial Nodal Points (Key hubs in the network) */}
          {/* Node 1: Primary Hub */}
          <g transform="translate(440, 230)">
            <circle r="6.5" fill="#10b981" fillOpacity="0.08" />
            <circle r="2.8" fill="#34d399" fillOpacity="0.55" />
            <circle r="1" fill="#ffffff" fillOpacity="0.9" />
          </g>

          {/* Node 2: Settled Junction */}
          <g transform="translate(880, 200)">
            <circle r="7.5" fill="#14b8a6" fillOpacity="0.08" />
            <circle r="2.8" fill="#2dd4bf" fillOpacity="0.6" />
            <circle r="1" fill="#ffffff" fillOpacity="0.9" />
          </g>

          {/* Node 3: Group Member Hub */}
          <g transform="translate(1020, 380)">
            <circle r="5.5" fill="#10b981" fillOpacity="0.08" />
            <circle r="2.2" fill="#34d399" fillOpacity="0.5" />
          </g>

          {/* Node 4: Secondary Anchor */}
          <g transform="translate(590, 310)">
            <circle r="6" fill="#06b6d4" fillOpacity="0.07" />
            <circle r="2.2" fill="#22d3ee" fillOpacity="0.5" />
          </g>

          {/* Minimalist ledger architectural corners (Technical craft indicators) */}
          <g transform="translate(110, 110)" stroke="#10b981" strokeWidth="0.85" strokeOpacity="0.22">
            <path d="M 0 12 L 0 0 L 12 0" />
            <text x="16" y="8" fill="#64748b" fillOpacity="0.45" fontSize="8" fontFamily="monospace">LEDGER.SYS</text>
          </g>
          
          <g transform="translate(1320, 110)" stroke="#10b981" strokeWidth="0.85" strokeOpacity="0.22">
            <path d="M 12 12 L 12 0 L 0 0" />
            <text x="-48" y="8" fill="#64748b" fillOpacity="0.45" fontSize="8" fontFamily="monospace">TX.SYNC</text>
          </g>

          <g transform="translate(110, 810)" stroke="#10b981" strokeWidth="0.85" strokeOpacity="0.18">
            <path d="M 0 0 L 0 12 L 12 12" />
          </g>

          <g transform="translate(1320, 810)" stroke="#10b981" strokeWidth="0.85" strokeOpacity="0.18">
            <path d="M 12 0 L 12 12 L 0 12" />
          </g>
        </g>
      </svg>
    </div>
  );
};
