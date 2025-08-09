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
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-base-content/70">
              {currentMonth} {currentYear} Summary
            </p>
          </div>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Earnings Card */}
            <div className="bg-base-100 p-8 rounded-lg shadow-lg border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Total Earnings</h3>
                <div className="badge badge-primary">USDC</div>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">
                ${totalEarningsUSDC.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-base-content/70">This month ({currentMonth})</p>
            </div>

            {/* Donations Card */}
            <div className="bg-base-100 p-8 rounded-lg shadow-lg border border-secondary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Donations</h3>
                <div className="badge badge-secondary">Count</div>
              </div>
              <div className="text-4xl font-bold text-secondary mb-2">{totalDonations}</div>
              <p className="text-base-content/70">This month ({currentMonth})</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
