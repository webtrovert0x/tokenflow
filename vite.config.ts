import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Explicitly inject REOWN_ID so the user doesn't need to rename it to VITE_REOWN_ID
    'process.env.REOWN_ID': JSON.stringify(process.env.REOWN_ID || ''),
    'process.env.BOTCHAIN_RPC_URL': JSON.stringify(process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life'),
    'process.env.BOT_TOKEN_FLOW_ADDRESS': JSON.stringify(process.env.BOT_TOKEN_FLOW_ADDRESS || ''),
  },
  server: {
    port: 5173,
    host: true,
  },
});

