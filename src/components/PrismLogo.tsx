import React from 'react';

export const PrismLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="prismGrad" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="coreGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Outer Shield Hexagon */}
    <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
          stroke="url(#prismGrad)" 
          strokeWidth="6" 
          fill="#020617" 
          filter="url(#glow)"
          strokeLinejoin="round" />
          
    {/* Inner Prism facets */}
    <path d="M50 5 L50 50 L90 25" stroke="url(#prismGrad)" strokeWidth="3" opacity="0.6" strokeLinejoin="round" />
    <path d="M50 5 L50 50 L10 25" stroke="url(#prismGrad)" strokeWidth="3" opacity="0.6" strokeLinejoin="round" />
    <path d="M10 75 L50 50 L90 75" stroke="url(#prismGrad)" strokeWidth="3" opacity="0.6" strokeLinejoin="round" />
    <path d="M50 95 L50 50" stroke="url(#prismGrad)" strokeWidth="3" opacity="0.6" strokeLinejoin="round" />
    
    {/* Core Element */}
    <circle cx="50" cy="50" r="10" fill="url(#coreGrad)" filter="url(#glow)" />
    <circle cx="50" cy="50" r="4" fill="#ffffff" opacity="0.8"/>
  </svg>
);
