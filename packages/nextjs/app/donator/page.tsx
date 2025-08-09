"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useSignTransaction, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { Address } from "~~/components/scaffold-eth";
import { PisangContractFunctions } from "~~/contracts/contractFunction";

const Donator: NextPage = () => {
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

  // Wallet and Contract State
  const [isContractConnected, setIsContractConnected] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [pisangContract, setPisangContract] = useState<PisangContractFunctions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Donations data
  const [receivedDonations, setReceivedDonations] = useState<any>(null);
  const [creatorContents, setCreatorContents] = useState<string[]>([]);
  const [contentDonations, setContentDonations] = useState<{ [key: string]: any }>({});

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);

      if (!isPrivyAvailable || !authenticated || !wallets.length) {
        throw new Error("Please connect your wallet first");
      }

      const wallet = wallets[0]; // Use the first wallet
      const walletAddress = wallet.address;

      // Create ethers provider from Privy wallet
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);

      // Initialize contract with Privy signing
      const pisangContract = new PisangContractFunctions(ethersProvider, walletAddress, signTransaction);

      setIsContractConnected(true);
      setAccount(walletAddress);
      setPisangContract(pisangContract);
      setSuccess("Wallet connected successfully!");

      // Load donation data after connecting
      await loadDonationData(pisangContract, walletAddress);
    } catch (err: any) {
      console.error("Failed to connect to contract:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isPrivyAvailable, authenticated, wallets, signTransaction]);

  const loadDonationData = async (contract: PisangContractFunctions, address: string) => {
    try {
      setLoading(true);

      // Get creator earnings (donations received)
      const earnings = await contract.getCreatorAllEarnings(address);
      setReceivedDonations(earnings);

      // Get creator contents
      const contents = await contract.getCreatorContents(address);
      setCreatorContents(contents);

      // Get donations for each content
      const contentDonationsMap: { [key: string]: any } = {};
      for (const contentKey of contents) {
        try {
          const [username, platform] = contentKey.split("@");
          const recentDonations = await contract.getRecentDonations(username, platform, 50);

          // Get details for each donation
          const donationDetails = [];
          for (const donationId of recentDonations) {
            try {
              const donation = await contract.getDonation(donationId);
              donationDetails.push({
                id: donationId,
                ...donation,
              });
            } catch (err) {
              console.warn(`Failed to get donation ${donationId}:`, err);
            }
          }

          contentDonationsMap[contentKey] = donationDetails;
        } catch (err) {
          console.warn(`Failed to get donations for ${contentKey}:`, err);
        }
      }
      setContentDonations(contentDonationsMap);
    } catch (err: any) {
      console.error("Failed to load donation data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (pisangContract && account) {
      await loadDonationData(pisangContract, account);
    }
  };

  // Connect to contract when wallet is connected
  useEffect(() => {
    if (isPrivyAvailable && authenticated && wallets.length > 0) {
      connectWallet();
    }
  }, [isPrivyAvailable, authenticated, wallets, connectWallet]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const formatTokenAmount = (amount: bigint, symbol: string) => {
    // Convert bigint to string and format for display
    const amountStr = amount.toString();
    if (symbol === "ETH" || symbol === "") {
      // For ETH, divide by 10^18
      const ethAmount = Number(amountStr) / 1e18;
      return `${ethAmount.toFixed(6)} ETH`;
    } else {
      // For other tokens, assume 18 decimals for now
      const tokenAmount = Number(amountStr) / 1e18;
      return `${tokenAmount.toFixed(6)} ${symbol}`;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-3 text-white">📊 My Donations Dashboard</h1>
              <p className="text-gray-400 text-lg">View all donations received to your wallet address</p>
            </div>

            {/* Wallet Connection Status */}
            <div className="mb-8">
              {(() => {
                // Show loading state while Privy is initializing
                if (isPrivyAvailable && !ready) {
                  return (
                    <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 p-4 rounded-2xl backdrop-blur-sm">
                      <span>Initializing wallet connection...</span>
                      <span className="loading loading-spinner loading-sm ml-2"></span>
                    </div>
                  );
                }

                if (!isPrivyAvailable || !authenticated) {
                  return (
                    <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-300 p-4 rounded-2xl backdrop-blur-sm">
                      <span>Please connect your wallet to view your donations</span>
                    </div>
                  );
                }

                if (!isContractConnected) {
                  return (
                    <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 p-4 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                      <span>Connecting to contract...</span>
                      <div className="flex items-center space-x-2">
                        {loading && <span className="loading loading-spinner loading-sm"></span>}
                        {!loading && (
                          <button
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                            onClick={connectWallet}
                          >
                            Retry Connection
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                    <span className="flex items-center">
                      ✅ Connected: <Address address={account} />
                    </span>
                    <button
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                      onClick={refreshData}
                      disabled={loading}
                    >
                      {loading ? <span className="loading loading-spinner loading-xs"></span> : "🔄"} Refresh
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-300 p-4 rounded-2xl backdrop-blur-sm mb-6 flex items-center justify-between">
                <span>{error}</span>
                <button className="text-red-300 hover:text-red-100 p-1" onClick={clearMessages}>
                  ×
                </button>
              </div>
            )}
            {success && (
              <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-2xl backdrop-blur-sm mb-6 flex items-center justify-between">
                <span>{success}</span>
                <button className="text-green-300 hover:text-green-100 p-1" onClick={clearMessages}>
                  ×
                </button>
              </div>
            )}

            {/* Donations Dashboard */}
            {isContractConnected && (
              <div className="space-y-8">
                {/* Total Earnings Summary */}
                {receivedDonations && (
                  <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 shadow-2xl">
                    <h2 className="text-3xl font-bold mb-6 text-white">💰 Total Earnings Summary</h2>
                    {receivedDonations.tokens && receivedDonations.tokens.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {receivedDonations.tokens.map((token: string, index: number) => (
                          <div
                            key={index}
                            className="bg-gray-700/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20"
                          >
                            <div className="text-gray-400 text-sm mb-2">
                              {receivedDonations.symbols[index] || "Unknown Token"}
                            </div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                              {formatTokenAmount(receivedDonations.amounts[index], receivedDonations.symbols[index])}
                            </div>
                            <div className="text-gray-500 text-xs">
                              Token: {token.slice(0, 6)}...{token.slice(-4)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-lg mb-6">
                          No earnings yet. Register your content to start receiving donations!
                        </p>
                        <button
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                          onClick={() => (window.location.href = "/settings")}
                        >
                          Register Content
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* My Contents */}
                {creatorContents.length > 0 && (
                  <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 shadow-2xl">
                    <h2 className="text-3xl font-bold mb-6 text-white">📺 My Registered Contents</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {creatorContents.map((contentKey, index) => {
                        const [username, platform] = contentKey.split("@");
                        const donations = contentDonations[contentKey] || [];

                        return (
                          <div
                            key={index}
                            className="bg-gray-700/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-xl text-white">{username}</h3>
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {platform}
                              </span>
                            </div>
                            <div className="text-gray-400 mb-4">Total Donations: {donations.length}</div>

                            {donations.length > 0 && (
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                <h4 className="font-semibold text-white">Recent Donations:</h4>
                                {donations.slice(0, 5).map((donation: any, donationIndex: number) => (
                                  <div key={donationIndex} className="bg-gray-600/50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <Address address={donation.donor} />
                                      <span className="font-bold text-purple-400">
                                        {formatTokenAmount(donation.amount, donation.tokenSymbol)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Donation ID: {donation.id}</div>
                                  </div>
                                ))}
                                {donations.length > 5 && (
                                  <div className="text-center text-xs text-gray-500 pt-2">
                                    ... and {donations.length - 5} more donations
                                  </div>
                                )}
                              </div>
                            )}

                            {donations.length === 0 && (
                              <div className="text-center text-gray-400 py-6">No donations yet</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Content Registered */}
                {creatorContents.length === 0 && isContractConnected && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 p-8 rounded-2xl backdrop-blur-sm">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-6 text-white">📝 No Content Registered</h2>
                      <p className="text-gray-400 text-lg mb-6">
                        You haven&apos;t registered any content yet. Register your social media content to start
                        receiving donations!
                      </p>
                      <button
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                        onClick={() => (window.location.href = "/settings")}
                      >
                        Go to Settings to Register Content
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-gray-800/90 backdrop-blur-sm border border-purple-500/30 p-8 rounded-2xl">
                  <span className="loading loading-spinner loading-lg text-purple-400"></span>
                  <p className="mt-4 text-white">Processing transaction...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Donator;
