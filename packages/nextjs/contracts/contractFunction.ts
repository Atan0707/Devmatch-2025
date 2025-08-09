import ABI from "./abi.json";
import { ethers } from "ethers";

// PisangContract comprehensive functions module
export class PisangContractFunctions {
  private signer: ethers.Signer;
  private contract: ethers.Contract;
  private provider: ethers.BrowserProvider;

  constructor(signer: ethers.Signer, provider: ethers.BrowserProvider) {
    this.signer = signer;
    this.provider = provider;
    this.contract = new ethers.Contract(ABI.address, ABI.abi, signer);
  }

  // ===================== CONTENT MANAGEMENT FUNCTIONS =====================

  /**
   * Register a new streaming content URL
   * @param url The streaming content URL
   */
  async registerContent(url: string) {
    try {
      console.log("Registering content:", url);
      const tx = await this.contract.registerContent(url);
      const receipt = await tx.wait();
      console.log("✅ Content registered successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Content registration failed:", error);
      throw this.handleError(error, "Content registration failed");
    }
  }

  /**
   * Deactivate content (only by content owner)
   * @param url The content URL to deactivate
   */
  async deactivateContent(url: string) {
    try {
      console.log("Deactivating content:", url);
      const tx = await this.contract.deactivateContent(url);
      const receipt = await tx.wait();
      console.log("✅ Content deactivated successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Content deactivation failed:", error);
      throw this.handleError(error, "Content deactivation failed");
    }
  }

  /**
   * Reactivate content (only by content owner)
   * @param url The content URL to reactivate
   */
  async reactivateContent(url: string) {
    try {
      console.log("Reactivating content:", url);
      const tx = await this.contract.reactivateContent(url);
      const receipt = await tx.wait();
      console.log("✅ Content reactivated successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Content reactivation failed:", error);
      throw this.handleError(error, "Content reactivation failed");
    }
  }

  /**
   * Transfer content ownership to a new owner
   * @param url The content URL
   * @param newOwner The new owner address
   */
  async transferContentOwnership(url: string, newOwner: string) {
    try {
      console.log("Transferring content ownership:", url, "to:", newOwner);
      const tx = await this.contract.transferContentOwnership(url, newOwner);
      const receipt = await tx.wait();
      console.log("✅ Content ownership transferred successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Content ownership transfer failed:", error);
      throw this.handleError(error, "Content ownership transfer failed");
    }
  }

  // ===================== DONATION FUNCTIONS =====================

  /**
   * Donate ETH to a specific content
   * @param url The content URL to donate to
   * @param amount The amount of ETH to donate (in ETH, not Wei)
   */
  async donateEthToContent(url: string, amount: string) {
    try {
      console.log("Donating ETH to content:", url, "Amount:", amount);
      const amountInWei = ethers.parseEther(amount);

      const tx = await this.contract.donateToContent(url, {
        value: amountInWei,
      });
      const receipt = await tx.wait();
      console.log("✅ ETH donation successful, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("ETH donation failed:", error);
      throw this.handleError(error, "ETH donation failed");
    }
  }

  /**
   * Donate ERC20 tokens to a specific content
   * @param url The content URL to donate to
   * @param tokenAddress The token contract address
   * @param amount The amount of tokens to donate (in token units, not wei)
   * @param decimals The token decimals (default: 18)
   */
  async donateTokenToContent(url: string, tokenAddress: string, amount: string, decimals: number = 18) {
    try {
      console.log("Donating tokens to content:", url, "Token:", tokenAddress, "Amount:", amount);

      const amountInWei = ethers.parseUnits(amount, decimals);
      const userAddress = await this.signer.getAddress();

      // Create token contract instance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
          "function balanceOf(address account) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ],
        this.signer,
      );

      // Check user balance
      const balance = await tokenContract.balanceOf(userAddress);
      console.log(`Token Balance: ${ethers.formatUnits(balance, decimals)} tokens`);

      if (balance < amountInWei) {
        throw new Error(
          `Insufficient token balance. You have ${ethers.formatUnits(balance, decimals)} tokens but need ${amount} tokens`,
        );
      }

      // Check current allowance
      const currentAllowance = await tokenContract.allowance(userAddress, ABI.address);
      console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, decimals)} tokens`);

      // If allowance is insufficient, approve
      if (currentAllowance < amountInWei) {
        console.log("Approving token spending...");

        // First reset allowance to 0 if needed (some tokens require this)
        if (currentAllowance > 0) {
          console.log("Resetting allowance to 0 first...");
          const resetTx = await tokenContract.approve(ABI.address, 0);
          await resetTx.wait();
          console.log("Allowance reset to 0");
        }

        // Now set the new allowance
        const approveTx = await tokenContract.approve(ABI.address, amountInWei);
        const approveReceipt = await approveTx.wait();
        console.log("✅ Token approved, tx hash:", approveReceipt.hash);

        // Verify the allowance was set correctly
        const newAllowance = await tokenContract.allowance(userAddress, ABI.address);
        console.log(`New allowance: ${ethers.formatUnits(newAllowance, decimals)} tokens`);

        if (newAllowance < amountInWei) {
          throw new Error("Approval failed - allowance not set correctly");
        }
      } else {
        console.log("Sufficient allowance already exists");
      }

      // Make the donation
      console.log("Making token donation...");
      const donateTx = await this.contract.donateTokenToContent(url, tokenAddress, amountInWei);
      const donateReceipt = await donateTx.wait();
      console.log("✅ Token donation successful, tx hash:", donateReceipt.hash);
      return { success: true, txHash: donateReceipt.hash, receipt: donateReceipt };
    } catch (error: any) {
      console.error("Token donation failed:", error);
      throw this.handleError(error, "Token donation failed");
    }
  }

  // ===================== WITHDRAWAL FUNCTIONS =====================

  /**
   * Withdraw ETH earnings for the connected user
   */
  async withdrawEthEarnings() {
    try {
      console.log("Withdrawing ETH earnings...");
      const tx = await this.contract.withdrawEthEarnings();
      const receipt = await tx.wait();
      console.log("✅ ETH withdrawal successful, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("ETH withdrawal failed:", error);
      throw this.handleError(error, "ETH withdrawal failed");
    }
  }

  /**
   * Withdraw token earnings for the connected user
   * @param tokenAddress The token contract address
   */
  async withdrawTokenEarnings(tokenAddress: string) {
    try {
      console.log("Withdrawing token earnings for:", tokenAddress);
      const tx = await this.contract.withdrawTokenEarnings(tokenAddress);
      const receipt = await tx.wait();
      console.log("✅ Token withdrawal successful, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Token withdrawal failed:", error);
      throw this.handleError(error, "Token withdrawal failed");
    }
  }

  /**
   * Withdraw all earnings (ETH + all supported tokens)
   */
  async withdrawAllEarnings() {
    try {
      console.log("Withdrawing all earnings...");
      const tx = await this.contract.withdrawAllEarnings();
      const receipt = await tx.wait();
      console.log("✅ All earnings withdrawal successful, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("All earnings withdrawal failed:", error);
      throw this.handleError(error, "All earnings withdrawal failed");
    }
  }

  // ===================== VIEW/READ FUNCTIONS =====================

  /**
   * Get content information
   * @param url The content URL
   */
  async getContent(url: string) {
    try {
      const content = await this.contract.getContent(url);
      return {
        url: content[0],
        owner: content[1],
        totalDonationsReceived: content[2],
        donationCount: content[3],
        isActive: content[4],
        createdAt: content[5],
      };
    } catch (error: any) {
      console.error("Failed to get content:", error);
      throw this.handleError(error, "Failed to get content");
    }
  }

  /**
   * Check if content exists
   * @param url The content URL to check
   */
  async contentExists(url: string): Promise<boolean> {
    try {
      return await this.contract.contentExistsCheck(url);
    } catch (error: any) {
      console.error("Failed to check content existence:", error);
      return false;
    }
  }

  /**
   * Get all content URLs by a creator
   * @param creatorAddress The creator's address
   */
  async getCreatorContents(creatorAddress: string): Promise<string[]> {
    try {
      return await this.contract.getCreatorContents(creatorAddress);
    } catch (error: any) {
      console.error("Failed to get creator contents:", error);
      throw this.handleError(error, "Failed to get creator contents");
    }
  }

  /**
   * Get donation IDs for a specific content
   * @param url The content URL
   */
  async getContentDonations(url: string): Promise<number[]> {
    try {
      const donations = await this.contract.getContentDonations(url);
      return donations.map((id: any) => Number(id));
    } catch (error: any) {
      console.error("Failed to get content donations:", error);
      throw this.handleError(error, "Failed to get content donations");
    }
  }

  /**
   * Get recent donations for a content
   * @param url The content URL
   * @param limit Number of recent donations to fetch
   */
  async getRecentDonations(url: string, limit: number = 10): Promise<number[]> {
    try {
      const donations = await this.contract.getRecentDonations(url, limit);
      return donations.map((id: any) => Number(id));
    } catch (error: any) {
      console.error("Failed to get recent donations:", error);
      throw this.handleError(error, "Failed to get recent donations");
    }
  }

  /**
   * Get donation details by ID
   * @param donationId The donation ID
   */
  async getDonation(donationId: number) {
    try {
      const donation = await this.contract.getDonation(donationId);
      return {
        donor: donation[0],
        contentOwner: donation[1],
        amount: donation[2],
        timestamp: donation[3],
        contentUrl: donation[4],
        token: donation[5],
      };
    } catch (error: any) {
      console.error("Failed to get donation:", error);
      throw this.handleError(error, "Failed to get donation");
    }
  }

  /**
   * Get creator earnings for a specific token
   * @param creatorAddress The creator's address
   * @param tokenAddress The token address (use "0x0000000000000000000000000000000000000000" for ETH)
   */
  async getCreatorEarnings(creatorAddress: string, tokenAddress: string): Promise<bigint> {
    try {
      return await this.contract.getCreatorEarnings(creatorAddress, tokenAddress);
    } catch (error: any) {
      console.error("Failed to get creator earnings:", error);
      throw this.handleError(error, "Failed to get creator earnings");
    }
  }

  /**
   * Get creator earnings for all tokens
   * @param creatorAddress The creator's address
   */
  async getCreatorAllEarnings(creatorAddress: string) {
    try {
      const result = await this.contract.getCreatorAllEarnings(creatorAddress);
      return {
        tokens: result[0],
        amounts: result[1],
        symbols: result[2],
      };
    } catch (error: any) {
      console.error("Failed to get creator all earnings:", error);
      throw this.handleError(error, "Failed to get creator all earnings");
    }
  }

  /**
   * Get donor total donations for a specific token
   * @param donorAddress The donor's address
   * @param tokenAddress The token address (use "0x0000000000000000000000000000000000000000" for ETH)
   */
  async getDonorTotalDonations(donorAddress: string, tokenAddress: string): Promise<bigint> {
    try {
      return await this.contract.getDonorTotalDonations(donorAddress, tokenAddress);
    } catch (error: any) {
      console.error("Failed to get donor total donations:", error);
      throw this.handleError(error, "Failed to get donor total donations");
    }
  }

  /**
   * Get donor total donations for all tokens
   * @param donorAddress The donor's address
   */
  async getDonorAllDonations(donorAddress: string) {
    try {
      const result = await this.contract.getDonorAllDonations(donorAddress);
      return {
        tokens: result[0],
        amounts: result[1],
        symbols: result[2],
      };
    } catch (error: any) {
      console.error("Failed to get donor all donations:", error);
      throw this.handleError(error, "Failed to get donor all donations");
    }
  }

  /**
   * Get supported tokens
   */
  async getSupportedTokens() {
    try {
      const result = await this.contract.getSupportedTokens();
      return {
        tokens: result[0],
        symbols: result[1],
      };
    } catch (error: any) {
      console.error("Failed to get supported tokens:", error);
      throw this.handleError(error, "Failed to get supported tokens");
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    try {
      const result = await this.contract.getPlatformStats();
      return {
        totalContents: result[0],
        totalDonations: result[1],
        platformFee: result[2],
      };
    } catch (error: any) {
      console.error("Failed to get platform stats:", error);
      throw this.handleError(error, "Failed to get platform stats");
    }
  }

  // ===================== ADMIN FUNCTIONS (Contract Owner Only) =====================

  /**
   * Add a supported token (only contract owner)
   * @param tokenAddress The token address to add
   * @param symbol The token symbol
   */
  async addSupportedToken(tokenAddress: string, symbol: string) {
    try {
      console.log("Adding supported token:", tokenAddress, symbol);
      const tx = await this.contract.addSupportedToken(tokenAddress, symbol);
      const receipt = await tx.wait();
      console.log("✅ Token added successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Add token failed:", error);
      throw this.handleError(error, "Add token failed");
    }
  }

  /**
   * Remove a supported token (only contract owner)
   * @param tokenAddress The token address to remove
   */
  async removeSupportedToken(tokenAddress: string) {
    try {
      console.log("Removing supported token:", tokenAddress);
      const tx = await this.contract.removeSupportedToken(tokenAddress);
      const receipt = await tx.wait();
      console.log("✅ Token removed successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Remove token failed:", error);
      throw this.handleError(error, "Remove token failed");
    }
  }

  /**
   * Update platform fee (only contract owner)
   * @param newFee New fee in basis points (e.g., 250 = 2.5%)
   */
  async updatePlatformFee(newFee: number) {
    try {
      console.log("Updating platform fee to:", newFee);
      const tx = await this.contract.updatePlatformFee(newFee);
      const receipt = await tx.wait();
      console.log("✅ Platform fee updated successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Update platform fee failed:", error);
      throw this.handleError(error, "Update platform fee failed");
    }
  }

  /**
   * Withdraw platform fees in ETH (only contract owner)
   */
  async withdrawPlatformFeesEth() {
    try {
      console.log("Withdrawing platform ETH fees...");
      const tx = await this.contract.withdrawPlatformFeesEth();
      const receipt = await tx.wait();
      console.log("✅ Platform ETH fees withdrawn successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Withdraw platform ETH fees failed:", error);
      throw this.handleError(error, "Withdraw platform ETH fees failed");
    }
  }

  /**
   * Withdraw platform fees in tokens (only contract owner)
   * @param tokenAddress The token address
   */
  async withdrawPlatformFeesToken(tokenAddress: string) {
    try {
      console.log("Withdrawing platform token fees for:", tokenAddress);
      const tx = await this.contract.withdrawPlatformFeesToken(tokenAddress);
      const receipt = await tx.wait();
      console.log("✅ Platform token fees withdrawn successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Withdraw platform token fees failed:", error);
      throw this.handleError(error, "Withdraw platform token fees failed");
    }
  }

  /**
   * Withdraw all platform fees (ETH + all tokens) (only contract owner)
   */
  async withdrawAllPlatformFees() {
    try {
      console.log("Withdrawing all platform fees...");
      const tx = await this.contract.withdrawAllPlatformFees();
      const receipt = await tx.wait();
      console.log("✅ All platform fees withdrawn successfully, tx hash:", receipt.hash);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error: any) {
      console.error("Withdraw all platform fees failed:", error);
      throw this.handleError(error, "Withdraw all platform fees failed");
    }
  }

  // ===================== UTILITY FUNCTIONS =====================

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return ABI.address;
  }

  /**
   * Get contract instance
   */
  getContract(): ethers.Contract {
    return this.contract;
  }

  /**
   * Check token balance and allowance
   * @param tokenAddress The token address
   * @param decimals Token decimals (default: 18)
   */
  async checkTokenStatus(tokenAddress: string, decimals: number = 18) {
    try {
      const userAddress = await this.signer.getAddress();

      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function balanceOf(address account) view returns (uint256)",
          "function symbol() view returns (string)",
          "function name() view returns (string)",
        ],
        this.signer,
      );

      const balance = await tokenContract.balanceOf(userAddress);
      const allowance = await tokenContract.allowance(userAddress, ABI.address);
      const symbol = await tokenContract.symbol();
      const name = await tokenContract.name();

      return {
        balance: ethers.formatUnits(balance, decimals),
        allowance: ethers.formatUnits(allowance, decimals),
        balanceRaw: balance,
        allowanceRaw: allowance,
        symbol,
        name,
      };
    } catch (error: any) {
      console.error("Failed to check token status:", error);
      throw this.handleError(error, "Failed to check token status");
    }
  }

  /**
   * Handle and format errors
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error.message.includes("insufficient funds")) {
      return new Error("Insufficient ETH for gas fees");
    } else if (error.message.includes("User denied")) {
      return new Error("Transaction cancelled by user");
    } else if (error.message.includes("transfer amount exceeds allowance")) {
      return new Error("Allowance issue. Please try again.");
    } else if (error.message.includes("Not the content owner")) {
      return new Error("You are not the owner of this content");
    } else if (error.message.includes("Content does not exist")) {
      return new Error("Content does not exist");
    } else if (error.message.includes("Content is not active")) {
      return new Error("Content is not active");
    } else if (error.message.includes("Not the contract owner")) {
      return new Error("You are not the contract owner");
    } else if (error.message.includes("Token not supported")) {
      return new Error("Token is not supported by the platform");
    } else {
      return new Error(`${defaultMessage}: ${error.message}`);
    }
  }
}

// ===================== HELPER FUNCTIONS =====================

/**
 * Initialize PisangContract with wallet connection
 * @param provider Browser provider (MetaMask, etc.)
 * @returns PisangContractFunctions instance
 */
export async function initializePisangContract(provider: ethers.BrowserProvider): Promise<PisangContractFunctions> {
  try {
    const signer = await provider.getSigner();
    return new PisangContractFunctions(signer, provider);
  } catch (error: any) {
    console.error("Failed to initialize PisangContract:", error);
    throw new Error(`Failed to initialize contract: ${error.message}`);
  }
}

/**
 * Connect wallet and initialize contract
 * @returns Object with connection status and contract instance
 */
export async function connectWalletAndInitializeContract() {
  try {
    if (typeof window.ethereum === "undefined") {
      throw new Error("Please install MetaMask!");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const account = accounts[0];

    const pisangContract = new PisangContractFunctions(signer, provider);

    console.log("Connected account:", account);

    return {
      success: true,
      account,
      provider,
      signer,
      pisangContract,
      message: "Wallet connected successfully!",
    };
  } catch (error: any) {
    console.error("Failed to connect wallet:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to connect wallet",
    };
  }
}

// ===================== CONSTANTS =====================

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Common token addresses (you can expand this based on your needs)
export const COMMON_TOKENS = {
  // Base Sepolia testnet tokens
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Example USDC address
  // Add more tokens as needed
};

export const TOKEN_DECIMALS = {
  USDC: 6,
  USDT: 6,
  DAI: 18,
  WETH: 18,
  // Add more token decimals as needed
};
