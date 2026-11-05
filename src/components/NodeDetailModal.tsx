import React from 'react';
import { FlowNode, FlowTransfer } from '../types/flow';
import { X, ExternalLink, ArrowDownLeft, ArrowUpRight, Wallet, FileCode } from 'lucide-react';

interface Props {
  node: FlowNode | null;
  transfers: FlowTransfer[];
  targetAddress: string;
  onClose: () => void;
  onSetAsTarget?: (address: string) => void;
}

export const NodeDetailModal: React.FC<Props> = ({
  node,
  transfers,
  targetAddress,
  onClose,
  onSetAsTarget,
}) => {
  if (!node) return null;

  const isTarget = node.isTarget;
  const isContract = node.type === 'contract';

  // Filter transfers involving this node
  const nodeTransfers = transfers.filter(
    (t) => t.from.toLowerCase() === node.id.toLowerCase() || t.to.toLowerCase() === node.id.toLowerCase()
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-none">
        {/* Modal Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 border ${
              isContract 
                ? 'border-amber-600 bg-amber-950 text-amber-400' 
                : 'border-blue-600 bg-blue-950 text-blue-400'
            }`}>
              {isContract ? <FileCode className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Node Activity Inspection
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                  isContract 
                    ? 'border-amber-700 bg-amber-950 text-amber-300' 
                    : 'border-slate-600 bg-slate-800 text-slate-300'
                }`}>
                  {node.type}
                </span>
                {isTarget && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 border border-emerald-700 bg-emerald-950 text-emerald-300">
                    Current Target
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono select-all mt-0.5">{node.address}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 border border-transparent hover:border-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Node Summary Stats */}
        <div className="p-5 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 font-mono text-xs">
          <div className="border border-slate-800 p-2.5">
            <span className="text-slate-500 uppercase block font-sans text-[10px]">Total Transfers</span>
            <span className="text-base font-bold text-white mt-0.5 block">{nodeTransfers.length}</span>
          </div>

          <div className="border border-slate-800 p-2.5">
            <span className="text-slate-500 uppercase block font-sans text-[10px]">Classification</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 block uppercase font-sans">
              {node.type === 'contract' ? 'Smart Contract' : 'EOA Wallet'}
            </span>
          </div>

          <div className="border border-slate-800 p-2.5 sm:col-span-1 col-span-2 flex items-center justify-between">
            <div>
              <span className="text-slate-500 uppercase block font-sans text-[10px]">BohrScan</span>
              <a
                href={`https://scan.bohr.life/address/${node.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center space-x-1 mt-0.5"
              >
                <span>View Address</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {!isTarget && onSetAsTarget && (
              <button
                onClick={() => {
                  onSetAsTarget(node.address);
                  onClose();
                }}
                className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2.5 py-1.5 border border-blue-600 font-sans font-medium"
              >
                Set as Target
              </button>
            )}
          </div>
        </div>

        {/* Transfer Ledger */}
        <div className="flex-1 overflow-y-auto p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Transfer Ledger Involving This Node ({nodeTransfers.length})
          </h4>

          {nodeTransfers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center border border-slate-800">
              No direct transfers indexed for this address in current range.
            </p>
          ) : (
            <div className="space-y-2">
              {nodeTransfers.map((tx, i) => {
                const isIncoming = tx.to.toLowerCase() === node.id.toLowerCase();
                return (
                  <div
                    key={`${tx.hash}-${i}`}
                    className="bg-slate-950 border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 border ${
                        isIncoming 
                          ? 'border-emerald-800 bg-emerald-950 text-emerald-400' 
                          : 'border-red-800 bg-red-950 text-red-400'
                      }`}>
                        {isIncoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {tx.formattedAmount} {tx.tokenSymbol}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isIncoming ? `From: ${tx.from.slice(0, 10)}...` : `To: ${tx.to.slice(0, 10)}...`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <a
                        href={`https://scan.bohr.life/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
                      >
                        <span>Tx {tx.hash.slice(0, 8)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-[10px] text-slate-500">Block #{tx.blockNumber.toString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-800 border-t border-slate-700 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

