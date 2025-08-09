"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";

const Dashboard: NextPage = () => {
  const { isConnected } = useAccount();
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated } = usePrivy();

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

  // Mock data - replace with actual data fetching logic
  const totalEarningsUSDC = 1250.75; // Replace with actual USDC earnings
  const totalDonations = 8; // Replace with actual donation count

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
                  ${totalEarningsUSDC.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-gray-400">This month ({currentMonth})</p>
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
                  {totalDonations}
                </div>
                <p className="text-gray-400">This month ({currentMonth})</p>
              </div>
            </div>

            {/* Additional Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Parking Status Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Parking Status</h4>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-gray-400 text-sm mb-2">Current Status</p>
                <p className="text-green-400 font-medium">Active</p>
              </div>

              {/* Balance Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Balance</h4>
                  <div className="text-purple-400">💰</div>
                </div>
                <p className="text-gray-400 text-sm mb-2">Available</p>
                <p className="text-purple-400 font-medium text-xl">20 THB</p>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Quick Actions</h4>
                  <div className="text-pink-400">⚡</div>
                </div>
                <div className="space-y-2">
                  <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
                    Top Up Balance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
