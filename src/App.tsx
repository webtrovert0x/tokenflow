import React, { useState } from 'react';
import { Header } from './components/Header';
import { AnalysisForm } from './components/AnalysisForm';
import { FlowReportCard } from './components/FlowReportCard';
import { FlowGraph } from './components/FlowGraph';
import { NodeDetailModal } from './components/NodeDetailModal';
import { ContractActions } from './components/ContractActions';
import { FlowReport, FlowNode, FlowTransfer } from './types/flow';
import { analyzeTokenFlow, ScanProgress } from './services/flowIndexer';
import { Sparkles, Info, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [report, setReport] = useState<FlowReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'contract'>('visual');

  const handleAnalyze = async (params: {
    wallet: string;
    token: string;
    fromBlock: bigint;
    toBlock: bigint;
    requestId?: string;
    txHash?: string;
  }) => {
    setIsLoading(true);
    setScanProgress({
      currentBlock: params.fromBlock,
      totalBlocks: params.toBlock - params.fromBlock + 1n,
      percent: 0,
      transfersFound: 0,
      message: 'Connecting to Botchain Testnet RPC...',
    });

    try {
      const result = await analyzeTokenFlow(
        params.wallet,
        params.token,
        params.fromBlock,
        params.toBlock,
        (prog) => setScanProgress(prog)
      );

      // Attach on-chain request metadata
      setReport({
        ...result,
        onChainRequestId: params.requestId,
        requestTxHash: params.txHash,
      });
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Analysis failed while querying Bohr RPC. Check console for details.');
    } finally {
      setIsLoading(false);
      setScanProgress(null);
    }
  };

  // Demo flow loader matching user prompt example (Incoming 500 BOT, Outgoing 200 BOT, Transfers 18, Unique 9, Largest 150 BOT)
  const handleLoadDemo = () => {
    const demoTarget = '0x1234567890abcdef1234567890abcdef1234abcd';
    const demoTransfers: FlowTransfer[] = [
      {
        hash: '0xaa11223344556677889900112233445566778899001122334455667788990011',
        from: '0xa111111111111111111111111111111111111111',
        to: demoTarget,
        amount: 150000000000000000000n, // 150 BOT
        formattedAmount: '150.0',
        tokenSymbol: 'BOT',
        blockNumber: 124500n,
        isNative: true,
      },
      {
        hash: '0xbb223344556677889900112233445566778899001122334455667788990022',
        from: '0xa222222222222222222222222222222222222222',
        to: demoTarget,
        amount: 100000000000000000000n, // 100 BOT
        formattedAmount: '100.0',
        tokenSymbol: 'BOT',
        blockNumber: 124510n,
        isNative: true,
      },
      {
        hash: '0xcc3344556677889900112233445566778899001122334455667788990033',
        from: demoTarget,
        to: '0xc111111111111111111111111111111111111111', // Contract
        amount: 80000000000000000000n, // 80 BOT
        formattedAmount: '80.0',
        tokenSymbol: 'BOT',
        blockNumber: 124520n,
        isNative: true,
      },
      {
        hash: '0xdd44556677889900112233445566778899001122334455667788990044',
        from: '0xa333333333333333333333333333333333333333',
        to: demoTarget,
        amount: 120000000000000000000n, // 120 BOT
        formattedAmount: '120.0',
        tokenSymbol: 'BOT',
        blockNumber: 124530n,
        isNative: true,
      },
      {
        hash: '0xee556677889900112233445566778899001122334455667788990055',
        from: demoTarget,
        to: '0xc222222222222222222222222222222222222222', // Contract
        amount: 70000000000000000000n, // 70 BOT
        formattedAmount: '70.0',
        tokenSymbol: 'BOT',
        blockNumber: 124540n,
        isNative: true,
      },
      {
        hash: '0xff6677889900112233445566778899001122334455667788990066',
        from: '0xa444444444444444444444444444444444444444',
        to: demoTarget,
        amount: 130000000000000000000n, // 130 BOT
        formattedAmount: '130.0',
        tokenSymbol: 'BOT',
        blockNumber: 124550n,
        isNative: true,
      },
      {
        hash: '0x1177889900112233445566778899001122334455667788990077',
        from: demoTarget,
        to: '0xa555555555555555555555555555555555555555',
        amount: 50000000000000000000n, // 50 BOT
        formattedAmount: '50.0',
        tokenSymbol: 'BOT',
        blockNumber: 124560n,
        isNative: true,
      },
    ];

    // Total Incoming: 150 + 100 + 120 + 130 = 500 BOT
    // Total Outgoing: 80 + 70 + 50 = 200 BOT
    // Total transfers: 18 (represented with 7 visible edges and counterparties)
    const demoNodes: FlowNode[] = [
      {
        id: demoTarget.toLowerCase(),
        address: demoTarget,
        type: 'wallet',
        isTarget: true,
        incomingTotal: 500000000000000000000n,
        outgoingTotal: 200000000000000000000n,
        transferCount: 18,
        label: 'Target (WALLET)',
      },
      {
        id: '0xa111111111111111111111111111111111111111',
        address: '0xa111111111111111111111111111111111111111',
        type: 'wallet',
        isTarget: false,
        incomingTotal: 0n,
        outgoingTotal: 150000000000000000000n,
        transferCount: 3,
        label: 'WALLET',
      },
      {
        id: '0xa222222222222222222222222222222222222222',
        address: '0xa222222222222222222222222222222222222222',
        type: 'wallet',
        isTarget: false,
        incomingTotal: 0n,
        outgoingTotal: 100000000000000000000n,
        transferCount: 2,
        label: 'WALLET',
      },
      {
        id: '0xc111111111111111111111111111111111111111',
        address: '0xc111111111111111111111111111111111111111',
        type: 'contract',
        isTarget: false,
        incomingTotal: 80000000000000000000n,
        outgoingTotal: 0n,
        transferCount: 4,
        label: 'CONTRACT',
      },
      {
        id: '0xa333333333333333333333333333333333333333',
        address: '0xa333333333333333333333333333333333333333',
        type: 'wallet',
        isTarget: false,
        incomingTotal: 0n,
        outgoingTotal: 120000000000000000000n,
        transferCount: 2,
        label: 'WALLET',
      },
      {
        id: '0xc222222222222222222222222222222222222222',
        address: '0xc222222222222222222222222222222222222222',
        type: 'contract',
        isTarget: false,
        incomingTotal: 70000000000000000000n,
        outgoingTotal: 0n,
        transferCount: 3,
        label: 'CONTRACT',
      },
      {
        id: '0xa444444444444444444444444444444444444444',
        address: '0xa444444444444444444444444444444444444444',
        type: 'wallet',
        isTarget: false,
        incomingTotal: 0n,
        outgoingTotal: 130000000000000000000n,
        transferCount: 2,
        label: 'WALLET',
      },
      {
        id: '0xa555555555555555555555555555555555555555',
        address: '0xa555555555555555555555555555555555555555',
        type: 'wallet',
        isTarget: false,
        incomingTotal: 50000000000000000000n,
        outgoingTotal: 0n,
        transferCount: 2,
        label: 'WALLET',
      },
    ];

    setReport({
      targetWallet: demoTarget,
      tokenAddress: '0x0000000000000000000000000000000000000000',
      tokenSymbol: 'BOT',
      fromBlock: 124500n,
      toBlock: 124560n,
      status: 'Complete',
      totalTransfers: 18,
      totalIncoming: 500000000000000000000n,
      formattedIncoming: '500',
      totalOutgoing: 200000000000000000000n,
      formattedOutgoing: '200',
      grossTransferVolume: 700000000000000000000n,
      formattedGrossVolume: '700',
      netBalanceChange: 300000000000000000000n,
      formattedNetChange: '+300',
      uniqueAddressesCount: 9,
      uniqueAddresses: [
        '0xa111111111111111111111111111111111111111',
        '0xa222222222222222222222222222222222222222',
        '0xc111111111111111111111111111111111111111',
        '0xa333333333333333333333333333333333333333',
        '0xc222222222222222222222222222222222222222',
        '0xa444444444444444444444444444444444444444',
        '0xa555555555555555555555555555555555555555',
        '0xa666666666666666666666666666666666666666',
        '0xa777777777777777777777777777777777777777',
      ],
      largestTransfer: {
        amount: 150000000000000000000n,
        formattedAmount: '150',
        hash: '0xaa11223344556677889900112233445566778899001122334455667788990011',
        from: '0xa111111111111111111111111111111111111111',
        to: demoTarget,
        direction: 'incoming',
      },
      frequentInteractions: [
        {
          address: '0xc111111111111111111111111111111111111111',
          type: 'contract',
          incomingCount: 0,
          outgoingCount: 4,
          totalTransfers: 4,
          totalVolume: 80000000000000000000n,
          formattedVolume: '80.0',
          netImpact: -80000000000000000000n,
        },
        {
          address: '0xa111111111111111111111111111111111111111',
          type: 'wallet',
          incomingCount: 3,
          outgoingCount: 0,
          totalTransfers: 3,
          totalVolume: 150000000000000000000n,
          formattedVolume: '150.0',
          netImpact: 150000000000000000000n,
        },
        {
          address: '0xc222222222222222222222222222222222222222',
          type: 'contract',
          incomingCount: 0,
          outgoingCount: 3,
          totalTransfers: 3,
          totalVolume: 70000000000000000000n,
          formattedVolume: '70.0',
          netImpact: -70000000000000000000n,
        },
      ],
      nodes: demoNodes,
      transfers: demoTransfers,
      reportHash: '0x8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Global Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner with Fast Demo Flow Loader */}
        <div className="bg-slate-900 border border-slate-700 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 border border-slate-700 text-blue-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Botchain Testnet Token Movement Statistics & Visual Flow
              </div>
              <p className="text-xs text-slate-400">
                Inspect native BOT and ERC-20 transfers across Bohr RPC blocks with on-chain verification.
              </p>
            </div>
          </div>

          <button
            onClick={handleLoadDemo}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2 font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Example Flow Data</span>
          </button>
        </div>

        {/* Input Parameters Form */}
        <AnalysisForm
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          scanProgress={scanProgress}
        />

        {/* Navigation Tabs (Visual Graph vs On-Chain Contract) */}
        <div className="flex border-b border-slate-700 bg-slate-900">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 ${
              activeTab === 'visual'
                ? 'border-blue-500 text-white bg-slate-800'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            1. Visual Flow Explorer & Report
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 ${
              activeTab === 'contract'
                ? 'border-blue-500 text-white bg-slate-800'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            2. BOTTokenFlow Contract Actions
          </button>
        </div>

        {/* Tab 1: Visual Graph & Report */}
        {activeTab === 'visual' && (
          <div className="space-y-8">
            {/* Visual Flow Explorer Canvas */}
            {report && (
              <FlowGraph
                nodes={report.nodes}
                transfers={report.transfers}
                targetAddress={report.targetWallet}
                onNodeClick={(node) => setSelectedNode(node)}
                selectedNodeId={selectedNode?.id}
              />
            )}

            {/* Token Flow Report Card */}
            <FlowReportCard
              report={report}
              isLoading={isLoading}
              onSelectAddress={(addr) => {
                const node = report?.nodes.find((n) => n.id.toLowerCase() === addr.toLowerCase());
                if (node) setSelectedNode(node);
              }}
            />
          </div>
        )}

        {/* Tab 2: Smart Contract Actions */}
        {activeTab === 'contract' && (
          <ContractActions currentReport={report} />
        )}
      </main>

      {/* Node Activity Inspection Modal */}
      <NodeDetailModal
        node={selectedNode}
        transfers={report?.transfers || []}
        targetAddress={report?.targetWallet || ''}
        onClose={() => setSelectedNode(null)}
        onSetAsTarget={(addr) => {
          if (report) {
            handleAnalyze({
              wallet: addr,
              token: report.tokenAddress,
              fromBlock: report.fromBlock,
              toBlock: report.toBlock,
            });
          }
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>BOT TokenFlow &copy; 2026 &bull; Botchain Testnet (Chain ID 968)</span>
          <div className="flex items-center space-x-4">
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-300 underline"
            >
              Bohr RPC
            </a>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-300 underline"
            >
              BohrScan Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

