import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BOT_TOKEN_FLOW_ABI, DEFAULT_CONTRACT_ADDRESS } from '../config/contract';
import { botchainTestnet } from '../config/wagmi';
import { FlowReport } from '../types/flow';
import { ShieldCheck, UploadCloud, Search, ExternalLink, Check, AlertCircle, Clock } from 'lucide-react';

interface Props {
  currentReport: FlowReport | null;
}

export const ContractActions: React.FC<Props> = ({ currentReport }) => {
  const { isConnected, address } = useAccount();
  const [contractAddress, setContractAddress] = useState<string>(
    DEFAULT_CONTRACT_ADDRESS || ''
  );
  const [requestIdInput, setRequestIdInput] = useState<string>('');
  const [publishRequestId, setPublishRequestId] = useState<string>('');
  const [reportHashInput, setReportHashInput] = useState<string>(
    currentReport?.reportHash || ''
  );

  // Wagmi Contract Write
  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Wagmi Contract Read for getRequest
  const { data: requestData, refetch: refetchRequest, isLoading: isReadingRequest } = useReadContract({
    address: (contractAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: BOT_TOKEN_FLOW_ABI,
    functionName: 'getRequest',
    args: requestIdInput.startsWith('0x') && requestIdInput.length === 66 ? [requestIdInput as `0x${string}`] : undefined,
    query: {
      enabled: false,
    },
  });

  const handleRequestOnChain = () => {
    if (!contractAddress || !currentReport || !address) return;
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: BOT_TOKEN_FLOW_ABI,
      functionName: 'requestFlowAnalysis',
      args: [
        currentReport.targetWallet as `0x${string}`,
        currentReport.tokenAddress as `0x${string}`,
        currentReport.fromBlock,
        currentReport.toBlock,
      ],
      chain: botchainTestnet,
      account: address,
    } as any);
  };

  const handlePublishResult = () => {
    if (!contractAddress || !publishRequestId || !reportHashInput || !address) return;
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: BOT_TOKEN_FLOW_ABI,
      functionName: 'publishResult',
      args: [
        publishRequestId as `0x${string}`,
        reportHashInput as `0x${string}`,
      ],
      chain: botchainTestnet,
      account: address,
    } as any);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-700 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Smart Contract Interaction (BOTTokenFlow.sol)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit analysis requests, publish verified report hashes, and inspect on-chain records
          </p>
        </div>

        {/* Contract Address Input */}
        <div className="w-full sm:w-auto">
          <div className="text-[11px] text-slate-400 mb-1 font-mono">Contract Address:</div>
          <input
            type="text"
            placeholder="0x... (Deployed BOTTokenFlow)"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="w-full sm:w-80 bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none px-3 py-1.5 text-xs font-mono text-white"
          />
        </div>
      </div>

      {/* Contract Transaction Status Notice */}
      {hash && (
        <div className="bg-slate-900 border border-slate-700 p-3 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Transaction Sent:</span>
            <a
              href={`https://scan.bohr.life/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
            >
              <span>{hash.slice(0, 14)}...{hash.slice(-8)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="mt-1 flex items-center space-x-2">
            {isConfirming && <span className="text-amber-400 flex items-center space-x-1"><Clock className="w-3.5 h-3.5 animate-spin" /><span>Confirming on Botchain...</span></span>}
            {isConfirmed && <span className="text-emerald-400 flex items-center space-x-1"><Check className="w-3.5 h-3.5" /><span>Confirmed on Botchain Testnet!</span></span>}
          </div>
        </div>
      )}

      {writeError && (
        <div className="bg-red-950 border border-red-800 p-3 text-xs text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{writeError.message}</span>
        </div>
      )}

      {/* 3 Main Contract Functions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Function 1: requestFlowAnalysis */}
        <div className="bg-slate-900 border border-slate-700 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-blue-400 tracking-wider mb-1 font-mono">
              1. requestFlowAnalysis()
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Logs a formal analysis request on-chain with wallet, token, and block boundaries.
            </p>
            {currentReport && (
              <div className="bg-slate-950 border border-slate-800 p-2.5 text-[11px] font-mono text-slate-300 space-y-1 mb-3">
                <div className="truncate">Wallet: {currentReport.targetWallet}</div>
                <div>Blocks: {currentReport.fromBlock.toString()} - {currentReport.toBlock.toString()}</div>
              </div>
            )}
          </div>

          <button
            onClick={handleRequestOnChain}
            disabled={!isConnected || !contractAddress || !currentReport || isPending || isConfirming}
            className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold uppercase py-2 px-3 border border-blue-600"
          >
            {!isConnected
              ? 'Connect Wallet First'
              : !currentReport
              ? 'Run Analysis Above'
              : isPending || isConfirming
              ? 'Broadcasting...'
              : 'Submit On-Chain Request'}
          </button>
        </div>

        {/* Function 2: publishResult */}
        <div className="bg-slate-900 border border-slate-700 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-1 font-mono">
              2. publishResult()
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Records the verifiable report hash on-chain for a given requestId.
            </p>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                placeholder="bytes32 requestId (0x...)"
                value={publishRequestId}
                onChange={(e) => setPublishRequestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-[11px] font-mono p-2 text-white placeholder-slate-600"
              />
              <input
                type="text"
                placeholder="bytes32 reportHash (0x...)"
                value={reportHashInput}
                onChange={(e) => setReportHashInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-[11px] font-mono p-2 text-white placeholder-slate-600"
              />
            </div>
          </div>

          <button
            onClick={handlePublishResult}
            disabled={!isConnected || !contractAddress || !publishRequestId || !reportHashInput || isPending || isConfirming}
            className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold uppercase py-2 px-3 border border-emerald-600 flex items-center justify-center space-x-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Publish Report Hash</span>
          </button>
        </div>

        {/* Function 3: getRequest */}
        <div className="bg-slate-900 border border-slate-700 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-purple-400 tracking-wider mb-1 font-mono">
              3. getRequest()
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Lookup any previously registered flow request by its requestId.
            </p>
            <div className="mb-3">
              <input
                type="text"
                placeholder="bytes32 requestId to lookup"
                value={requestIdInput}
                onChange={(e) => setRequestIdInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-[11px] font-mono p-2 text-white placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => refetchRequest()}
              disabled={!contractAddress || !requestIdInput}
              className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold uppercase py-2 px-3 border border-slate-600 flex items-center justify-center space-x-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isReadingRequest ? 'Fetching...' : 'Query Request'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Query Result Card */}
      {requestData && (
        <div className="bg-slate-950 border border-slate-700 p-4 text-xs font-mono space-y-2">
          <div className="text-slate-400 uppercase font-sans font-bold flex items-center justify-between">
            <span>On-Chain Request Data</span>
            <span className={(requestData as any).isPublished ? 'text-emerald-400' : 'text-amber-400'}>
              {(requestData as any).isPublished ? 'PUBLISHED' : 'PENDING'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div>Requester: <span className="text-white select-all">{(requestData as any).requester}</span></div>
            <div>Wallet: <span className="text-white select-all">{(requestData as any).wallet}</span></div>
            <div>Token: <span className="text-white select-all">{(requestData as any).token}</span></div>
            <div>Blocks: {((requestData as any).fromBlock || 0n).toString()} to {((requestData as any).toBlock || 0n).toString()}</div>
            <div className="sm:col-span-2">Report Hash: <span className="text-emerald-300 select-all">{(requestData as any).reportHash}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
