import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Wallet, Clock, ShieldCheck, ExternalLink, ArrowRight, Check } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { decodeEventLog } from 'viem';
import { getLatestBlockNumber } from '../services/flowIndexer';
import { BOT_TOKEN_FLOW_ABI, DEFAULT_CONTRACT_ADDRESS } from '../config/contract';
import { botchainTestnet } from '../config/wagmi';

interface Props {
  onAnalyze: (params: {
    wallet: string;
    token: string;
    fromBlock: bigint;
    toBlock: bigint;
    requestId?: string;
    txHash?: string;
  }) => void;
  isLoading: boolean;
  scanProgress?: { message: string; percent: number } | null;
}

export const AnalysisForm: React.FC<Props> = ({ onAnalyze, isLoading, scanProgress }) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { open } = useAppKit();

  const [targetWallet, setTargetWallet] = useState<string>('0x1234567890abcdef1234567890abcdef1234abcd');
  const [tokenAddress, setTokenAddress] = useState<string>('0x0000000000000000000000000000000000000000');
  const [fromBlock, setFromBlock] = useState<string>('');
  const [toBlock, setToBlock] = useState<string>('');
  const [latestBlock, setLatestBlock] = useState<bigint | null>(null);
  const [isFetchingBlocks, setIsFetchingBlocks] = useState(false);
  const [pendingParams, setPendingParams] = useState<{
    wallet: string;
    token: string;
    fromBlock: bigint;
    toBlock: bigint;
  } | null>(null);

  // Wagmi Contract Interaction: requestFlowAnalysis (Gas fee only, NO platform fee)
  const { data: txHash, isPending: isWritingContract, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isWaitingForTx, isSuccess: isTxConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Sync latest block on mount
  useEffect(() => {
    fetchLatestBlocks();
  }, []);

  // When on-chain tx is confirmed, automatically trigger analysis indexing
  useEffect(() => {
    if (isTxConfirmed && pendingParams && receipt) {
      let extractedRequestId: string | undefined;

      // Extract requestId from FlowAnalysisRequested event log
      for (const log of receipt.logs) {
        try {
          const parsed: any = decodeEventLog({
            abi: BOT_TOKEN_FLOW_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (parsed && parsed.eventName === 'FlowAnalysisRequested') {
            extractedRequestId = parsed.args?.requestId;
            break;
          }
        } catch (e) {
          // not this event
        }
      }

      onAnalyze({
        ...pendingParams,
        requestId: extractedRequestId,
        txHash: receipt.transactionHash,
      });

      setPendingParams(null);
    }
  }, [isTxConfirmed, receipt]);

  const fetchLatestBlocks = async () => {
    setIsFetchingBlocks(true);
    try {
      const latest = await getLatestBlockNumber();
      setLatestBlock(latest);
      if (latest > 0n) {
        setToBlock(latest.toString());
        const defaultFrom = latest > 500n ? latest - 500n : 0n;
        setFromBlock(defaultFrom.toString());
      }
    } catch (err) {
      console.error('Failed to get latest block:', err);
    } finally {
      setIsFetchingBlocks(false);
    }
  };

  const setBlockWindow = (windowSize: number) => {
    if (!latestBlock) return;
    setToBlock(latestBlock.toString());
    const from = latestBlock > BigInt(windowSize) ? latestBlock - BigInt(windowSize) : 0n;
    setFromBlock(from.toString());
  };

  const handleOnChainRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWallet) return;

    if (!isConnected) {
      open();
      return;
    }

    const from = fromBlock ? BigInt(fromBlock) : 0n;
    const to = toBlock ? BigInt(toBlock) : (latestBlock || 0n);

    setPendingParams({
      wallet: targetWallet.trim(),
      token: tokenAddress.trim() || '0x0000000000000000000000000000000000000000',
      fromBlock: from,
      toBlock: to,
    });

    // Call BOTTokenFlow.requestFlowAnalysis on Botchain Testnet (Gas fee only, NO platform fee)
    writeContract({
      address: DEFAULT_CONTRACT_ADDRESS,
      abi: BOT_TOKEN_FLOW_ABI,
      functionName: 'requestFlowAnalysis',
      args: [
        targetWallet.trim() as `0x${string}`,
        (tokenAddress.trim() || '0x0000000000000000000000000000000000000000') as `0x${string}`,
        from,
        to,
      ],
      chain: botchainTestnet,
      account: connectedAddress,
    } as any);
  };

  // Direct scan without new on-chain request if desired
  const handleDirectScan = () => {
    if (!targetWallet) return;
    const from = fromBlock ? BigInt(fromBlock) : 0n;
    const to = toBlock ? BigInt(toBlock) : (latestBlock || 0n);

    onAnalyze({
      wallet: targetWallet.trim(),
      token: tokenAddress.trim() || '0x0000000000000000000000000000000000000000',
      fromBlock: from,
      toBlock: to,
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 space-y-5">
      {/* Contract Banner */}
      <div className="bg-slate-900 border border-slate-700 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">Deployed Contract:</span>
          <span className="font-mono text-slate-300 select-all">{DEFAULT_CONTRACT_ADDRESS}</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-bold uppercase">
            No Platform Fee (Gas Only)
          </span>
          <a
            href={`https://scan.bohr.life/address/${DEFAULT_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
          >
            <span>View on BohrScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between border-b border-slate-700 pb-3 gap-2">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Flow Analysis & Contract Request
          </h2>
          <p className="text-xs text-slate-400">
            Submit request on-chain to <span className="font-mono text-slate-300">BOTTokenFlow.sol</span> using transaction gas only
          </p>
        </div>

        {/* Latest Block Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900 border border-slate-700 px-3 py-1.5 text-slate-300">
          <span className="text-slate-500 font-sans">Latest Block:</span>
          <span className="font-bold text-blue-400">
            {latestBlock ? `#${latestBlock.toString()}` : 'Connecting...'}
          </span>
          <button
            type="button"
            onClick={fetchLatestBlocks}
            disabled={isFetchingBlocks}
            className="text-slate-400 hover:text-white ml-1"
            title="Refresh latest block"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingBlocks ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <form onSubmit={handleOnChainRequest} className="space-y-4">
        {/* Target Wallet Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Target Wallet Address *
            </label>
            {connectedAddress && (
              <button
                type="button"
                onClick={() => setTargetWallet(connectedAddress)}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-mono flex items-center space-x-1"
              >
                <Wallet className="w-3 h-3" />
                <span>Use Connected ({connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)})</span>
              </button>
            )}
          </div>
          <input
            type="text"
            required
            placeholder="0x... (Target wallet to inspect)"
            value={targetWallet}
            onChange={(e) => setTargetWallet(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-600"
          />
        </div>

        {/* Token Address & Asset Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Asset Type
            </label>
            <div className="flex border border-slate-700 bg-slate-900">
              <button
                type="button"
                onClick={() => setTokenAddress('0x0000000000000000000000000000000000000000')}
                className={`flex-1 py-2 text-xs font-medium ${
                  tokenAddress === '0x0000000000000000000000000000000000000000'
                    ? 'bg-blue-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Native BOT Token
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tokenAddress === '0x0000000000000000000000000000000000000000') {
                    setTokenAddress('');
                  }
                }}
                className={`flex-1 py-2 text-xs font-medium border-l border-slate-700 ${
                  tokenAddress !== '0x0000000000000000000000000000000000000000'
                    ? 'bg-blue-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom ERC-20
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Token Contract Address
            </label>
            <input
              type="text"
              placeholder="0x0000... (0x0 for Native BOT)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none px-3.5 py-2 text-sm font-mono text-white placeholder-slate-600"
            />
          </div>
        </div>

        {/* Block Range Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Block Window Range
            </label>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => setBlockWindow(100)}
                className="bg-slate-900 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 text-slate-300"
              >
                100 blocks
              </button>
              <button
                type="button"
                onClick={() => setBlockWindow(500)}
                className="bg-slate-900 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 text-slate-300"
              >
                500 blocks
              </button>
              <button
                type="button"
                onClick={() => setBlockWindow(2000)}
                className="bg-slate-900 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 text-slate-300"
              >
                2,000 blocks
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-slate-400 mb-1">From Block</div>
              <input
                type="number"
                placeholder="0"
                value={fromBlock}
                onChange={(e) => setFromBlock(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none px-3.5 py-2 text-sm font-mono text-white"
              />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 mb-1">To Block</div>
              <input
                type="number"
                placeholder="Latest"
                value={toBlock}
                onChange={(e) => setToBlock(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none px-3.5 py-2 text-sm font-mono text-white"
              />
            </div>
          </div>
        </div>

        {/* Transaction Status Notice */}
        {txHash && (
          <div className="bg-slate-900 border border-slate-700 p-3 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">On-Chain Request Tx:</span>
              <a
                href={`https://scan.bohr.life/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
              >
                <span>{txHash.slice(0, 16)}...{txHash.slice(-8)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center space-x-2">
              {isWaitingForTx && (
                <span className="text-amber-400 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Confirming requestFlowAnalysis on Botchain Testnet...</span>
                </span>
              )}
              {isTxConfirmed && (
                <span className="text-emerald-400 flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Contract request confirmed! Initializing token flow scan...</span>
                </span>
              )}
            </div>
          </div>
        )}

        {writeError && (
          <div className="bg-red-950 border border-red-800 p-3 text-xs text-red-300">
            Transaction error: {writeError.message}
          </div>
        )}

        {/* Scan Progress Bar if active */}
        {isLoading && scanProgress && (
          <div className="bg-slate-900 border border-slate-700 p-3 text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1 font-mono">
              <span>{scanProgress.message}</span>
              <span>{scanProgress.percent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2">
              <div
                className="bg-blue-600 h-2 transition-all duration-300"
                style={{ width: `${scanProgress.percent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          {/* Primary Action: Contract Interaction (Gas only) */}
          <button
            type="submit"
            disabled={isLoading || isWritingContract || isWaitingForTx}
            className="flex-1 min-w-[240px] bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold uppercase tracking-wider py-2.5 px-6 border border-blue-600 flex items-center justify-center space-x-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {!isConnected
                ? 'Connect Wallet to Request'
                : isWritingContract
                ? 'Sign in Wallet...'
                : isWaitingForTx
                ? 'Confirming on Chain...'
                : isLoading
                ? 'Scanning Botchain...'
                : 'Interact with Contract & Analyze (Gas Only)'}
            </span>
          </button>

          {/* Secondary Quick Scan */}
          <button
            type="button"
            onClick={handleDirectScan}
            disabled={isLoading || isWritingContract || isWaitingForTx}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-200 text-xs font-semibold uppercase py-2.5 px-4 border border-slate-600 flex items-center space-x-1.5"
            title="Read-only scan without broadcasting a new on-chain request"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Direct Read-Only Scan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
