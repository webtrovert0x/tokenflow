import React, { useState } from 'react';
import { FlowReport } from '../types/flow';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  Users,
  Trophy,
  Layers,
  ExternalLink,
  CheckCircle,
  Clock,
  ShieldCheck,
  UploadCloud,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BOT_TOKEN_FLOW_ABI, DEFAULT_CONTRACT_ADDRESS } from '../config/contract';
import { botchainTestnet } from '../config/wagmi';

interface Props {
  report: FlowReport | null;
  isLoading: boolean;
  onSelectAddress?: (address: string) => void;
  onReportUpdated?: (updated: FlowReport) => void;
}

export const FlowReportCard: React.FC<Props> = ({ report, isLoading, onSelectAddress, onReportUpdated }) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [customRequestId, setCustomRequestId] = useState<string>('');

  // Wagmi publishResult
  const { data: publishTxHash, isPending: isPublishing, writeContract: writePublish, error: publishError } = useWriteContract();
  const { isLoading: isWaitingPublish, isSuccess: isPublishConfirmed } = useWaitForTransactionReceipt({
    hash: publishTxHash,
  });

  const activeRequestId = report?.onChainRequestId || customRequestId;

  const handlePublishOnChain = () => {
    if (!report || !activeRequestId || !connectedAddress) return;

    writePublish({
      address: DEFAULT_CONTRACT_ADDRESS,
      abi: BOT_TOKEN_FLOW_ABI,
      functionName: 'publishResult',
      args: [
        activeRequestId as `0x${string}`,
        report.reportHash as `0x${string}`,
      ],
      chain: botchainTestnet,
      account: connectedAddress,
    } as any);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-6 text-slate-300">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-5 h-5 text-blue-400 animate-spin" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Analyzing Botchain Flow...</h2>
        </div>
        <p className="text-sm text-slate-400 mb-2">Scanning blocks and indexing transfer movements from Bohr RPC...</p>
        <div className="w-full bg-slate-900 border border-slate-700 h-2 overflow-hidden">
          <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-8 text-center text-slate-400">
        <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300 mb-1">No Flow Report Generated</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Enter a target address above and click <span className="text-slate-300 font-medium">"Interact with Contract & Analyze"</span> to record the request on Botchain Testnet and scan for token movements.
        </p>
      </div>
    );
  }

  const shortTarget = `${report.targetWallet.slice(0, 6)}...${report.targetWallet.slice(-4)}`;

  return (
    <div className="space-y-6">
      {/* Primary Expected Result Report Card */}
      <div className="bg-slate-800 border-2 border-slate-600 p-6 shadow-none">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-700 pb-4 mb-4 gap-2">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Official Summary</h2>
            <h1 className="text-2xl font-black text-white tracking-wider">TOKEN FLOW REPORT</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 font-mono text-slate-300">
              Token: {report.tokenSymbol}
            </span>
            <span className="flex items-center space-x-1.5 text-xs bg-emerald-950 text-emerald-400 border border-emerald-700 px-3 py-1 font-semibold uppercase">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Status: {report.status}</span>
            </span>
          </div>
        </div>

        {/* Target Wallet Banner & On-Chain Proof */}
        <div className="bg-slate-900 border border-slate-700 p-3.5 mb-6 space-y-2 font-mono text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-xs uppercase font-sans">Wallet:</span>
              <span className="text-white font-bold">{shortTarget}</span>
              <span className="text-xs text-slate-500 hidden md:inline">({report.targetWallet})</span>
            </div>
            <a
              href={`https://scan.bohr.life/address/${report.targetWallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              <span>View Target on BohrScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* On-Chain Request ID Link */}
          {report.onChainRequestId && (
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400 font-sans font-bold uppercase text-[11px]">On-Chain Request ID:</span>
                <span className="text-slate-200 select-all font-mono">{report.onChainRequestId}</span>
              </div>
              {report.requestTxHash && (
                <a
                  href={`https://scan.bohr.life/tx/${report.requestTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-1 font-sans text-[11px]"
                >
                  <span>Request Tx ({report.requestTxHash.slice(0, 10)}...)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* 6 Key Core Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Incoming */}
          <div className="bg-slate-900 border border-slate-700 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider mb-1 font-medium">
              <span>Incoming</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {report.formattedIncoming} <span className="text-sm text-slate-400">{report.tokenSymbol}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Total incoming transfer value</p>
          </div>

          {/* Outgoing */}
          <div className="bg-slate-900 border border-slate-700 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider mb-1 font-medium">
              <span>Outgoing</span>
              <ArrowUpRight className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-400 font-mono">
              {report.formattedOutgoing} <span className="text-sm text-slate-400">{report.tokenSymbol}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Total outgoing transfer value</p>
          </div>

          {/* Transfers Count */}
          <div className="bg-slate-900 border border-slate-700 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider mb-1 font-medium">
              <span>Transfers</span>
              <Hash className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {report.totalTransfers}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total indexed transactions</p>
          </div>

          {/* Unique Addresses */}
          <div className="bg-slate-900 border border-slate-700 p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider mb-1 font-medium">
              <span>Unique Addresses</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {report.uniqueAddressesCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Distinct counterparties</p>
          </div>

          {/* Largest Transfer */}
          <div className="bg-slate-900 border border-slate-700 p-4 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider mb-1 font-medium">
              <span>Largest Transfer</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {report.largestTransfer ? report.largestTransfer.formattedAmount : '0'}{' '}
                <span className="text-sm text-slate-400">{report.tokenSymbol}</span>
              </div>
              {report.largestTransfer && (
                <div className="text-xs font-mono text-slate-400 flex items-center space-x-2">
                  <span className={`px-2 py-0.5 border ${
                    report.largestTransfer.direction === 'incoming' 
                      ? 'border-emerald-800 bg-emerald-950 text-emerald-300' 
                      : 'border-red-800 bg-red-950 text-red-300'
                  }`}>
                    {report.largestTransfer.direction.toUpperCase()}
                  </span>
                  <a
                    href={`https://scan.bohr.life/tx/${report.largestTransfer.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-0.5"
                  >
                    <span>Tx {report.largestTransfer.hash.slice(0, 10)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Peak single transfer recorded in selected block window</p>
          </div>
        </div>

        {/* Gross Transfer Volume vs Net Balance Change Breakdown */}
        <div className="bg-slate-900 border border-slate-700 p-4 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Volume & Net Balance Distinction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-800 p-3 bg-slate-950">
              <span className="text-xs text-slate-400 uppercase block font-medium">Gross Transfer Volume</span>
              <span className="text-xl font-bold text-white font-mono mt-1 block">
                {report.formattedGrossVolume} {report.tokenSymbol}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Total aggregate flow regardless of direction (Incoming + Outgoing)
              </span>
            </div>

            <div className="border border-slate-800 p-3 bg-slate-950">
              <span className="text-xs text-slate-400 uppercase block font-medium">Net Balance Change</span>
              <span className={`text-xl font-bold font-mono mt-1 block ${
                report.netBalanceChange >= 0n ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {report.formattedNetChange} {report.tokenSymbol}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Effective wallet balance delta over inspected blocks (Incoming - Outgoing)
              </span>
            </div>
          </div>
        </div>

        {/* Publish Result to Contract Section (Gas fee only, NO platform fee) */}
        <div className="bg-slate-900 border border-slate-700 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Publish Verified Result to BOTTokenFlow Contract
              </h3>
            </div>
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 uppercase font-mono">
              Gas Fee Only &bull; Zero Platform Fee
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 border border-slate-800">
              <span className="text-slate-400 font-sans">Report Hash:</span>
              <span className="text-emerald-400 select-all font-bold">{report.reportHash}</span>
            </div>

            {!report.onChainRequestId && (
              <div>
                <label className="text-[11px] font-sans text-slate-400 block mb-1">
                  Specify Request ID to publish for:
                </label>
                <input
                  type="text"
                  placeholder="0x... (bytes32 requestId)"
                  value={customRequestId}
                  onChange={(e) => setCustomRequestId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 text-xs font-mono text-white placeholder-slate-600"
                />
              </div>
            )}

            {publishTxHash && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Publish Tx:</span>
                <a
                  href={`https://scan.bohr.life/tx/${publishTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
                >
                  <span>{publishTxHash.slice(0, 16)}...</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {isPublishConfirmed && <span className="text-emerald-400 flex items-center space-x-1"><Check className="w-3 h-3" /><span>Confirmed!</span></span>}
              </div>
            )}

            {publishError && (
              <div className="p-2 text-xs text-red-400 bg-red-950 border border-red-900">
                {publishError.message}
              </div>
            )}

            <button
              onClick={handlePublishOnChain}
              disabled={!isConnected || !activeRequestId || isPublishing || isWaitingPublish}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold uppercase tracking-wider py-2 px-5 text-xs border border-emerald-600 flex items-center justify-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {!isConnected
                  ? 'Connect Wallet to Publish'
                  : isPublishing
                  ? 'Sign in Wallet...'
                  : isWaitingPublish
                  ? 'Confirming on Botchain...'
                  : isPublishConfirmed
                  ? 'Published Successfully!'
                  : 'Publish Result Hash on Botchain (Gas Only)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Interacting Counterparties Table */}
      <div className="bg-slate-800 border border-slate-700 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center justify-between">
          <span>Most Frequently Interacting Addresses</span>
          <span className="text-xs font-normal text-slate-400">Ranked by total transfer count</span>
        </h3>

        {report.frequentInteractions.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">No counterparty interactions found in the specified range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-700 uppercase">
                <tr>
                  <th className="p-2.5">Address</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-center">Transfers</th>
                  <th className="p-2.5 text-right">In / Out</th>
                  <th className="p-2.5 text-right">Volume</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {report.frequentInteractions.slice(0, 10).map((item, idx) => (
                  <tr key={item.address} className="hover:bg-slate-700/40">
                    <td className="p-2.5 text-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-sans">{idx + 1}.</span>
                        <span>{item.address.slice(0, 8)}...{item.address.slice(-6)}</span>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 text-[10px] font-sans font-bold uppercase border ${
                        item.type === 'contract' 
                          ? 'border-amber-700 bg-amber-950 text-amber-300' 
                          : 'border-slate-600 bg-slate-900 text-slate-300'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold text-white">
                      {item.totalTransfers}
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="text-emerald-400">+{item.incomingCount}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-red-400">-{item.outgoingCount}</span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-200">
                      {item.formattedVolume} {report.tokenSymbol}
                    </td>
                    <td className="p-2.5 text-center font-sans">
                      <button
                        onClick={() => onSelectAddress && onSelectAddress(item.address)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 border border-slate-600 font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
