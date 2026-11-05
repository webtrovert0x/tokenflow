# BOT TokenFlow

> **Token Movement Statistics, Graph Topology Explorer, and On-Chain Attestation Protocol on Botchain Testnet**

[![Network: Botchain Testnet](https://img.shields.io/badge/Network-Botchain%20Testnet%20(968)-blue)](https://scan.bohr.life/)
[![Contract](https://img.shields.io/badge/Contract-0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60-emerald)](https://scan.bohr.life/address/0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60)
[![Whitepaper](https://img.shields.io/badge/Documentation-Whitepaper-purple)](./WHITEPAPER.md)

---

## Overview

**BOT TokenFlow** is a decentralized token movement analytics protocol built for **Botchain Testnet (Chain ID 968)**. It enables users, analysts, and developers to inspect transaction flows, distinguish gross volume from net balance alterations, inspect counterparties as Wallets vs Smart Contracts, and publish verifiable report attestations on-chain.

Read the full technical specification in the **[BOT TokenFlow Whitepaper](./WHITEPAPER.md)**.

---

## Features

- **Visual Flow Explorer**: Interactive node-graph canvas where Wallets are rendered as circular blue nodes, Smart Contracts as angular amber nodes, and Transfers as directional flow vectors with transfer amount badges and links to BohrScan.
- **Node Activity Inspection**: Click any node to open an inspection drawer showing every transfer involving that entity.
- **Formal Flow Report**:
  - Total Transfers count
  - Total Incoming BOT
  - Total Outgoing BOT
  - Unique counterparty count
  - Largest single transfer (with transaction hash)
  - Gross Transfer Volume vs Net Balance Change distinction
  - Most frequently interacting addresses table
- **Mandatory On-Chain Contract Verification**:
  - `BOTTokenFlow.sol` deployed on Botchain Testnet.
  - Submit analysis requests on-chain (`requestFlowAnalysis`) paying **only network gas fees** (zero platform fees).
  - Attest verifiable `keccak256` report hashes on-chain (`publishResult`).
- **Clean Flat UI Philosophy**: High-contrast, matte finish with zero glossy elements and zero color gradients.

---

## Botchain Testnet Specifications

- **Chain ID**: `968`
- **RPC URL**: `https://rpc.bohr.life`
- **Native Currency**: `BOT` (18 decimals)
- **Explorer**: [https://scan.bohr.life/](https://scan.bohr.life/)
- **Deployed Contract**: [`0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60`](https://scan.bohr.life/address/0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60)

---

## Getting Started

### 1. Installation

```bash
git clone https://github.com/webtrovert0x/tokenflow.git
cd tokenflow
npm install
```

### 2. Environment Setup

Create `.env` based on `.env.example`:

```env
PRIVATE_KEY=your_private_key_here
REOWN_ID=your_reown_project_id_here
BOTCHAIN_RPC_URL=https://rpc.bohr.life
BOTCHAIN_CHAIN_ID=968
BOTCHAIN_EXPLORER=https://scan.bohr.life/
BOT_TOKEN_FLOW_ADDRESS=0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60
```

> **Note**: Uses `REOWN_ID` directly to protect project secrets.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 4. Smart Contract Compilation & Deployment

Compile contracts:
```bash
npm run compile
```

Deploy to Botchain Testnet:
```bash
npm run deploy
```

---

## Smart Contract Architecture

The `BOTTokenFlow.sol` smart contract provides:

```solidity
// Request flow analysis on-chain (Gas only, no platform fee)
function requestFlowAnalysis(
    address wallet,
    address token,
    uint256 fromBlock,
    uint256 toBlock
) external returns (bytes32 requestId);

// Retrieve request details
function getRequest(bytes32 requestId) external view returns (FlowRequest memory);

// Publish verified report hash on-chain
function publishResult(bytes32 requestId, bytes32 reportHash) external;
```

---

## License

MIT &copy; 2026 BOT TokenFlow
