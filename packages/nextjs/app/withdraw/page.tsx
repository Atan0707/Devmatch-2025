"use client";

import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { NextPage } from "next";
import { createPublicClient, createWalletClient, custom, formatEther, http } from "viem";
import { baseSepolia } from "viem/chains";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { Address } from "~~/components/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

const Withdraw: NextPage = () => {
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [error, setError] = useState("");
  const [availableBalance, setAvailableBalance] = useState<{
    eth: string;
    tokens: Array<{ address: string; amount: string; symbol: string }>;
  }>({
    eth: "0",
    tokens: [],
  });
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Get user wallet info
  const connectedWallet = wallets.find(wallet => wallet.walletClientType !== "privy");
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const activeWallet = connectedWallet || embeddedWallet;
  const isUserConnected = authenticated && activeWallet;
  const userAddress = activeWallet?.address;

  // Get contract info
  const contractInfo = deployedContracts[baseSepolia.id]?.PisangContract;

  // Fetch user earnings from contract
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!userAddress || !contractInfo || !ready) {
        setIsLoadingBalance(false);
        return;
      }

      try {
        setIsLoadingBalance(true);

        // Create public client for reading contract
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Get creator earnings for all tokens
        const [tokens, amounts, symbols] = (await publicClient.readContract({
          address: contractInfo.address as `0x${string}`,
          abi: contractInfo.abi,
          functionName: "getCreatorAllEarnings",
          args: [userAddress as `0x${string}`],
        })) as [string[], bigint[], string[]];

        // Process the earnings data
        const ethAmount = amounts[0]; // First is always ETH
        const tokenEarnings = [];

        // Process token earnings (skip first element which is ETH)
        for (let i = 1; i < tokens.length; i++) {
          if (amounts[i] > 0n) {
            tokenEarnings.push({
              address: tokens[i],
              amount: formatEther(amounts[i]),
              symbol: symbols[i],
            });
          }
        }

        setAvailableBalance({
          eth: formatEther(ethAmount),
          tokens: tokenEarnings,
        });
      } catch (error) {
        console.error("Error fetching earnings:", error);
        notification.error("Failed to fetch earnings");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchEarnings();
  }, [userAddress, contractInfo, ready]);

  // Show loading state while Privy is initializing
  if (isPrivyAvailable && !ready) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isUserConnected) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-warning text-warning-content p-8 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Wallet Required</h2>
          <p className="mb-4">Please connect your wallet to access withdrawals.</p>
          <p className="text-sm">Use the wallet connect button in the header above.</p>
        </div>
      </div>
    );
  }

  // Form validation
  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return false;
    }
    const ethBalance = parseFloat(availableBalance.eth);
    if (numAmount > ethBalance) {
      setError(`Insufficient balance. Available: ${ethBalance.toFixed(6)} ETH`);
      return false;
    }
    setError("");
    return true;
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!validateAmount(withdrawAmount) || !activeWallet || !contractInfo) return;

    setIsWithdrawing(true);
    setError("");

    try {
      // Create wallet client for writing to contract
      await activeWallet.switchChain(baseSepolia.id);
      const provider = await activeWallet.getEthereumProvider();

      const walletClient = createWalletClient({
        account: userAddress as `0x${string}`,
        chain: baseSepolia,
        transport: custom(provider),
      });

      notification.info("Initiating withdrawal transaction...");

      // Call withdrawAllEarnings function
      const txHash = await walletClient.writeContract({
        address: contractInfo.address as `0x${string}`,
        abi: contractInfo.abi,
        functionName: "withdrawAllEarnings",
        args: [],
      });

      notification.success("Transaction submitted! Waiting for confirmation...");

      // Wait for transaction confirmation
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === "success") {
        setWithdrawalSuccess(true);
        setWithdrawAmount("");
        notification.success("Withdrawal successful! Funds have been transferred to your wallet.");

        // Refresh balance
        const [tokens, amounts, symbols] = (await publicClient.readContract({
          address: contractInfo.address as `0x${string}`,
          abi: contractInfo.abi,
          functionName: "getCreatorAllEarnings",
          args: [userAddress as `0x${string}`],
        })) as [string[], bigint[], string[]];

        const ethAmount = amounts[0];
        const tokenEarnings = [];
        for (let i = 1; i < tokens.length; i++) {
          if (amounts[i] > 0n) {
            tokenEarnings.push({
              address: tokens[i],
              amount: formatEther(amounts[i]),
              symbol: symbols[i],
            });
          }
        }

        setAvailableBalance({
          eth: formatEther(ethAmount),
          tokens: tokenEarnings,
        });

        // Reset success state after 5 seconds
        setTimeout(() => setWithdrawalSuccess(false), 5000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      if (error.message?.includes("No earnings to withdraw")) {
        setError("No earnings available to withdraw");
      } else if (error.message?.includes("User rejected")) {
        setError("Transaction was rejected");
      } else {
        setError("Withdrawal failed. Please try again.");
      }
      notification.error("Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
      setError("");
    }
  };

  // Set max amount
  const setMaxAmount = () => {
    setWithdrawAmount(availableBalance.eth);
    setError("");
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Withdraw Funds</h1>
            <p className="text-base-content/70">Withdraw your earnings to your wallet</p>
          </div>

          {/* Wallet Info */}
          <div className="bg-base-100 p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">Wallet Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Connected Address:</span>
                <Address address={userAddress} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">Available Balance:</span>
                {isLoadingBalance ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {parseFloat(availableBalance.eth).toFixed(6)} ETH
                    </div>
                    {availableBalance.tokens.length > 0 && (
                      <div className="text-sm text-base-content/70">
                        {availableBalance.tokens.map((token, index) => (
                          <div key={index}>
                            {parseFloat(token.amount).toFixed(4)} {token.symbol}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="bg-base-100 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-6">Withdrawal Details</h3>

            <div className="space-y-6">
              {/* Amount Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Withdrawal Amount (ETH)</span>
                </label>
                <div className="input-group">
                  <span className="bg-base-200 px-4 flex items-center">Ξ</span>
                  <input
                    type="text"
                    placeholder="0.000000"
                    className={`input input-bordered flex-1 text-right ${error ? "input-error" : ""}`}
                    value={withdrawAmount}
                    onChange={handleAmountChange}
                    disabled={isWithdrawing || isLoadingBalance}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={setMaxAmount}
                    disabled={isWithdrawing || isLoadingBalance || parseFloat(availableBalance.eth) === 0}
                  >
                    MAX
                  </button>
                </div>
                {error && (
                  <label className="label">
                    <span className="label-text-alt text-error">{error}</span>
                  </label>
                )}
              </div>

              {/* Withdrawal Summary */}
              {withdrawAmount && !error && (
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Withdrawal Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Withdrawal Method:</span>
                      <span>All Available Earnings</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ETH Amount:</span>
                      <span>{parseFloat(availableBalance.eth).toFixed(6)} ETH</span>
                    </div>
                    {availableBalance.tokens.length > 0 && (
                      <div className="flex justify-between">
                        <span>Tokens:</span>
                        <div className="text-right">
                          {availableBalance.tokens.map((token, index) => (
                            <div key={index}>
                              {parseFloat(token.amount).toFixed(4)} {token.symbol}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Network Fee:</span>
                      <span>Estimated gas fee</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {withdrawalSuccess && (
                <div className="alert alert-success">
                  <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Withdrawal successful! Funds will arrive in your wallet shortly.</span>
                </div>
              )}

              {/* Withdraw Button */}
              <button
                type="button"
                className={`btn btn-primary w-full ${isWithdrawing ? "loading" : ""}`}
                onClick={handleWithdraw}
                disabled={
                  parseFloat(availableBalance.eth) === 0 || isWithdrawing || withdrawalSuccess || isLoadingBalance
                }
              >
                {isWithdrawing ? "Processing Withdrawal..." : "Withdraw All Earnings"}
              </button>

              {/* Info Note */}
              <div className="bg-info/10 border border-info/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-info mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-info mb-1">Withdrawal Information</p>
                    <ul className="space-y-1 text-base-content/70">
                      <li>• Withdrawals will transfer all your available earnings (ETH + tokens)</li>
                      <li>• Transactions are processed on Base Sepolia testnet</li>
                      <li>• Network fees are paid from your wallet balance</li>
                      <li>• Once confirmed, funds will appear in your connected wallet</li>
                      <li>• You can only withdraw earnings from donations received</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Withdraw;
