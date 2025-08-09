"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { Address } from "~~/components/scaffold-eth";

const Withdraw: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated, user } = usePrivy();

  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [error, setError] = useState("");

  // Mock available balance - replace with actual balance fetching
  const availableBalance = 1250.75; // USDC

  // Show loading state while Privy is initializing
  if (isPrivyAvailable && !ready) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Check if user is connected
  const isUserConnected = (isPrivyAvailable && authenticated) || isConnected;
  const userAddress = user?.wallet?.address || connectedAddress;

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
    if (numAmount > availableBalance) {
      setError(`Insufficient balance. Available: $${availableBalance.toFixed(2)} USDC`);
      return false;
    }
    setError("");
    return true;
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!validateAmount(withdrawAmount)) return;

    setIsWithdrawing(true);
    setError("");

    try {
      // Simulate withdrawal process - replace with actual withdrawal logic
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success
      setWithdrawalSuccess(true);
      setWithdrawAmount("");

      // Reset success state after 5 seconds
      setTimeout(() => setWithdrawalSuccess(false), 5000);
    } catch {
      setError("Withdrawal failed. Please try again.");
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
    setWithdrawAmount(availableBalance.toString());
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
                <span className="text-xl font-bold text-primary">${availableBalance.toFixed(2)} USDC</span>
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
                  <span className="label-text font-medium">Withdrawal Amount (USDC)</span>
                </label>
                <div className="input-group">
                  <span className="bg-base-200 px-4 flex items-center">$</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    className={`input input-bordered flex-1 text-right ${error ? "input-error" : ""}`}
                    value={withdrawAmount}
                    onChange={handleAmountChange}
                    disabled={isWithdrawing}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={setMaxAmount}
                    disabled={isWithdrawing}
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
                      <span>Amount:</span>
                      <span>${parseFloat(withdrawAmount || "0").toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Fee:</span>
                      <span>~$2.50 (estimated)</span>
                    </div>
                    <div className="border-t border-base-300 pt-1 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>You&apos;ll receive:</span>
                        <span>${Math.max(0, parseFloat(withdrawAmount || "0") - 2.5).toFixed(2)} USDC</span>
                      </div>
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
                disabled={!withdrawAmount || !!error || isWithdrawing || withdrawalSuccess}
              >
                {isWithdrawing ? "Processing Withdrawal..." : "Withdraw Funds"}
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
                      <li>• Withdrawals are processed immediately to your connected wallet</li>
                      <li>• Network fees are estimated and may vary based on current gas prices</li>
                      <li>• Minimum withdrawal amount is $10.00 USDC</li>
                      <li>• Maximum daily withdrawal limit is $10,000.00 USDC</li>
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
