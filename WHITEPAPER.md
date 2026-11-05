# BOT TokenFlow Whitepaper
**A Verifiable On-Chain Protocol for Token Movement Analytics, Graph Topology Exploration, and Decentralized Flow Attestation on Botchain**

**Version:** 1.0.0  
**Target Network:** Botchain Testnet (Chain ID: `968`)  
**Native Currency:** BOT  
**Protocol Contract:** `0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60`  
**Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)  

---

## 1. Abstract

Decentralized ledgers provide transparent transaction histories, yet querying and interpreting fund movements across intricate webs of smart contracts and externally owned accounts (EOAs) remains fragmented and computationally opaque. Existing blockchain explorers typically present raw tabular transaction lists, making it difficult to distinguish gross transactional volume from net balance alterations, identify key interacting counterparties, or detect whether counterparty nodes are automated protocols or human wallets.

**BOT TokenFlow** introduces a verifiable, graph-theoretic token movement analytics protocol designed natively for the **Botchain** ecosystem. BOT TokenFlow couples an on-chain attestation registry (`BOTTokenFlow.sol`) with a high-performance inspection engine and an interactive Visual Flow Explorer. The protocol enforces zero platform fees—requiring only network gas—democratizing access to institutional-grade flow intelligence. Every analysis request is timestamped and recorded on Botchain, and the resulting deterministic analytical report hash is cryptographically published back to the ledger for decentralized auditability.

---

## 2. Introduction & Background

As smart contract ecosystems on Botchain expand, tokens circulate rapidly through automated market makers, lending pools, decentralized applications, and private accounts. In this multi-party environment, answering fundamental questions about an address’s historical activity becomes non-trivial:
- *What is the actual net capital flow versus cyclic gross volume?*
- *Who are the primary capital sources and sinks?*
- *Which interacting counterparties are automated smart contracts versus standard user wallets?*
- *How can analytical conclusions be proven and immutably attested on-chain?*

BOT TokenFlow solves these challenges by combining:
1. **On-Chain Request & Attestation Registry**: An immutable smart contract (`BOTTokenFlow.sol`) running on Botchain Testnet (Chain ID `968`).
2. **Dual-Vector Inspection Engine**: Comprehensive historical indexing that parses both native `BOT` transfers and `ERC-20` transfer events.
3. **Bytecode-Aware Entity Taxonomy**: Automatic categorization of counterparty addresses into Smart Contracts vs EOAs via on-chain bytecode introspection (`eth_getCode`).
4. **Visual Flow Topology**: An interactive, clean flat-design graph explorer that maps complex transaction histories into node-and-edge topologies.

---

## 3. Protocol Architecture & System Design

BOT TokenFlow operates across three interdependent layers:

```
+-------------------------------------------------------------------------+
|                        APPLICATION & VISUAL LAYER                       |
|   +--------------------------+          +---------------------------+   |
|   |   Visual Flow Explorer   |          |    Token Flow Report      |   |
|   |  (Nodes, Edges, Arrows)  |          | (Gross vs Net Analytics)  |   |
|   +--------------------------+          +---------------------------+   |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                         INDEXING & ANALYTICAL ENGINE                    |
|   +--------------------------+          +---------------------------+   |
|   |  Native BOT Indexer      |          |   ERC-20 Event Scanner    |   |
|   +--------------------------+          +---------------------------+   |
|   +--------------------------+          +---------------------------+   |
|   |  Bytecode Classifier     |          | Deterministic Keccak Hash |   |
|   +--------------------------+          +---------------------------+   |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                        BOTCHAIN TESTNET (CHAIN ID: 968)                 |
|   +-----------------------------------------------------------------+   |
|   |                     BOTTokenFlow.sol Contract                   |   |
|   |   - requestFlowAnalysis(wallet, token, fromBlock, toBlock)      |   |
|   |   - publishResult(requestId, reportHash)                        |   |
|   |   - getRequest(requestId)                                       |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
```

---

## 4. Smart Contract Specification: `BOTTokenFlow.sol`

The core smart contract acts as the coordination and attestation layer on Botchain.

### 4.1 Data Structures

```solidity
struct FlowRequest {
    bytes32 requestId;       // Unique deterministic request identifier
    address requester;       // Address that initiated the request
    address wallet;          // Subject target address under analysis
    address token;           // Address of token contract (address(0) for BOT)
    uint256 fromBlock;       // Starting block number
    uint256 toBlock;         // Ending block number
    uint256 requestedAt;     // Unix timestamp of request
    bytes32 reportHash;      // Keccak256 hash of the generated report
    uint256 publishedAt;     // Unix timestamp of report publication
    bool isPublished;        // Publication lifecycle flag
}
```

### 4.2 Core Functions

#### `requestFlowAnalysis`
Initiates a new flow analysis request. The function computes a cryptographic identifier derived from the requester, target, token, block boundaries, timestamp, block number, and a monotonic nonce:

$$\text{requestId} = \text{keccak256}(\text{msg.sender}, \text{wallet}, \text{token}, \text{fromBlock}, \text{toBlock}, \text{timestamp}, \text{blockNumber}, \text{nonce})$$

```solidity
function requestFlowAnalysis(
    address wallet,
    address token,
    uint256 fromBlock,
    uint256 toBlock
) external returns (bytes32 requestId);
```
- **Gas Model**: Only transaction gas is consumed. No platform or protocol fees (`value == 0`).
- **Events**: Emits `FlowAnalysisRequested(requestId, requester, wallet, token, fromBlock, toBlock, timestamp)`.

#### `publishResult`
Binds the verifiable analysis report hash to the recorded request. Ensures single-publication immutability:

```solidity
function publishResult(
    bytes32 requestId,
    bytes32 reportHash
) external;
```
- Emits `FlowResultPublished(requestId, reportHash, publisher, timestamp)`.

#### `getRequest`
Enables permissionless verification of any historical request by third-party protocols, indexers, or decentralized auditors.

```solidity
function getRequest(bytes32 requestId) external view returns (FlowRequest memory);
```

---

## 5. Inspection Engine & Mathematical Formulations

### 5.1 Dual-Vector Ledger Ingestion
1. **Native BOT Transfers**: Because native currency transfers on EVM chains do not emit standard contract events, BOT TokenFlow indexes block transactions:
   $$\{ \text{tx} \in \text{Block}_b \mid (\text{tx.from} = W \lor \text{tx.to} = W) \land \text{tx.value} > 0 \}$$
2. **ERC-20 Token Transfers**: Employs logarithmic log querying for the standard event topic:
   $$\text{Transfer}(address \text{ indexed } from, address \text{ indexed } to, uint256 \text{ value})$$

### 5.2 Entity Introspection & Classification
For every counterparty address $A \in \mathcal{A}_{\text{unique}}$, the engine queries Botchain's execution state:
$$\text{Type}(A) = \begin{cases} \text{Smart Contract}, & \text{if } |\text{bytecode}(A)| > 0 \\ \text{EOA (Wallet)}, & \text{if } |\text{bytecode}(A)| = 0 \end{cases}$$

### 5.3 Volume & Net Delta Formulations
Traditional block explorers often confuse gross transactional throughput with actual balance changes. BOT TokenFlow formalizes the mathematical distinction:

- **Gross Inflow ($V_{\text{in}}$)**:
  $$V_{\text{in}} = \sum_{t \in \mathcal{T}, \text{to}(t) = W} \text{amount}(t)$$

- **Gross Outflow ($V_{\text{out}}$)**:
  $$V_{\text{out}} = \sum_{t \in \mathcal{T}, \text{from}(t) = W} \text{amount}(t)$$

- **Gross Transfer Volume ($V_{\text{gross}}$)**:
  $$V_{\text{gross}} = V_{\text{in}} + V_{\text{out}}$$

- **Net Balance Change ($\Delta B$)**:
  $$\Delta B = V_{\text{in}} - V_{\text{out}}$$

- **Largest Transfer ($T_{\max}$)**:
  $$T_{\max} = \arg\max_{t \in \mathcal{T}} (\text{amount}(t))$$

### 5.4 Deterministic Report Hashing
To enable decentralized attestation, the normalized analytical payload is serialized and hashed:
$$\mathcal{H}_{\text{report}} = \text{keccak256}(\text{JSON}_{\text{canonical}}(W, \text{token}, \text{fromBlock}, \text{toBlock}, V_{\text{in}}, V_{\text{out}}, |\mathcal{T}|, |\mathcal{A}_{\text{unique}}|))$$
This $\mathcal{H}_{\text{report}}$ is the exact value published to the `BOTTokenFlow` smart contract via `publishResult()`.

---

## 6. Visual Flow Explorer & UI Philosophy

### 6.1 Scientific Flat Design
In contrast to retail crypto dashboards that employ distracting gradients and glossy skeuomorphism, BOT TokenFlow adheres strictly to a **clean, flat, high-contrast palette**:
- High-visibility slate and zinc backgrounds.
- High-contrast geometric borders.
- Distinct color-coded nodes:
  - **Target Subject**: Solid Emerald (`#059669`)
  - **Wallet Counterparties (EOAs)**: Circular Blue (`#2563eb`)
  - **Protocol Counterparties (Contracts)**: Angular/Square Amber (`#d97706`)
- Directed transfer vectors with directional arrowheads:
  - Inbound flow: Emerald
  - Outbound flow: Crimson Red (`#dc2626`)

### 6.2 Interactive Node Drill-Down
Clicking any node instantly summons an activity ledger highlighting all bilateral transactions between the selected entity and the target wallet, with direct deep links to BohrScan.

---

## 7. Economic Model & Fee Policy

BOT TokenFlow is designed as public utility infrastructure for Botchain:
- **Zero Protocol Fee**: The smart contract does not levy any protocol fee. `msg.value` is 0.
- **Gas Efficiency**: The contract uses compact storage packing, storage slot optimization, and optimized calldata decoding to minimize gas costs on Botchain Testnet.

---

## 8. Network Deployment & Reference Artifacts

| Parameter | Value |
|---|---|
| **Network Name** | Botchain Testnet |
| **Chain ID** | `968` |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Native Asset** | `BOT` (18 Decimals) |
| **Block Explorer** | `https://scan.bohr.life/` |
| **Contract Address** | [`0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60`](https://scan.bohr.life/address/0x49fe45e0eF97CcD416E84Cf246E4E0e8A5fD5A60) |
| **Sample Request Tx** | [`0xe44bdc58a585a0a65d864756ac91ae52ace8891e9cc21a633657b856f3c395d9`](https://scan.bohr.life/tx/0xe44bdc58a585a0a65d864756ac91ae52ace8891e9cc21a633657b856f3c395d9) |
| **Sample Publish Tx** | [`0x8f3c00794aa67475edcd1f5ee960ad33abad505f1493c292da0f3b8dae1db14b`](https://scan.bohr.life/tx/0x8f3c00794aa67475edcd1f5ee960ad33abad505f1493c292da0f3b8dae1db14b) |

---

## 9. Security & Trust Model

1. **Non-Custodial Architecture**: The protocol never handles private funds or asks for transfer permissions.
2. **Immutable On-Chain Registry**: Published report hashes cannot be rewritten or modified once posted.
3. **Deterministic Verification**: Any party running the BOT TokenFlow algorithm across the attested block range will compute identical `keccak256` report hashes, establishing cryptographic consensus.

---

## 10. Future Roadmap

- **Phase 1 (Completed)**: Core contract deployment on Botchain Testnet, dual-vector indexing, Visual Flow Explorer, and Reown/Wagmi integration.
- **Phase 2**: Multi-hop path tracing (following funds across $N$-degrees of separation).
- **Phase 3**: Automated IPFS decentralized storage pinning of full JSON transaction graph archives.
- **Phase 4**: Automated alerting sidecars for high-frequency or anomalous whale movement detection on Botchain.

---

## 11. Conclusion

BOT TokenFlow bridges the gap between raw blockchain data and actionable intelligence on Botchain. By anchoring analytical verification in an immutable on-chain smart contract, classifying entity bytecodes, and visualizing capital movement through a clean, scientific interface, BOT TokenFlow sets a new standard for decentralized token forensics and flow transparency.
