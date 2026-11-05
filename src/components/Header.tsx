import React from 'react';
import { Network, Activity, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';

export const Header: React.FC = () => {
  const { isConnected, address } = useAccount();

  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-800 border border-slate-600 flex items-center justify-center text-blue-500 font-bold text-lg">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">BOT TokenFlow</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 border border-slate-700">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Token Movement Statistics & Visual Flow</p>
          </div>
        </div>

        {/* Network & Wallet Controls */}
        <div className="flex items-center space-x-4">
          {/* Botchain Testnet Badge */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-200">Botchain Testnet</span>
            <span className="text-slate-400 font-mono">ID: 968</span>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 ml-1"
              title="Open BohrScan Explorer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Reown AppKit Button */}
          <div className="reown-wallet-button">
            <appkit-button balance="show" />
          </div>
        </div>
      </div>
    </header>
  );
};

