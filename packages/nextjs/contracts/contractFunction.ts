import ABI from "./abi.json";
import { ethers } from "ethers";

// PisangContract comprehensive functions module using Privy
export class PisangContractFunctions {
  private provider: ethers.BrowserProvider;
  private contractAddress: string;
  private contractABI: any[];
  private signerAddress: string;
  private signTransactionFn: (input: any, options?: any) => Promise<{ signature: string }>;

  constructor(
    provider: ethers.BrowserProvider,
    signerAddress: string,
    signTransactionFn: (input: any, options?: any) => Promise<{ signature: string }>,
  ) {
    this.provider = provider;
    this.contractAddress = ABI.address;
    this.contractABI = ABI.abi;
    this.signerAddress = signerAddress;
    this.signTransactionFn = signTransactionFn;
  }

  // ===================== HELPER FUNCTIONS =====================

  /**
   * Helper function to execute a transaction with Privy signing
   * @param functionName The contract function name
   * @param args The function arguments
   * @param value Optional ETH value to send
   */
  private async executeTransaction(functionName: string, args: any[] = [], value?: bigint) {
    // Create contract interface to encode the function call
    const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
    const data = contract.interface.encodeFunctionData(functionName, args);

    // Estimate gas
    const gasEstimateOptions: any = {
      to: this.contractAddress,
      from: this.signerAddress,
      data: data,
    };

    if (value) {
      gasEstimateOptions.value = value;
    }

    const gasEstimate = await this.provider.estimateGas(gasEstimateOptions);

    // Get current gas price
    const feeData = await this.provider.getFeeData();

    // Prepare transaction
    const tx: any = {
      to: this.contractAddress,
      data: data,
      gas: gasEstimate.toString(),
      gasPrice: feeData.gasPrice?.toString() || "20000000000", // 20 gwei fallback
    };

    if (value) {
      tx.value = value.toString();
    }

    // Sign transaction using Privy
    const { signature } = await this.signTransactionFn(tx, {
      address: this.signerAddress,
    });

    return { signature, txHash: signature };
  }

  // ===================== CONTENT MANAGEMENT FUNCTIONS =====================

  /**
   * Register a new streaming content with username and platform
   * @param username The username on the platform
   * @param platform The platform (twitch, youtube, facebook, tiktok, etc.)
   */
  async registerContent(username: string, platform: string) {
    try {
      console.log("Registering content:", username, "on", platform);
      const result = await this.executeTransaction("registerContent", [username, platform]);
      console.log("✅ Content registered successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Content registration failed:", error);
      throw this.handleError(error, "Content registration failed");
    }
  }

  /**
   * Deactivate content (only by content owner)
   * @param username The username to deactivate
   * @param platform The platform of the content
   */
  async deactivateContent(username: string, platform: string) {
    try {
      console.log("Deactivating content:", username, "on", platform);
      const result = await this.executeTransaction("deactivateContent", [username, platform]);
      console.log("✅ Content deactivated successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Content deactivation failed:", error);
      throw this.handleError(error, "Content deactivation failed");
    }
  }

  /**
   * Reactivate content (only by content owner)
   * @param username The username to reactivate
   * @param platform The platform of the content
   */
  async reactivateContent(username: string, platform: string) {
    try {
      console.log("Reactivating content:", username, "on", platform);
      const result = await this.executeTransaction("reactivateContent", [username, platform]);
      console.log("✅ Content reactivated successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Content reactivation failed:", error);
      throw this.handleError(error, "Content reactivation failed");
    }
  }

  /**
   * Transfer content ownership to a new owner
   * @param username The username
   * @param platform The platform
   * @param newOwner The new owner address
   */
  async transferContentOwnership(username: string, platform: string, newOwner: string) {
    try {
      console.log("Transferring content ownership:", username, "on", platform, "to:", newOwner);
      const result = await this.executeTransaction("transferContentOwnership", [username, platform, newOwner]);
      console.log("✅ Content ownership transferred successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Content ownership transfer failed:", error);
      throw this.handleError(error, "Content ownership transfer failed");
    }
  }

  /**
   * Change username for an existing content account
   * @param oldUsername The current username
   * @param newUsername The new username
   * @param platform The platform of the content
   */
  async changeUsername(oldUsername: string, newUsername: string, platform: string) {
    try {
      console.log("Changing username from:", oldUsername, "to:", newUsername, "on", platform);
      const result = await this.executeTransaction("changeUsername", [oldUsername, newUsername, platform]);
      console.log("✅ Username changed successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Username change failed:", error);
      throw this.handleError(error, "Username change failed");
    }
  }

  // ===================== DONATION FUNCTIONS =====================

  /**
   * Donate ETH to a specific content
   * @param username The username to donate to
   * @param platform The platform of the content
   * @param amount The amount of ETH to donate (in ETH, not Wei)
   */
  async donateEthToContent(username: string, platform: string, amount: string) {
    try {
      console.log("Donating ETH to content:", username, "on", platform, "Amount:", amount);
      const amountInWei = ethers.parseEther(amount);
      const result = await this.executeTransaction("donateToContent", [username, platform], amountInWei);
      console.log("✅ ETH donation successful, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("ETH donation failed:", error);
      throw this.handleError(error, "ETH donation failed");
    }
  }

  /**
   * Donate ERC20 tokens to a specific content
   * @param username The username to donate to
   * @param platform The platform of the content
   * @param tokenAddress The token contract address
   * @param amount The amount of tokens to donate (in token units, not wei)
   * @param decimals The token decimals (default: 18)
   */
  async donateTokenToContent(
    username: string,
    platform: string,
    tokenAddress: string,
    amount: string,
    decimals: number = 18,
  ) {
    try {
      console.log("Donating tokens to content:", username, "on", platform, "Token:", tokenAddress, "Amount:", amount);

      const amountInWei = ethers.parseUnits(amount, decimals);

      // Create token contract instance for read operations
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function balanceOf(address account) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ],
        this.provider,
      );

      // Check user balance
      const balance = await tokenContract.balanceOf(this.signerAddress);
      console.log(`Token Balance: ${ethers.formatUnits(balance, decimals)} tokens`);

      if (balance < amountInWei) {
        throw new Error(
          `Insufficient token balance. You have ${ethers.formatUnits(balance, decimals)} tokens but need ${amount} tokens`,
        );
      }

      // Check current allowance
      const currentAllowance = await tokenContract.allowance(this.signerAddress, this.contractAddress);
      console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, decimals)} tokens`);

      // If allowance is insufficient, approve
      if (currentAllowance < amountInWei) {
        console.log("Approving token spending...");

        // First reset allowance to 0 if needed (some tokens require this)
        if (currentAllowance > 0) {
          console.log("Resetting allowance to 0 first...");
          await this.executeTokenTransaction(tokenAddress, "approve", [this.contractAddress, 0]);
          console.log("Allowance reset to 0");
        }

        // Now set the new allowance
        const approveResult = await this.executeTokenTransaction(tokenAddress, "approve", [
          this.contractAddress,
          amountInWei,
        ]);
        console.log("✅ Token approved, signature:", approveResult.signature);

        // Verify the allowance was set correctly
        const newAllowance = await tokenContract.allowance(this.signerAddress, this.contractAddress);
        console.log(`New allowance: ${ethers.formatUnits(newAllowance, decimals)} tokens`);

        if (newAllowance < amountInWei) {
          throw new Error("Approval failed - allowance not set correctly");
        }
      } else {
        console.log("Sufficient allowance already exists");
      }

      // Make the donation
      console.log("Making token donation...");
      const result = await this.executeTransaction("donateTokenToContent", [
        username,
        platform,
        tokenAddress,
        amountInWei,
      ]);
      console.log("✅ Token donation successful, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Token donation failed:", error);
      throw this.handleError(error, "Token donation failed");
    }
  }

  /**
   * Helper function to execute token contract transactions
   * @param tokenAddress The token contract address
   * @param functionName The function name
   * @param args The function arguments
   */
  private async executeTokenTransaction(tokenAddress: string, functionName: string, args: any[] = []) {
    const tokenABI = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function transfer(address to, uint256 amount) returns (bool)",
    ];

    // Create contract interface to encode the function call
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
    const data = tokenContract.interface.encodeFunctionData(functionName, args);

    // Estimate gas
    const gasEstimate = await this.provider.estimateGas({
      to: tokenAddress,
      from: this.signerAddress,
      data: data,
    });

    // Get current gas price
    const feeData = await this.provider.getFeeData();

    // Prepare transaction
    const tx = {
      to: tokenAddress,
      data: data,
      gas: gasEstimate.toString(),
      gasPrice: feeData.gasPrice?.toString() || "20000000000",
    };

    // Sign transaction using Privy
    const { signature } = await this.signTransactionFn(tx, {
      address: this.signerAddress,
    });

    return { signature, txHash: signature };
  }

  // ===================== WITHDRAWAL FUNCTIONS =====================

  /**
   * Withdraw ETH earnings for the connected user
   */
  async withdrawEthEarnings() {
    try {
      console.log("Withdrawing ETH earnings...");
      const result = await this.executeTransaction("withdrawEthEarnings");
      console.log("✅ ETH withdrawal successful, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
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
      const result = await this.executeTransaction("withdrawTokenEarnings", [tokenAddress]);
      console.log("✅ Token withdrawal successful, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
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
      const result = await this.executeTransaction("withdrawAllEarnings");
      console.log("✅ All earnings withdrawal successful, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("All earnings withdrawal failed:", error);
      throw this.handleError(error, "All earnings withdrawal failed");
    }
  }

  // ===================== VIEW/READ FUNCTIONS =====================

  /**
   * Get content information
   * @param username The username
   * @param platform The platform
   */
  async getContent(username: string, platform: string) {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const content = await contract.getContent(username, platform);
      return {
        username: content[0],
        platform: content[1],
        owner: content[2],
        totalDonationsReceived: content[3],
        donationCount: content[4],
        isActive: content[5],
        createdAt: content[6],
      };
    } catch (error: any) {
      console.error("Failed to get content:", error);
      throw this.handleError(error, "Failed to get content");
    }
  }

  /**
   * Check if content exists
   * @param username The username to check
   * @param platform The platform to check
   */
  async contentExists(username: string, platform: string): Promise<boolean> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      return await contract.contentExistsCheck(username, platform);
    } catch (error: any) {
      console.error("Failed to check content existence:", error);
      return false;
    }
  }

  /**
   * Get all content keys (username@platform) by a creator
   * @param creatorAddress The creator's address
   */
  async getCreatorContents(creatorAddress: string): Promise<string[]> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      return await contract.getCreatorContents(creatorAddress);
    } catch (error: any) {
      console.error("Failed to get creator contents:", error);
      throw this.handleError(error, "Failed to get creator contents");
    }
  }

  /**
   * Get donation IDs for a specific content
   * @param username The username
   * @param platform The platform
   */
  async getContentDonations(username: string, platform: string): Promise<number[]> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const donations = await contract.getContentDonations(username, platform);
      return donations.map((id: any) => Number(id));
    } catch (error: any) {
      console.error("Failed to get content donations:", error);
      throw this.handleError(error, "Failed to get content donations");
    }
  }

  /**
   * Get recent donations for a content
   * @param username The username
   * @param platform The platform
   * @param limit Number of recent donations to fetch
   */
  async getRecentDonations(username: string, platform: string, limit: number = 10): Promise<number[]> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const donations = await contract.getRecentDonations(username, platform, limit);
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
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const donation = await contract.getDonation(donationId);
      return {
        donor: donation[0],
        contentOwner: donation[1],
        amount: donation[2],
        timestamp: donation[3],
        contentUsername: donation[4],
        contentPlatform: donation[5],
        token: donation[6],
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
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      return await contract.getCreatorEarnings(creatorAddress, tokenAddress);
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
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const result = await contract.getCreatorAllEarnings(creatorAddress);
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
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      return await contract.getDonorTotalDonations(donorAddress, tokenAddress);
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
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const result = await contract.getDonorAllDonations(donorAddress);
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
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const result = await contract.getSupportedTokens();
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
   * Get supported platforms
   */
  async getSupportedPlatforms(): Promise<string[]> {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      return await contract.getSupportedPlatforms();
    } catch (error: any) {
      console.error("Failed to get supported platforms:", error);
      throw this.handleError(error, "Failed to get supported platforms");
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    try {
      const contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      const result = await contract.getPlatformStats();
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
      const result = await this.executeTransaction("addSupportedToken", [tokenAddress, symbol]);
      console.log("✅ Token added successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
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
      const result = await this.executeTransaction("removeSupportedToken", [tokenAddress]);
      console.log("✅ Token removed successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Remove token failed:", error);
      throw this.handleError(error, "Remove token failed");
    }
  }

  /**
   * Add a supported platform (only contract owner)
   * @param platform The platform name to add
   */
  async addSupportedPlatform(platform: string) {
    try {
      console.log("Adding supported platform:", platform);
      const result = await this.executeTransaction("addSupportedPlatform", [platform]);
      console.log("✅ Platform added successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Add platform failed:", error);
      throw this.handleError(error, "Add platform failed");
    }
  }

  /**
   * Remove a supported platform (only contract owner)
   * @param platform The platform name to remove
   */
  async removeSupportedPlatform(platform: string) {
    try {
      console.log("Removing supported platform:", platform);
      const result = await this.executeTransaction("removeSupportedPlatform", [platform]);
      console.log("✅ Platform removed successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
    } catch (error: any) {
      console.error("Remove platform failed:", error);
      throw this.handleError(error, "Remove platform failed");
    }
  }

  /**
   * Update platform fee (only contract owner)
   * @param newFee New fee in basis points (e.g., 250 = 2.5%)
   */
  async updatePlatformFee(newFee: number) {
    try {
      console.log("Updating platform fee to:", newFee);
      const result = await this.executeTransaction("updatePlatformFee", [newFee]);
      console.log("✅ Platform fee updated successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
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
      const result = await this.executeTransaction("withdrawPlatformFeesEth");
      console.log("✅ Platform ETH fees withdrawn successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
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
      const result = await this.executeTransaction("withdrawPlatformFeesToken", [tokenAddress]);
      console.log("✅ Platform token fees withdrawn successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
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
      const result = await this.executeTransaction("withdrawAllPlatformFees");
      console.log("✅ All platform fees withdrawn successfully, signature:", result.signature);
      return { success: true, txHash: result.txHash, signature: result.signature };
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
    return new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
  }

  /**
   * Parse username@platform key into components
   * @param key The username@platform key
   */
  parseContentKey(key: string): { username: string; platform: string } {
    const parts = key.split("@");
    if (parts.length !== 2) {
      throw new Error("Invalid content key format. Expected username@platform");
    }
    return {
      username: parts[0],
      platform: parts[1],
    };
  }

  /**
   * Create username@platform key from components
   * @param username The username
   * @param platform The platform
   */
  createContentKey(username: string, platform: string): string {
    return `${username}@${platform}`;
  }

  /**
   * Check token balance and allowance
   * @param tokenAddress The token address
   * @param decimals Token decimals (default: 18)
   */
  async checkTokenStatus(tokenAddress: string, decimals: number = 18) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function balanceOf(address account) view returns (uint256)",
          "function symbol() view returns (string)",
          "function name() view returns (string)",
        ],
        this.provider,
      );

      const balance = await tokenContract.balanceOf(this.signerAddress);
      const allowance = await tokenContract.allowance(this.signerAddress, this.contractAddress);
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
    } else if (error.message.includes("Old content does not exist")) {
      return new Error("Original content does not exist");
    } else if (error.message.includes("Content is not active")) {
      return new Error("Content is not active");
    } else if (error.message.includes("Not the contract owner")) {
      return new Error("You are not the contract owner");
    } else if (error.message.includes("Token not supported")) {
      return new Error("Token is not supported by the platform");
    } else if (error.message.includes("Platform not supported")) {
      return new Error("Platform is not supported");
    } else if (error.message.includes("Username cannot be empty")) {
      return new Error("Username cannot be empty");
    } else if (error.message.includes("Platform cannot be empty")) {
      return new Error("Platform cannot be empty");
    } else if (error.message.includes("Content already registered")) {
      return new Error("Content with this username and platform already exists");
    } else if (error.message.includes("New username already exists")) {
      return new Error("New username already exists on this platform");
    } else if (error.message.includes("New username cannot be empty")) {
      return new Error("New username cannot be empty");
    } else if (error.message.includes("Platform already supported")) {
      return new Error("Platform is already supported");
    } else if (error.message.includes("Same owner")) {
      return new Error("Cannot transfer to the same owner");
    } else {
      return new Error(`${defaultMessage}: ${error.message}`);
    }
  }
}

// ===================== HELPER FUNCTIONS =====================

/**
 * Initialize PisangContract with Privy wallet connection
 * @param provider Browser provider
 * @param signerAddress The signer's address
 * @param signTransactionFn Privy's sign transaction function
 * @returns PisangContractFunctions instance
 */
export async function initializePisangContract(
  provider: ethers.BrowserProvider,
  signerAddress: string,
  signTransactionFn: (input: any, options?: any) => Promise<{ signature: string }>,
): Promise<PisangContractFunctions> {
  try {
    return new PisangContractFunctions(provider, signerAddress, signTransactionFn);
  } catch (error: any) {
    console.error("Failed to initialize PisangContract:", error);
    throw new Error(`Failed to initialize contract: ${error.message}`);
  }
}

/**
 * @deprecated Use Privy wallet connection instead
 * Connect wallet and initialize contract (Legacy function - use Privy instead)
 * @returns Object with connection status and contract instance
 */
export async function connectWalletAndInitializeContract() {
  console.warn("This function is deprecated. Please use Privy wallet connection instead.");
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please install MetaMask!");
    }

    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const accounts = await provider.send("eth_requestAccounts", []);
    const account = accounts[0];

    console.log("Connected account:", account);

    return {
      success: true,
      account,
      provider,
      message: "Wallet connected successfully! Note: This is a legacy connection method.",
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

// ===================== TYPES =====================

export interface ContentInfo {
  username: string;
  platform: string;
  owner: string;
  totalDonationsReceived: bigint;
  donationCount: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export interface DonationInfo {
  donor: string;
  contentOwner: string;
  amount: bigint;
  timestamp: bigint;
  contentUsername: string;
  contentPlatform: string;
  token: string;
}

export interface EarningsInfo {
  tokens: string[];
  amounts: bigint[];
  symbols: string[];
}

export interface PlatformStats {
  totalContents: bigint;
  totalDonations: bigint;
  platformFee: bigint;
}

export interface TokenStatus {
  balance: string;
  allowance: string;
  balanceRaw: bigint;
  allowanceRaw: bigint;
  symbol: string;
  name: string;
}

// ===================== CONSTANTS =====================

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Supported platforms
export const SUPPORTED_PLATFORMS = ["twitch", "youtube", "facebook", "tiktok", "instagram", "twitter"] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

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

// ===================== HELPER UTILITIES =====================

/**
 * Validate platform name
 * @param platform The platform to validate
 */
export function validatePlatform(platform: string): boolean {
  return SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform);
}

/**
 * Validate username format
 * @param username The username to validate
 */
export function validateUsername(username: string): boolean {
  if (!username || username.trim().length === 0) {
    return false;
  }
  // Add more validation rules as needed
  return true;
}

/**
 * Parse content key into username and platform
 * @param key The username@platform key
 */
export function parseContentKey(key: string): { username: string; platform: string } {
  const parts = key.split("@");
  if (parts.length !== 2) {
    throw new Error("Invalid content key format. Expected username@platform");
  }
  return {
    username: parts[0],
    platform: parts[1],
  };
}

/**
 * Create content key from username and platform
 * @param username The username
 * @param platform The platform
 */
export function createContentKey(username: string, platform: string): string {
  return `${username}@${platform}`;
}
