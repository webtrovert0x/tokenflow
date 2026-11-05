export const BOT_TOKEN_FLOW_ABI = [
  {
    "type": "function",
    "name": "requestFlowAnalysis",
    "inputs": [
      { "name": "wallet", "type": "address", "internalType": "address" },
      { "name": "token", "type": "address", "internalType": "address" },
      { "name": "fromBlock", "type": "uint256", "internalType": "uint256" },
      { "name": "toBlock", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "requestId", "type": "bytes32", "internalType": "bytes32" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getRequest",
    "inputs": [
      { "name": "requestId", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct BOTTokenFlow.FlowRequest",
        "components": [
          { "name": "requestId", "type": "bytes32", "internalType": "bytes32" },
          { "name": "requester", "type": "address", "internalType": "address" },
          { "name": "wallet", "type": "address", "internalType": "address" },
          { "name": "token", "type": "address", "internalType": "address" },
          { "name": "fromBlock", "type": "uint256", "internalType": "uint256" },
          { "name": "toBlock", "type": "uint256", "internalType": "uint256" },
          { "name": "requestedAt", "type": "uint256", "internalType": "uint256" },
          { "name": "reportHash", "type": "bytes32", "internalType": "bytes32" },
          { "name": "publishedAt", "type": "uint256", "internalType": "uint256" },
          { "name": "isPublished", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "publishResult",
    "inputs": [
      { "name": "requestId", "type": "bytes32", "internalType": "bytes32" },
      { "name": "reportHash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTotalRequests",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRequestsForWallet",
    "inputs": [{ "name": "wallet", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "bytes32[]", "internalType": "bytes32[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRecentRequests",
    "inputs": [{ "name": "limit", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "bytes32[]", "internalType": "bytes32[]" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "FlowAnalysisRequested",
    "inputs": [
      { "name": "requestId", "type": "bytes32", "indexed": true, "internalType": "bytes32" },
      { "name": "requester", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "wallet", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "token", "type": "address", "indexed": false, "internalType": "address" },
      { "name": "fromBlock", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "toBlock", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FlowResultPublished",
    "inputs": [
      { "name": "requestId", "type": "bytes32", "indexed": true, "internalType": "bytes32" },
      { "name": "reportHash", "type": "bytes32", "indexed": true, "internalType": "bytes32" },
      { "name": "publisher", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const;

import deployedContract from './deployedContract.json';

export const DEFAULT_CONTRACT_ADDRESS = (
  (deployedContract && (deployedContract as any).address) ||
  process.env.BOT_TOKEN_FLOW_ADDRESS ||
  ''
) as `0x${string}`;

