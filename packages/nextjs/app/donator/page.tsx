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
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">📊 My Donations Dashboard</h1>
            <p className="text-base-content/70">View all donations received to your wallet address</p>
          </div>

          {/* Wallet Connection Status */}
          <div className="mb-6">
            {(() => {
              // Show loading state while Privy is initializing
              if (isPrivyAvailable && !ready) {
                return (
                  <div className="alert alert-info">
                    <span>Initializing wallet connection...</span>
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                );
              }

              if (!isPrivyAvailable || !authenticated) {
                return (
                  <div className="alert alert-warning">
                    <span>Please connect your wallet to view your donations</span>
                  </div>
                );
              }

              if (!isContractConnected) {
                return (
                  <div className="alert alert-info">
                    <span>Connecting to contract...</span>
                    {loading && <span className="loading loading-spinner loading-sm"></span>}
                    {!loading && (
                      <button className="btn btn-sm" onClick={connectWallet}>
                        Retry Connection
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="alert alert-success">
                  <span>
                    ✅ Connected: <Address address={account} />
                  </span>
                  <button className="btn btn-sm btn-primary" onClick={refreshData} disabled={loading}>
                    {loading ? <span className="loading loading-spinner loading-xs"></span> : "🔄"} Refresh
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
              <button className="btn btn-sm btn-ghost" onClick={clearMessages}>
                ×
              </button>
            </div>
          )}
          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
              <button className="btn btn-sm btn-ghost" onClick={clearMessages}>
                ×
              </button>
            </div>
          )}

          {/* Donations Dashboard */}
          {isContractConnected && (
            <div className="space-y-6">
              {/* Total Earnings Summary */}
              {receivedDonations && (
                <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
                  <h2 className="text-2xl font-bold mb-4">💰 Total Earnings Summary</h2>
                  {receivedDonations.tokens && receivedDonations.tokens.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {receivedDonations.tokens.map((token: string, index: number) => (
                        <div key={index} className="stat bg-base-100 rounded-lg p-4">
                          <div className="stat-title text-sm opacity-70">
                            {receivedDonations.symbols[index] || "Unknown Token"}
                          </div>
                          <div className="stat-value text-lg">
                            {formatTokenAmount(receivedDonations.amounts[index], receivedDonations.symbols[index])}
                          </div>
                          <div className="stat-desc text-xs">
                            Token: {token.slice(0, 6)}...{token.slice(-4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-base-content/70">
                        No earnings yet. Register your content to start receiving donations!
                      </p>
                      <button className="btn btn-primary mt-4" onClick={() => (window.location.href = "/settings")}>
                        Register Content
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* My Contents */}
              {creatorContents.length > 0 && (
                <div className="card bg-base-100 p-6">
                  <h2 className="text-2xl font-bold mb-4">📺 My Registered Contents</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {creatorContents.map((contentKey, index) => {
                      const [username, platform] = contentKey.split("@");
                      const donations = contentDonations[contentKey] || [];

                      return (
                        <div key={index} className="card bg-base-200 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">{username}</h3>
                            <span className="badge badge-primary">{platform}</span>
                          </div>
                          <div className="text-sm text-base-content/70 mb-3">Total Donations: {donations.length}</div>

                          {donations.length > 0 && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              <h4 className="font-semibold text-sm">Recent Donations:</h4>
                              {donations.slice(0, 5).map((donation: any, donationIndex: number) => (
                                <div key={donationIndex} className="bg-base-100 p-2 rounded text-xs">
                                  <div className="flex justify-between items-center">
                                    <Address address={donation.donor} />
                                    <span className="font-bold">
                                      {formatTokenAmount(donation.amount, donation.tokenSymbol)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-base-content/50 mt-1">Donation ID: {donation.id}</div>
                                </div>
                              ))}
                              {donations.length > 5 && (
                                <div className="text-center text-xs text-base-content/50 pt-2">
                                  ... and {donations.length - 5} more donations
                                </div>
                              )}
                            </div>
                          )}

                          {donations.length === 0 && (
                            <div className="text-center text-sm text-base-content/50 py-4">No donations yet</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Content Registered */}
              {creatorContents.length === 0 && isContractConnected && (
                <div className="card bg-warning/10 p-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">📝 No Content Registered</h2>
                    <p className="text-base-content/70 mb-4">
                      You haven&apos;t registered any content yet. Register your social media content to start receiving
                      donations!
                    </p>
                    <button className="btn btn-primary" onClick={() => (window.location.href = "/settings")}>
                      Go to Settings to Register Content
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-base-100 p-6 rounded-lg">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-2">Processing transaction...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Donator;
