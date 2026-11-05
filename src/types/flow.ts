export type NodeType = 'wallet' | 'contract';

export interface FlowNode {
  id: string; // address lowercased
  address: string;
  type: NodeType;
  isTarget: boolean;
  incomingTotal: bigint;
  outgoingTotal: bigint;
  transferCount: number;
  label?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface FlowTransfer {
  hash: string;
  from: string;
  to: string;
  amount: bigint;
  formattedAmount: string;
  tokenSymbol: string;
  blockNumber: bigint;
  timestamp?: number;
  isNative: boolean;
}

export interface AddressInteractionSummary {
  address: string;
  type: NodeType;
  incomingCount: number;
  outgoingCount: number;
  totalTransfers: number;
  totalVolume: bigint;
  formattedVolume: string;
  netImpact: bigint; // positive = paid to target, negative = received from target
}

export interface FlowReport {
  targetWallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  fromBlock: bigint;
  toBlock: bigint;
  status: 'Idle' | 'Scanning' | 'Complete' | 'Failed';
  
  // Required Report Metrics
  totalTransfers: number;
  totalIncoming: bigint;
  formattedIncoming: string;
  totalOutgoing: bigint;
  formattedOutgoing: string;
  grossTransferVolume: bigint;
  formattedGrossVolume: string;
  netBalanceChange: bigint;
  formattedNetChange: string;
  
  uniqueAddressesCount: number;
  uniqueAddresses: string[];
  
  largestTransfer: {
    amount: bigint;
    formattedAmount: string;
    hash: string;
    from: string;
    to: string;
    direction: 'incoming' | 'outgoing' | 'none';
  } | null;
  
  frequentInteractions: AddressInteractionSummary[];
  
  nodes: FlowNode[];
  transfers: FlowTransfer[];
  reportHash: `0x${string}`;
  onChainRequestId?: string;
  requestTxHash?: string;
  publishedTxHash?: string;
}

