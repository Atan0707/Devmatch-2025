"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useSignTransaction, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { Address } from "~~/components/scaffold-eth";
import { COMMON_TOKENS, PisangContractFunctions, SUPPORTED_PLATFORMS } from "~~/contracts/contractFunction";

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

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("content");

  // Content Management State
  const [contentForm, setContentForm] = useState({
    username: "",
    platform: "twitch",
    newUsername: "",
    newOwner: "",
    oldUsername: "",
  });

  // Donation State
  const [donationForm, setDonationForm] = useState({
    username: "",
    platform: "twitch",
    ethAmount: "",
    tokenAddress: "",
    tokenAmount: "",
    tokenDecimals: "18",
  });

  // View State
  const [viewData, setViewData] = useState<any>(null);
  const [viewForm, setViewForm] = useState({
    username: "",
    platform: "twitch",
    address: "",
    tokenAddress: "",
    donationId: "",
  });

  // Admin State
  const [adminForm, setAdminForm] = useState({
    tokenAddress: "",
    tokenSymbol: "",
    platformName: "",
    platformFee: "",
  });

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
    } catch (err: any) {
      console.error("Failed to connect to contract:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isPrivyAvailable, authenticated, wallets, signTransaction]);

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

  const handleTransaction = async (operation: () => Promise<any>, successMessage: string) => {
    try {
      setLoading(true);
      clearMessages();
      const result = await operation();
      setSuccess(`${successMessage} - Transaction: ${result.txHash}`);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Content Management Functions
  const deactivateContent = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.deactivateContent(contentForm.username, contentForm.platform),
      "Content deactivated successfully",
    );
  };

  const reactivateContent = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.reactivateContent(contentForm.username, contentForm.platform),
      "Content reactivated successfully",
    );
  };

  const transferContentOwnership = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.transferContentOwnership(contentForm.username, contentForm.platform, contentForm.newOwner),
      "Content ownership transferred successfully",
    );
  };

  const changeUsername = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.changeUsername(contentForm.oldUsername, contentForm.newUsername, contentForm.platform),
      "Username changed successfully",
    );
  };

  // Donation Functions
  const donateEth = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.donateEthToContent(donationForm.username, donationForm.platform, donationForm.ethAmount),
      "ETH donation successful",
    );
  };

  const donateToken = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () =>
        pisangContract.donateTokenToContent(
          donationForm.username,
          donationForm.platform,
          donationForm.tokenAddress,
          donationForm.tokenAmount,
        ),
      "Token donation successful",
    );
  };

  // Withdrawal Functions
  const withdrawEthEarnings = async () => {
    if (!pisangContract) return;
    await handleTransaction(() => pisangContract.withdrawEthEarnings(), "ETH earnings withdrawn successfully");
  };

  const withdrawTokenEarnings = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.withdrawTokenEarnings(adminForm.tokenAddress),
      "Token earnings withdrawn successfully",
    );
  };

  const withdrawAllEarnings = async () => {
    if (!pisangContract) return;
    await handleTransaction(() => pisangContract.withdrawAllEarnings(), "All earnings withdrawn successfully");
  };

  // View Functions
  const getContentInfo = async () => {
    if (!pisangContract) return;
    try {
      setLoading(true);
      const content = await pisangContract.getContent(viewForm.username, viewForm.platform);
      setViewData({ type: "content", data: content });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCreatorEarnings = async () => {
    if (!pisangContract) return;
    try {
      setLoading(true);
      const earnings = await pisangContract.getCreatorAllEarnings(viewForm.address);
      setViewData({ type: "earnings", data: earnings });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDonationInfo = async () => {
    if (!pisangContract) return;
    try {
      setLoading(true);
      const donation = await pisangContract.getDonation(parseInt(viewForm.donationId));
      setViewData({ type: "donation", data: donation });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRecentDonations = async () => {
    if (!pisangContract) return;
    try {
      setLoading(true);
      const donations = await pisangContract.getRecentDonations(viewForm.username, viewForm.platform, 10);
      setViewData({ type: "recentDonations", data: donations });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Admin Functions
  const addSupportedToken = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.addSupportedToken(adminForm.tokenAddress, adminForm.tokenSymbol),
      "Token added successfully",
    );
  };

  const addSupportedPlatform = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.addSupportedPlatform(adminForm.platformName),
      "Platform added successfully",
    );
  };

  const updatePlatformFee = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.updatePlatformFee(parseInt(adminForm.platformFee)),
      "Platform fee updated successfully",
    );
  };

  const withdrawPlatformFeesEth = async () => {
    if (!pisangContract) return;
    await handleTransaction(() => pisangContract.withdrawPlatformFeesEth(), "Platform ETH fees withdrawn successfully");
  };

  const withdrawPlatformFeesToken = async () => {
    if (!pisangContract) return;
    await handleTransaction(
      () => pisangContract.withdrawPlatformFeesToken(adminForm.tokenAddress),
      "Platform token fees withdrawn successfully",
    );
  };

  const withdrawAllPlatformFees = async () => {
    if (!pisangContract) return;
    await handleTransaction(() => pisangContract.withdrawAllPlatformFees(), "All platform fees withdrawn successfully");
  };

  const tabs = [
    { id: "content", label: "Content Management", icon: "📝" },
    { id: "donate", label: "Donations", icon: "💰" },
    { id: "withdraw", label: "Withdrawals", icon: "💸" },
    { id: "view", label: "View Data", icon: "👁️" },
    { id: "admin", label: "Admin", icon: "⚙️" },
  ];

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">PisangContract Interface</h1>
            <p className="text-base-content/70">Complete interface for interacting with the PisangContract</p>
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
                    <span>Please connect your wallet to interact with the contract</span>
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

          {/* Tab Navigation */}
          <div className="tabs tabs-boxed mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-base-100 rounded-lg shadow-lg p-6">
            {/* Content Management Tab */}
            {activeTab === "content" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Content Management</h2>

                {/* Register Content Notice */}
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <div>
                    <h3 className="font-bold">Register Your Content First!</h3>
                    <div className="text-sm">
                      Go to Settings to register your social media content on the blockchain before using these
                      management features.
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-outline" onClick={() => (window.location.href = "/settings")}>
                      Go to Settings
                    </button>
                  </div>
                </div>

                {/* Content Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card bg-base-200 p-4">
                    <h3 className="text-lg font-semibold mb-3">Content Actions</h3>
                    <div className="space-y-2">
                      <button
                        className="btn btn-warning btn-sm w-full"
                        onClick={deactivateContent}
                        disabled={loading || !isContractConnected}
                      >
                        Deactivate Content
                      </button>
                      <button
                        className="btn btn-success btn-sm w-full"
                        onClick={reactivateContent}
                        disabled={loading || !isContractConnected}
                      >
                        Reactivate Content
                      </button>
                    </div>
                  </div>

                  <div className="card bg-base-200 p-4">
                    <h3 className="text-lg font-semibold mb-3">Transfer Ownership</h3>
                    <input
                      type="text"
                      placeholder="New Owner Address"
                      className="input input-bordered w-full mb-2"
                      value={contentForm.newOwner}
                      onChange={e => setContentForm({ ...contentForm, newOwner: e.target.value })}
                    />
                    <button
                      className="btn btn-secondary btn-sm w-full"
                      onClick={transferContentOwnership}
                      disabled={loading || !isContractConnected}
                    >
                      Transfer Ownership
                    </button>
                  </div>
                </div>

                {/* Change Username */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Change Username</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Old Username"
                      className="input input-bordered"
                      value={contentForm.oldUsername}
                      onChange={e => setContentForm({ ...contentForm, oldUsername: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="New Username"
                      className="input input-bordered"
                      value={contentForm.newUsername}
                      onChange={e => setContentForm({ ...contentForm, newUsername: e.target.value })}
                    />
                  </div>
                  <button
                    className="btn btn-info mt-3"
                    onClick={changeUsername}
                    disabled={loading || !isContractConnected}
                  >
                    Change Username
                  </button>
                </div>
              </div>
            )}

            {/* Donations Tab */}
            {activeTab === "donate" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Make Donations</h2>

                {/* Target Content */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Target Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Username"
                      className="input input-bordered"
                      value={donationForm.username}
                      onChange={e => setDonationForm({ ...donationForm, username: e.target.value })}
                    />
                    <select
                      className="select select-bordered"
                      value={donationForm.platform}
                      onChange={e => setDonationForm({ ...donationForm, platform: e.target.value })}
                    >
                      {SUPPORTED_PLATFORMS.map(platform => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ETH Donation */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Donate ETH</h3>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder="Amount in ETH"
                      className="input input-bordered flex-1"
                      step="0.001"
                      value={donationForm.ethAmount}
                      onChange={e => setDonationForm({ ...donationForm, ethAmount: e.target.value })}
                    />
                    <button className="btn btn-primary" onClick={donateEth} disabled={loading || !isContractConnected}>
                      Donate ETH
                    </button>
                  </div>
                </div>

                {/* Token Donation */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Donate Tokens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Token Address"
                      className="input input-bordered"
                      value={donationForm.tokenAddress}
                      onChange={e => setDonationForm({ ...donationForm, tokenAddress: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      className="input input-bordered"
                      step="0.000001"
                      value={donationForm.tokenAmount}
                      onChange={e => setDonationForm({ ...donationForm, tokenAmount: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder="Decimals (default: 18)"
                      className="input input-bordered flex-1"
                      value={donationForm.tokenDecimals}
                      onChange={e => setDonationForm({ ...donationForm, tokenDecimals: e.target.value })}
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={donateToken}
                      disabled={loading || !isContractConnected}
                    >
                      Donate Tokens
                    </button>
                  </div>
                </div>

                {/* Common Tokens */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Common Tokens</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(COMMON_TOKENS).map(([name, address]) => (
                      <button
                        key={name}
                        className="btn btn-outline btn-sm"
                        onClick={() => setDonationForm({ ...donationForm, tokenAddress: address })}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === "withdraw" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Withdraw Earnings</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card bg-base-200 p-4">
                    <h3 className="text-lg font-semibold mb-3">ETH Earnings</h3>
                    <button
                      className="btn btn-primary w-full"
                      onClick={withdrawEthEarnings}
                      disabled={loading || !isContractConnected}
                    >
                      Withdraw ETH
                    </button>
                  </div>

                  <div className="card bg-base-200 p-4">
                    <h3 className="text-lg font-semibold mb-3">Token Earnings</h3>
                    <input
                      type="text"
                      placeholder="Token Address"
                      className="input input-bordered w-full mb-2"
                      value={adminForm.tokenAddress}
                      onChange={e => setAdminForm({ ...adminForm, tokenAddress: e.target.value })}
                    />
                    <button
                      className="btn btn-secondary w-full"
                      onClick={withdrawTokenEarnings}
                      disabled={loading || !isContractConnected}
                    >
                      Withdraw Token
                    </button>
                  </div>

                  <div className="card bg-base-200 p-4">
                    <h3 className="text-lg font-semibold mb-3">All Earnings</h3>
                    <button
                      className="btn btn-accent w-full"
                      onClick={withdrawAllEarnings}
                      disabled={loading || !isContractConnected}
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View Data Tab */}
            {activeTab === "view" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">View Contract Data</h2>

                {/* View Forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card bg-base-200 p-4">
                    <h3 className="text-lg font-semibold mb-3">Content Info</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Username"
                        className="input input-bordered w-full"
                        value={viewForm.username}
                        onChange={e => setViewForm({ ...viewForm, username: e.target.value })}
                      />
                      <select
                        className="select select-bordered w-full"
                        value={viewForm.platform}
                        onChange={e => setViewForm({ ...viewForm, platform: e.target.value })}
                      >
                        {SUPPORTED_PLATFORMS.map(platform => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary btn-sm w-full"
                        onClick={getContentInfo}
                        disabled={loading || !isContractConnected}
                      >
                        Get Content Info
                      </button>
                      <button
                        className="btn btn-secondary btn-sm w-full"
                        onClick={getRecentDonations}
                        disabled={loading || !isContractConnected}
                      >
                        Get Recent Donations
                      </button>
                    </div>
                  </div>

                  <div className="card bg-base-200 p-4">
                    <h3 className="text-lg font-semibold mb-3">Creator Earnings</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Creator Address"
                        className="input input-bordered w-full"
                        value={viewForm.address}
                        onChange={e => setViewForm({ ...viewForm, address: e.target.value })}
                      />
                      <button
                        className="btn btn-info btn-sm w-full"
                        onClick={getCreatorEarnings}
                        disabled={loading || !isContractConnected}
                      >
                        Get Creator Earnings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Donation Info</h3>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder="Donation ID"
                      className="input input-bordered flex-1"
                      value={viewForm.donationId}
                      onChange={e => setViewForm({ ...viewForm, donationId: e.target.value })}
                    />
                    <button
                      className="btn btn-accent"
                      onClick={getDonationInfo}
                      disabled={loading || !isContractConnected}
                    >
                      Get Donation Info
                    </button>
                  </div>
                </div>

                {/* Display Results */}
                {viewData && (
                  <div className="card bg-base-300 p-4">
                    <h3 className="text-lg font-semibold mb-3">Results</h3>
                    <pre className="bg-base-100 p-4 rounded text-sm overflow-auto max-h-96">
                      {JSON.stringify(
                        viewData,
                        (key, value) => (typeof value === "bigint" ? value.toString() : value),
                        2,
                      )}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Admin Tab */}
            {activeTab === "admin" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Admin Functions</h2>
                <div className="alert alert-warning">
                  <span>⚠️ These functions are only available to the contract owner</span>
                </div>

                {/* Token Management */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Token Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Token Address"
                      className="input input-bordered"
                      value={adminForm.tokenAddress}
                      onChange={e => setAdminForm({ ...adminForm, tokenAddress: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Token Symbol"
                      className="input input-bordered"
                      value={adminForm.tokenSymbol}
                      onChange={e => setAdminForm({ ...adminForm, tokenSymbol: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={addSupportedToken}
                      disabled={loading || !isContractConnected}
                    >
                      Add Token
                    </button>
                  </div>
                </div>

                {/* Platform Management */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Platform Management</h3>
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Platform Name"
                      className="input input-bordered flex-1"
                      value={adminForm.platformName}
                      onChange={e => setAdminForm({ ...adminForm, platformName: e.target.value })}
                    />
                    <button
                      className="btn btn-success"
                      onClick={addSupportedPlatform}
                      disabled={loading || !isContractConnected}
                    >
                      Add Platform
                    </button>
                  </div>
                </div>

                {/* Fee Management */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Fee Management</h3>
                  <div className="flex gap-4 mb-4">
                    <input
                      type="number"
                      placeholder="Platform Fee (basis points, e.g., 250 = 2.5%)"
                      className="input input-bordered flex-1"
                      value={adminForm.platformFee}
                      onChange={e => setAdminForm({ ...adminForm, platformFee: e.target.value })}
                    />
                    <button
                      className="btn btn-warning"
                      onClick={updatePlatformFee}
                      disabled={loading || !isContractConnected}
                    >
                      Update Fee
                    </button>
                  </div>
                </div>

                {/* Platform Fee Withdrawals */}
                <div className="card bg-base-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Withdraw Platform Fees</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={withdrawPlatformFeesEth}
                      disabled={loading || !isContractConnected}
                    >
                      Withdraw ETH Fees
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={withdrawPlatformFeesToken}
                      disabled={loading || !isContractConnected}
                    >
                      Withdraw Token Fees
                    </button>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={withdrawAllPlatformFees}
                      disabled={loading || !isContractConnected}
                    >
                      Withdraw All Fees
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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
