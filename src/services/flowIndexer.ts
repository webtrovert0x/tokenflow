import { createPublicClient, http, formatEther, parseAbiItem, keccak256, stringToBytes } from 'viem';
import { botchainTestnet } from '../config/wagmi';
import { FlowNode, FlowTransfer, FlowReport, AddressInteractionSummary } from '../types/flow';

export const publicClient = createPublicClient({
  chain: botchainTestnet,
  transport: http(process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'),
});

const ERC20_TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

export interface ScanProgress {
  currentBlock: bigint;
  totalBlocks: bigint;
  percent: number;
  transfersFound: number;
  message: string;
}

export async function getLatestBlockNumber(): Promise<bigint> {
  try {
    return await publicClient.getBlockNumber();
  } catch (error) {
    console.warn('Failed to fetch latest block number, falling back to 0n:', error);
    return 0n;
  }
}

/**
 * Checks whether an address is a Smart Contract or an EOA Wallet
 */
export async function determineNodeType(address: string): Promise<'contract' | 'wallet'> {
  try {
    const code = await publicClient.getBytecode({ address: address as `0x${string}` });
    return code && code !== '0x' ? 'contract' : 'wallet';
  } catch (error) {
    return 'wallet';
  }
}

/**
 * Scans Botchain Testnet for native BOT or ERC-20 token movements
 */
export async function analyzeTokenFlow(
  walletAddress: string,
  tokenAddress: string,
  fromBlock: bigint,
  toBlock: bigint,
  onProgress?: (progress: ScanProgress) => void
): Promise<FlowReport> {
  const normalizedTarget = walletAddress.toLowerCase();
  const isNative = !tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000';
  const tokenSymbol = isNative ? 'BOT' : 'ERC20';

  const transfers: FlowTransfer[] = [];
  const counterpartySet = new Set<string>();

  const totalBlocks = toBlock >= fromBlock ? toBlock - fromBlock + 1n : 1n;

  if (isNative) {
    // Scan native BOT transactions across blocks
    // If the block range is wide, we scan the blocks in batches
    const start = Number(fromBlock);
    const end = Number(toBlock);

    for (let b = start; b <= end; b++) {
      if (onProgress && totalBlocks > 0n) {
        const processed = BigInt(b - start);
        const percent = Math.min(100, Math.round((Number(processed) / Number(totalBlocks)) * 100));
        onProgress({
          currentBlock: BigInt(b),
          totalBlocks,
          percent,
          transfersFound: transfers.length,
          message: `Scanning block #${b}... (${transfers.length} transfers found)`
        });
      }

      try {
        const block = await publicClient.getBlock({
          blockNumber: BigInt(b),
          includeTransactions: true,
        });

        if (block && block.transactions) {
          for (const tx of block.transactions) {
            // When includeTransactions is true, tx is a Transaction object
            if (typeof tx === 'object' && tx !== null && 'from' in tx) {
              const txFrom = tx.from?.toLowerCase();
              const txTo = tx.to?.toLowerCase();
              const txVal = tx.value || 0n;

              if (txVal > 0n && (txFrom === normalizedTarget || txTo === normalizedTarget)) {
                transfers.push({
                  hash: tx.hash,
                  from: txFrom || '',
                  to: txTo || '',
                  amount: txVal,
                  formattedAmount: formatEther(txVal),
                  tokenSymbol: 'BOT',
                  blockNumber: BigInt(b),
                  timestamp: Number(block.timestamp),
                  isNative: true,
                });

                if (txFrom && txFrom !== normalizedTarget) counterpartySet.add(txFrom);
                if (txTo && txTo !== normalizedTarget) counterpartySet.add(txTo);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Error scanning block ${b}:`, err);
      }
    }
  } else {
    // Scan ERC-20 Transfer logs
    if (onProgress) {
      onProgress({
        currentBlock: fromBlock,
        totalBlocks,
        percent: 30,
        transfersFound: 0,
        message: 'Querying ERC-20 Transfer logs...'
      });
    }

    try {
      const logs = await publicClient.getLogs({
        address: tokenAddress as `0x${string}`,
        event: ERC20_TRANSFER_EVENT,
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        const from = log.args.from?.toLowerCase() || '';
        const to = log.args.to?.toLowerCase() || '';
        const value = log.args.value || 0n;

        if (from === normalizedTarget || to === normalizedTarget) {
          transfers.push({
            hash: log.transactionHash,
            from,
            to,
            amount: value,
            formattedAmount: formatEther(value),
            tokenSymbol,
            blockNumber: log.blockNumber,
            isNative: false,
          });

          if (from && from !== normalizedTarget) counterpartySet.add(from);
          if (to && to !== normalizedTarget) counterpartySet.add(to);
        }
      }
    } catch (err) {
      console.warn('Error fetching ERC-20 transfer logs:', err);
    }
  }

  // Calculate Metrics
  let totalIncoming = 0n;
  let totalOutgoing = 0n;
  let largestTransferObj: FlowReport['largestTransfer'] = null;

  const counterpartyStats = new Map<string, {
    incomingCount: number;
    outgoingCount: number;
    volume: bigint;
    netImpact: bigint;
  }>();

  for (const t of transfers) {
    const isIncoming = t.to.toLowerCase() === normalizedTarget;
    const isOutgoing = t.from.toLowerCase() === normalizedTarget;
    const counterparty = isIncoming ? t.from : t.to;

    if (isIncoming) {
      totalIncoming += t.amount;
    }
    if (isOutgoing) {
      totalOutgoing += t.amount;
    }

    if (!largestTransferObj || t.amount > largestTransferObj.amount) {
      largestTransferObj = {
        amount: t.amount,
        formattedAmount: t.formattedAmount,
        hash: t.hash,
        from: t.from,
        to: t.to,
        direction: isIncoming ? 'incoming' : (isOutgoing ? 'outgoing' : 'none'),
      };
    }

    if (counterparty) {
      const current = counterpartyStats.get(counterparty) || {
        incomingCount: 0,
        outgoingCount: 0,
        volume: 0n,
        netImpact: 0n,
      };

      if (isIncoming) {
        current.incomingCount++;
        current.netImpact += t.amount;
      }
      if (isOutgoing) {
        current.outgoingCount++;
        current.netImpact -= t.amount;
      }
      current.volume += t.amount;
      counterpartyStats.set(counterparty, current);
    }
  }

  const grossTransferVolume = totalIncoming + totalOutgoing;
  const netBalanceChange = totalIncoming - totalOutgoing;

  // Classify counterparties (Wallet vs Contract)
  const nodeTypeMap = new Map<string, 'contract' | 'wallet'>();
  const allUniqueAddresses = Array.from(counterpartySet);

  // Check bytecode for target
  const targetType = await determineNodeType(normalizedTarget);
  nodeTypeMap.set(normalizedTarget, targetType);

  // Check bytecode for counterparties (batch/concurrent limit)
  await Promise.all(
    allUniqueAddresses.map(async (addr) => {
      const type = await determineNodeType(addr);
      nodeTypeMap.set(addr, type);
    })
  );

  // Construct Nodes
  const nodes: FlowNode[] = [];
  
  // Target node
  nodes.push({
    id: normalizedTarget,
    address: normalizedTarget,
    type: targetType,
    isTarget: true,
    incomingTotal: totalIncoming,
    outgoingTotal: totalOutgoing,
    transferCount: transfers.length,
    label: `Target (${targetType.toUpperCase()})`,
  });

  // Counterparty nodes
  for (const addr of allUniqueAddresses) {
    const stats = counterpartyStats.get(addr);
    nodes.push({
      id: addr,
      address: addr,
      type: nodeTypeMap.get(addr) || 'wallet',
      isTarget: false,
      incomingTotal: 0n,
      outgoingTotal: stats ? stats.volume : 0n,
      transferCount: stats ? (stats.incomingCount + stats.outgoingCount) : 0,
      label: (nodeTypeMap.get(addr) || 'wallet').toUpperCase(),
    });
  }

  // Construct Frequent Interactions List
  const frequentInteractions: AddressInteractionSummary[] = allUniqueAddresses
    .map((addr) => {
      const stats = counterpartyStats.get(addr)!;
      const totalCount = stats.incomingCount + stats.outgoingCount;
      return {
        address: addr,
        type: nodeTypeMap.get(addr) || 'wallet',
        incomingCount: stats.incomingCount,
        outgoingCount: stats.outgoingCount,
        totalTransfers: totalCount,
        totalVolume: stats.volume,
        formattedVolume: formatEther(stats.volume),
        netImpact: stats.netImpact,
      };
    })
    .sort((a, b) => b.totalTransfers - a.totalTransfers);

  // Compute deterministic report hash for on-chain publication
  const summaryPayload = JSON.stringify({
    wallet: normalizedTarget,
    token: tokenAddress || '0x0000000000000000000000000000000000000000',
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    totalTransfers: transfers.length,
    incoming: totalIncoming.toString(),
    outgoing: totalOutgoing.toString(),
    uniqueAddresses: allUniqueAddresses.length,
  });

  const reportHash = keccak256(stringToBytes(summaryPayload));

  if (onProgress) {
    onProgress({
      currentBlock: toBlock,
      totalBlocks,
      percent: 100,
      transfersFound: transfers.length,
      message: 'Analysis complete.'
    });
  }

  return {
    targetWallet: normalizedTarget,
    tokenAddress: tokenAddress || '0x0000000000000000000000000000000000000000',
    tokenSymbol,
    fromBlock,
    toBlock,
    status: 'Complete',
    totalTransfers: transfers.length,
    totalIncoming,
    formattedIncoming: formatEther(totalIncoming),
    totalOutgoing,
    formattedOutgoing: formatEther(totalOutgoing),
    grossTransferVolume,
    formattedGrossVolume: formatEther(grossTransferVolume),
    netBalanceChange,
    formattedNetChange: (netBalanceChange >= 0n ? '+' : '') + formatEther(netBalanceChange),
    uniqueAddressesCount: allUniqueAddresses.length,
    uniqueAddresses: allUniqueAddresses,
    largestTransfer: largestTransferObj,
    frequentInteractions,
    nodes,
    transfers,
    reportHash,
  };
}

