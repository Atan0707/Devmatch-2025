# 🎯 DevMatch (Pisang2U) - Decentralized Content Creator Donation Platform

A comprehensive blockchain-based donation platform that enables content creators to receive cryptocurrency donations directly from their audience across multiple social media platforms. Built with Next.js, Solidity, and the Scaffold-ETH 2 framework.

## 🌟 Overview

DevMatch (formerly Pisang2U) is a decentralized donation platform that bridges the gap between content creators and their supporters through blockchain technology. The platform allows creators to register their social media accounts on-chain and receive direct cryptocurrency donations (ETH and USDC) from viewers.

## 🏗️ Project Architecture

<img width="1016" height="493" alt="image" src="https://github.com/user-attachments/assets/bc4ebb39-31df-402d-957b-598d77cd0124" />

The platform operates on two primary user models:

### 👨‍💻 Creator Model
1. **Wallet Connection**: Connect via Privy authentication system
2. **Content Registration**: Register social media accounts (YouTube, Twitch, Instagram, TikTok, Facebook, Twitter) on the blockchain
3. **Smart Contract Binding**: Content accounts are permanently linked to the creator's wallet address
4. **Earnings Management**: View, track, and withdraw donations received from supporters

### 💰 Donator Model
1. **Wallet Connection**: Connect via supported wallet providers (Privy integration)
2. **Content Discovery**: Browse registered creators or access content directly
3. **Smart Contract Verification**: System verifies if content is registered on the blockchain
4. **Direct Donations**: Send USDC or ETH donations directly to creators

## 🚀 Key Features

### ✨ For Content Creators
- **Multi-Platform Support**: Register accounts from 6 major social platforms
- **Cryptocurrency Earnings**: Receive donations in ETH and USDC
- **Real-time Dashboard**: Track earnings, donation count, and registered content
- **Secure Withdrawals**: Withdraw earnings directly to your wallet
- **Ownership Control**: Full control over registered content and settings

### 🎁 For Supporters
- **Easy Donations**: Send crypto donations with just a few clicks
- **Multiple Currencies**: Support creators with ETH or USDC
- **Transparent Transactions**: All donations are recorded on the blockchain
- **Low Fees**: Minimal platform fees (2.5%) with transparent fee structure

### 🔒 Security & Transparency
- **Smart Contract Verified**: All transactions secured by blockchain technology
- **Non-custodial**: Users maintain full control of their wallets
- **Open Source**: Complete transparency with open-source codebase
- **Auditable**: All transactions are publicly verifiable on the blockchain

## 🛠️ Technical Stack

### Frontend (Next.js)
- **Framework**: Next.js 15.2.3 with React 19
- **Styling**: Tailwind CSS 4.1.3 with DaisyUI 5.0.9
- **Authentication**: Privy (@privy-io/react-auth ~2.21.2)
- **Blockchain Interaction**: Viem 2.31.1, Wagmi
- **State Management**: Zustand ~5.0.0
- **UI Components**: Custom components with Heroicons

### Backend (Smart Contracts)
- **Language**: Solidity ^0.8.0
- **Framework**: Hardhat
- **Security**: OpenZeppelin contracts (ReentrancyGuard, SafeERC20)
- **Network**: Base Sepolia Testnet
- **Contract Address**: `0x39266942a0F29C6a3495e43fCaE510C0a454B1d9`

### Development Framework
- **Scaffold-ETH 2**: Complete dApp development framework
- **Package Manager**: Yarn 3.2.3 (Monorepo structure)
- **TypeScript**: Full TypeScript support across the stack
- **Testing**: Hardhat testing framework
- **Deployment**: Automated deployment scripts

## 📱 Platform Features

### 🏠 Homepage
- **Wallet Connection**: Seamless wallet integration with Privy
- **Feature Overview**: Introduction to platform capabilities
- **User Onboarding**: Guided setup for new users

### 📊 Dashboard
- **Earnings Overview**: Total USDC and ETH earnings display
- **Donation Statistics**: Count of donations received across all content
- **Content Summary**: List of all registered social media accounts
- **Platform Stats**: Network-wide statistics (total contents, donations)
- **Real-time Updates**: Live data from the blockchain

### 👥 Donator Management
- **Donation History**: Complete history of received donations
- **Content-Specific Stats**: Donations breakdown by platform/account
- **Donor Information**: Details about supporters (addresses, amounts)
- **Recent Activity**: Latest donation transactions

### 💰 Withdrawal System
- **Multi-Currency Support**: Withdraw ETH and USDC separately
- **Real-time Balance**: Live balance updates from smart contracts
- **Secure Transactions**: Direct wallet-to-wallet transfers
- **Transaction History**: Complete withdrawal records

### ⚙️ Settings & Configuration
- **Platform Registration**: Add/manage social media accounts
- **Account Verification**: Blockchain-based account verification
- **Profile Management**: Update usernames and platform associations
- **Security Settings**: Manage wallet connections and permissions

## 🌐 Supported Platforms

1. **🎥 YouTube** - Channel-based content creators
2. **🎮 Twitch** - Live streaming personalities
3. **📷 Instagram** - Visual content creators
4. **🎵 TikTok** - Short-form video creators
5. **📘 Facebook** - Social media content creators
6. **🐦 Twitter** - Micro-content and commentary creators

## 💰 Supported Cryptocurrencies

- **ETH (Ethereum)**: Native blockchain currency
- **USDC**: USD-pegged stablecoin for stable value donations
- **Extensible**: Smart contract designed to support additional ERC-20 tokens

## 🔧 Smart Contract Architecture

### Core Components

#### PisangContract.sol
- **Content Management**: Register, activate/deactivate content
- **Donation Processing**: Handle ETH and ERC-20 token donations
- **Earnings Tracking**: Track creator earnings by token type
- **Platform Administration**: Manage supported tokens and platforms
- **Fee Management**: Configurable platform fees (default: 2.5%)

#### Key Functions
- `registerContent()`: Register social media account on blockchain
- `donateToContent()`: Send ETH donations to creators
- `donateTokenToContent()`: Send ERC-20 token donations
- `withdrawEthEarnings()`: Withdraw ETH earnings
- `withdrawTokenEarnings()`: Withdraw token earnings
- `getCreatorAllEarnings()`: Retrieve complete earnings data

### Security Features
- **ReentrancyGuard**: Protection against reentrancy attacks
- **SafeERC20**: Secure token transfer mechanisms
- **Access Control**: Owner-only administrative functions
- **Input Validation**: Comprehensive input sanitization

## 🚀 Getting Started

### Prerequisites
- Node.js ≥20.18.3
- Yarn 3.2.3
- Git

### Installation

1. **Clone the Repository**
```bash
git clone <repository-url>
cd Devmatch-2025
```

2. **Install Dependencies**
```bash
yarn install
```

3. **Environment Setup**
```bash
# Copy environment template
cp packages/nextjs/.env.example packages/nextjs/.env.local

# Configure environment variables
# Add your Alchemy API key, Wallet Connect Project ID, etc.
```

### Development Workflow

1. **Start Local Blockchain**
```bash
yarn chain
```

2. **Deploy Smart Contracts**
```bash
yarn deploy
```

3. **Start Frontend Development Server**
```bash
yarn start
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Debug Interface: http://localhost:3000/debug

### Available Scripts

#### Blockchain Development
- `yarn chain`: Start local Hardhat network
- `yarn deploy`: Deploy contracts to current network
- `yarn compile`: Compile smart contracts
- `yarn test`: Run contract tests
- `yarn verify`: Verify contracts on block explorer

#### Frontend Development
- `yarn start`: Start Next.js development server
- `yarn build`: Build production application
- `yarn lint`: Run ESLint checks
- `yarn format`: Format code with Prettier

#### Account Management
- `yarn account:generate`: Generate new account
- `yarn account:import`: Import existing account
- `yarn account:reveal-pk`: Reveal private key

## 🌍 Deployment

### Smart Contract Deployment
The smart contract is deployed on Base Sepolia testnet:
- **Contract Address**: `0x39266942a0F29C6a3495e43fCaE510C0a454B1d9`
- **Network**: Base Sepolia
- **Block Explorer**: View on Base Sepolia Explorer

### Frontend Deployment
- **Vercel**: `yarn vercel` (recommended)
- **IPFS**: `yarn ipfs` for decentralized hosting
- **Self-hosted**: Standard Next.js deployment

## 🔧 Configuration

### Network Configuration
Update `scaffold.config.ts` to modify:
- Target networks
- RPC endpoints
- Polling intervals
- API keys

### Smart Contract Configuration
Modify deployment scripts in `packages/hardhat/deploy/` for:
- Constructor parameters
- Network-specific deployments
- Initial token/platform setup

## 📊 Usage Examples

### For Content Creators

1. **Connect Wallet**
   - Visit platform homepage
   - Click "Connect Wallet"
   - Authenticate via Privy

2. **Register Content**
   - Navigate to Settings
   - Select social media platforms
   - Enter usernames for each platform
   - Submit blockchain registration

3. **Track Earnings**
   - View Dashboard for earnings overview
   - Check Donator page for detailed donation history
   - Monitor real-time statistics

4. **Withdraw Funds**
   - Go to Withdraw page
   - Enter withdrawal amount (USDC)
   - Confirm transaction
   - Funds transferred to wallet

### For Supporters

1. **Find Creator**
   - Browse registered creators
   - Verify content registration status

2. **Make Donation**
   - Select donation amount
   - Choose currency (ETH/USDC)
   - Confirm transaction
   - Donation sent directly to creator

## 🛡️ Security Considerations

### Smart Contract Security
- Audited OpenZeppelin libraries
- Reentrancy protection
- Input validation and sanitization
- Access control mechanisms

### Frontend Security
- Secure wallet integration
- Transaction validation
- Error handling and user feedback
- HTTPS enforcement

### User Security Best Practices
- Use hardware wallets when possible
- Verify transaction details before signing
- Keep private keys secure
- Regular security updates

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use provided ESLint and Prettier configurations
3. Write comprehensive tests for smart contracts
4. Document new features and API changes
5. Follow conventional commit messages

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with clear description
5. Address review feedback

## 📄 License

This project is licensed under the MIT License - see the [LICENCE](LICENCE) file for details.

## 🙏 Acknowledgments

- **Scaffold-ETH 2**: Framework foundation
- **OpenZeppelin**: Security library implementations
- **Privy**: Authentication infrastructure
- **Base Network**: Blockchain infrastructure
- **Community**: Contributors and supporters

## 📞 Support & Community

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Documentation**: In-code documentation and comments

## 🔗 Links

- **Live Demo**: [DevMatch Platform](https://your-deployment-url.com)
- **Smart Contract**: [View on Explorer](https://base-sepolia.blockscout.com/address/0x39266942a0F29C6a3495e43fCaE510C0a454B1d9)
- **Documentation**: Comprehensive inline documentation

---

**DevMatch** - Empowering content creators through decentralized donations 🚀
