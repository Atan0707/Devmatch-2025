"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Main Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black">Send Love, Send Crypto</h1>
          <p className="text-2xl md:text-3xl text-black mb-4">Support Your Favorite Streamers with USDC</p>
          <p className="text-lg text-black/80 max-w-2xl mx-auto">
            Connect your wallet to start supporting creators with cryptocurrency donations. Fast, secure, and direct
            support for the content you love.
          </p>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-base-100 p-8 rounded-2xl shadow-xl border border-primary/20 max-w-md mx-auto">
          {isUserConnected ? (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-4 text-success">Wallet Connected!</h3>
              <p className="text-base-content/70 mb-6">
                You&apos;re all set to start supporting your favorite streamers.
              </p>
              <div className="space-y-3">
                <a href="/dashboard" className="btn btn-primary btn-lg w-full">
                  Go to Dashboard
                </a>
                <a href="/donator" className="btn btn-outline btn-lg w-full">
                  Browse Streamers
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-2xl font-bold mb-4">Connect Your Wallet</h3>
              <p className="text-base-content/70 mb-6">
                Connect your wallet to start donating to streamers or receive donations.
              </p>
              <RainbowKitCustomConnectButton />
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h4 className="text-xl font-semibold mb-2">Instant Donations</h4>
            <p className="text-base-content/70">Send USDC donations instantly with low transaction fees</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h4 className="text-xl font-semibold mb-2">Secure & Transparent</h4>
            <p className="text-base-content/70">All transactions are secured by blockchain technology</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🌍</div>
            <h4 className="text-xl font-semibold mb-2">Global Support</h4>
            <p className="text-base-content/70">Support creators worldwide without currency restrictions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
