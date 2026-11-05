// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BOTTokenFlow
 * @dev On-chain registry for requesting and publishing token movement analysis on Botchain Testnet (Chain ID 968).
 */
contract BOTTokenFlow {
    struct FlowRequest {
        bytes32 requestId;
        address requester;
        address wallet;
        address token; // address(0) represents native BOT
        uint256 fromBlock;
        uint256 toBlock;
        uint256 requestedAt;
        bytes32 reportHash;
        uint256 publishedAt;
        bool isPublished;
    }

    uint256 private _requestNonce;
    mapping(bytes32 => FlowRequest) private _requests;
    bytes32[] private _allRequestIds;
    mapping(address => bytes32[]) private _walletRequests;
    mapping(address => bytes32[]) private _requesterRequests;

    event FlowAnalysisRequested(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed wallet,
        address token,
        uint256 fromBlock,
        uint256 toBlock,
        uint256 timestamp
    );

    event FlowResultPublished(
        bytes32 indexed requestId,
        bytes32 indexed reportHash,
        address indexed publisher,
        uint256 timestamp
    );

    error InvalidBlockRange(uint256 fromBlock, uint256 toBlock);
    error InvalidWalletAddress();
    error RequestNotFound(bytes32 requestId);
    error ResultAlreadyPublished(bytes32 requestId);
    error EmptyReportHash();

    /**
     * @notice Initiates a token flow analysis request for a given wallet, token, and block range.
     * @param wallet The address whose token flow is being analyzed.
     * @param token The token contract address, or address(0) for native BOT.
     * @param fromBlock The starting block of the analysis window.
     * @param toBlock The ending block of the analysis window.
     * @return requestId The unique bytes32 identifier of the request.
     */
    function requestFlowAnalysis(
        address wallet,
        address token,
        uint256 fromBlock,
        uint256 toBlock
    ) external returns (bytes32 requestId) {
        if (wallet == address(0)) revert InvalidWalletAddress();
        if (fromBlock > toBlock) revert InvalidBlockRange(fromBlock, toBlock);

        _requestNonce++;
        requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                wallet,
                token,
                fromBlock,
                toBlock,
                block.timestamp,
                block.number,
                _requestNonce
            )
        );

        FlowRequest storage req = _requests[requestId];
        req.requestId = requestId;
        req.requester = msg.sender;
        req.wallet = wallet;
        req.token = token;
        req.fromBlock = fromBlock;
        req.toBlock = toBlock;
        req.requestedAt = block.timestamp;
        req.reportHash = bytes32(0);
        req.publishedAt = 0;
        req.isPublished = false;

        _allRequestIds.push(requestId);
        _walletRequests[wallet].push(requestId);
        _requesterRequests[msg.sender].push(requestId);

        emit FlowAnalysisRequested(
            requestId,
            msg.sender,
            wallet,
            token,
            fromBlock,
            toBlock,
            block.timestamp
        );

        return requestId;
    }

    /**
     * @notice Retrieves the flow request details for a given requestId.
     * @param requestId The unique identifier of the request.
     * @return The FlowRequest struct.
     */
    function getRequest(bytes32 requestId) external view returns (FlowRequest memory) {
        FlowRequest memory req = _requests[requestId];
        if (req.requester == address(0)) revert RequestNotFound(requestId);
        return req;
    }

    /**
     * @notice Publishes the resulting report hash for a requested analysis.
     * @param requestId The request identifier to publish results for.
     * @param reportHash The keccak256 or IPFS-derived hash of the analysis report.
     */
    function publishResult(bytes32 requestId, bytes32 reportHash) external {
        FlowRequest storage req = _requests[requestId];
        if (req.requester == address(0)) revert RequestNotFound(requestId);
        if (reportHash == bytes32(0)) revert EmptyReportHash();
        if (req.isPublished) revert ResultAlreadyPublished(requestId);

        req.reportHash = reportHash;
        req.publishedAt = block.timestamp;
        req.isPublished = true;

        emit FlowResultPublished(requestId, reportHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Returns total number of requests submitted.
     */
    function getTotalRequests() external view returns (uint256) {
        return _allRequestIds.length;
    }

    /**
     * @notice Returns all request IDs submitted for a specific wallet.
     */
    function getRequestsForWallet(address wallet) external view returns (bytes32[] memory) {
        return _walletRequests[wallet];
    }

    /**
     * @notice Returns recent request IDs (up to `limit` most recent).
     */
    function getRecentRequests(uint256 limit) external view returns (bytes32[] memory) {
        uint256 total = _allRequestIds.length;
        if (total == 0) {
            return new bytes32[](0);
        }
        uint256 count = limit > total ? total : limit;
        bytes32[] memory recent = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = _allRequestIds[total - 1 - i];
        }
        return recent;
    }
}

