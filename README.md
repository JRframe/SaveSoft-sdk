# 🧩 SaveSoft SDK — Universal Web3 Integration Kit

A lightweight, cross-platform SDK that lets developers embed **secure, consistent, and brandable** Web3 wallet connectivity into any app — web, mobile, or desktop — in minutes.

## ✅ What It Solves  
No more fragmented wallet integrations. No more juggling multiple SDKs, UI kits, or signature flows. SaveSoft SDK unifies access to **20+ wallets**, **5+ chains**, and **next-gen identity protocols**, with one clean interface and zero custodial risk.

## 🌐 Supported Platforms & Wallets  

| Category         | Examples                                                                 |
|------------------|--------------------------------------------------------------------------|
| **Browser Wallets** | MetaMask, Trust Wallet, Coinbase Wallet, Phantom, OKX Wallet, Rabby     |
| **Mobile-First**     | Bitget Wallet, TokenPocket, SafePal, imToken, Mask Network              |
| **Social & MPC**     | Turnkey, Web3Auth (via Passkeys), Privy, Unipass, Lit Protocol         |
| **Hardware**         | Ledger Live (WebUSB/WebHID), Trezor Connect                             |
| **Built-in Wallet**  | SaveSoft’s own non-custodial wallet (MPC + biometric key management)    |

## 🚀 Key Features  

- **One-Click Connect**: Unified `connect()` method — auto-detects installed wallets, suggests best options, and falls back gracefully.  
- **Chain-Agnostic Signer**: Abstracts EVM, Solana, Cosmos, and Aptos signing into a single `signMessage()` / `signTransaction()` API.  
- **Embedded UI Kit**: Fully customizable, accessible React/Vue components (connect button, account modal, transaction status, QR scanner) — zero CSS leaks, dark-mode ready.  
- **Smart Session Management**: Auto-renewal, multi-chain session binding, and dApp permission persistence (with user consent).  
- **Security-First Defaults**: Built-in phishing detection, domain binding, transaction simulation, and gas estimation — enabled out-of-the-box.  
- **Extensible Identity Layer**: Plug in SBT verifiers, SIWE/SSX auth, or custom attestation providers via modular plugins.  

## 📦 Install & Get Started  

```bash
# npm
npm install @savesoft/sdk

# yarn
yarn add @savesoft/sdk
```
```
import { SaveSoftProvider } from '@savesoft/sdk';

const provider = new SaveSoftProvider({
  projectId: 'YOUR_PROJECT_ID', // from savesoft.online/dashboard
  chains: ['ethereum', 'solana'],
  uiOptions: { theme: 'dark', accentColor: '#6366f1' }
});

await provider.connect(); // opens smart wallet selector
const account = await provider.getAccount(); // returns { address, chain, walletType }
```
🔗 https://docs.savesoft.online/sdk | 📦 https://www.npmjs.com/package/@savesoft/sdk | 🐙 https://github.com/savesoft-labs/sdk