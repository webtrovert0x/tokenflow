import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// Botchain Testnet Definition
export const botchainTestnet = defineChain({
  id: 968,
  name: 'Botchain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'],
    },
    public: {
      http: [process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life',
    },
  },
  testnet: true,
});

// User specifically requested REOWN_ID without vite_ prefix
export const projectId = process.env.REOWN_ID || '1234567890abcdef1234567890abcdef';

export const networks = [botchainTestnet];

// Set up Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [botchainTestnet.id]: http(process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'),
  },
});

// AppKit metadata
export const metadata = {
  name: 'BOT TokenFlow',
  description: 'Token Movement Statistics and Visual Flow Explorer on Botchain Testnet',
  url: 'https://scan.bohr.life',
  icons: ['https://scan.bohr.life/favicon.ico'],
};

// Initialize AppKit
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet],
  defaultNetwork: botchainTestnet,
  metadata,
  projectId,
  features: {
    analytics: false,
  },
  themeMode: 'dark',
});

export const config = wagmiAdapter.wagmiConfig;

