"use client";

import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { NextPage } from "next";
import { createPublicClient, formatEther, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// Types for dashboard data
interface EarningsData {
  eth: string;
  tokens: Array<{ address: string; amount: string; symbol: string }>;
  totalUsdValue: number;
}

interface UserContents {
  contents: string[];
  totalDonationCount: number;
}

const Dashboard: NextPage = () => {
  const { isConnected } = useAccount();
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // State for dashboard data
  const [earningsData, setEarningsData] = useState<EarningsData>({
    eth: "0",
    tokens: [],
    totalUsdValue: 0,
  });
  const [userContents, setUserContents] = useState<UserContents>({
    contents: [],
    totalDonationCount: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string>("");

  // Get user wallet info
  const connectedWallet = wallets.find(wallet => wallet.walletClientType !== "privy");
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
  const activeWallet = connectedWallet || embeddedWallet;
  const userAddress = activeWallet?.address;

  // Get contract info
  const contractInfo = deployedContracts[baseSepolia.id]?.PisangContract;

  // Fetch total platform stats using Scaffold hooks
  const { data: totalContents } = useScaffoldReadContract({
    contractName: "PisangContract",
    functionName: "totalContents",
  });

  const { data: totalDonations } = useScaffoldReadContract({
    contractName: "PisangContract",
    functionName: "totalDonations",
  });

  // Fetch user earnings from contract
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userAddress || !contractInfo || !ready) {
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        setError("");

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

        // Get user's content list
        const userContentsList = (await publicClient.readContract({
          address: contractInfo.address as `0x${string}`,
          abi: contractInfo.abi,
          functionName: "getCreatorContents",
          args: [userAddress as `0x${string}`],
        })) as string[];

        // Calculate total donation count for user's contents
        let totalUserDonations = 0;
        for (const contentKey of userContentsList) {
          // Parse username and platform from contentKey (format: "username@platform")
          const [username, platform] = contentKey.split("@");
          if (username && platform) {
            try {
              const contentData = (await publicClient.readContract({
                address: contractInfo.address as `0x${string}`,
                abi: contractInfo.abi,
                functionName: "getContent",
                args: [username, platform],
              })) as [string, string, string, bigint, bigint, boolean, bigint];

              // contentData[4] is donationCount
              totalUserDonations += Number(contentData[4]);
            } catch (err) {
              console.warn(`Failed to fetch data for content: ${contentKey}`, err);
            }
          }
        }

        // Process the earnings data
        const ethAmount = amounts[0]; // First is always ETH
        const tokenEarnings = [];
        let totalUsdValue = 0;

        // Estimate ETH value in USD (rough estimate)
        const ethInUsd = parseFloat(formatEther(ethAmount)) * 2000; // Rough ETH price
        totalUsdValue += ethInUsd;

        // Process token earnings (skip first element which is ETH)
        for (let i = 1; i < tokens.length; i++) {
          const tokenAmount = amounts[i];
          let formattedAmount;
          let usdValue = 0;

          // Handle different token decimals
          if (symbols[i] === "USDC") {
            // USDC has 6 decimals
            formattedAmount = (Number(tokenAmount) / 1e6).toString();
            usdValue = parseFloat(formattedAmount); // USDC is ~$1
          } else {
            // Default to 18 decimals like ETH
            formattedAmount = formatEther(tokenAmount);
            // For other tokens, estimate at $1 for simplicity
            usdValue = parseFloat(formattedAmount);
          }

          totalUsdValue += usdValue;

          tokenEarnings.push({
            address: tokens[i],
            amount: formattedAmount,
            symbol: symbols[i],
          });
        }

        setEarningsData({
          eth: formatEther(ethAmount),
          tokens: tokenEarnings,
          totalUsdValue,
        });

        setUserContents({
          contents: userContentsList,
          totalDonationCount: totalUserDonations,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to fetch dashboard data");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, [userAddress, contractInfo, ready]);

  // Show loading state while Privy is initializing
  if (isPrivyAvailable && !ready) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Check if user is connected (either via Privy or direct wallet connection)
  const isUserConnected = (isPrivyAvailable && authenticated) || isConnected;

  if (!isUserConnected) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-warning text-warning-content p-8 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Wallet Required</h2>
          <p className="mb-4">Please connect your wallet to access the dashboard.</p>
          <p className="text-sm">Use the wallet connect button in the header above.</p>
        </div>
      </div>
    );
  }

  // Get current month and year for display
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-purple-400"></span>
            <p className="text-gray-400 mt-4">Loading dashboard data...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-error/10 border border-error/20 text-error p-8 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Error Loading Dashboard</h2>
            <p className="mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-error btn-outline">
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  // Get the primary USDC earnings for display
  const usdcToken = earningsData.tokens.find(token => token.symbol === "USDC");
  const displayEarnings = usdcToken ? parseFloat(usdcToken.amount) : earningsData.totalUsdValue;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-6xl mx-auto">
            {/* Dashboard Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-3 text-white">Dashboard</h1>
              <p className="text-gray-400 text-lg">
                {currentMonth} {currentYear} Summary
              </p>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Total Earnings Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Total Earnings</h3>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    USDC
                  </div>
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                  ${displayEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-gray-400">Total lifetime earnings</p>
              </div>

              {/* Donations Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Donations</h3>
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Count
                  </div>
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
                  {userContents.totalDonationCount}
                </div>
                <p className="text-gray-400">Total donations received</p>
              </div>
            </div>

            {/* Additional Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Content Status Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Registered Contents</h4>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-gray-400 text-sm mb-2">Total Registered</p>
                <p className="text-green-400 font-medium text-2xl">{userContents.contents.length}</p>
              </div>

              {/* ETH Balance Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">ETH Balance</h4>
                  <div className="text-purple-400">💰</div>
                </div>
                <p className="text-gray-400 text-sm mb-2">Available</p>
                <p className="text-purple-400 font-medium text-xl">{parseFloat(earningsData.eth).toFixed(4)} ETH</p>
              </div>

              {/* Platform Stats Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Platform Stats</h4>
                  <div className="text-pink-400">📊</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Total Contents:</span>
                    <span className="text-white font-medium">{totalContents?.toString() || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Total Donations:</span>
                    <span className="text-white font-medium">{totalDonations?.toString() || "0"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Earnings Breakdown */}
            {earningsData.tokens.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-white mb-6">Token Earnings Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earningsData.tokens.map((token, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{token.symbol}</span>
                        <span className="text-gray-400 text-xs">Token</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-400">
                        {parseFloat(token.amount).toFixed(token.symbol === "USDC" ? 2 : 4)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{token.address.slice(0, 10)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Contents List */}
            {userContents.contents.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-white mb-6">Your Registered Contents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userContents.contents.map((contentKey, index) => {
                    const [username, platform] = contentKey.split("@");
                    return (
                      <div
                        key={index}
                        className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{username}</span>
                          <span className="text-purple-400 text-sm capitalize">{platform}</span>
                        </div>
                        <p className="text-gray-400 text-sm">Platform: {platform}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
