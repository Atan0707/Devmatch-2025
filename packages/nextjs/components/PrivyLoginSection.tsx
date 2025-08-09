"use client";

import { useState } from "react";
import { useConnectWallet, useLoginWithEmail, usePrivy } from "@privy-io/react-auth";

export function PrivyLoginSection() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"email" | "wallet">("wallet");

  const { ready, authenticated, user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { connectWallet } = useConnectWallet();

  // Don't render anything until Privy is ready
  if (!ready) {
    return (
      <div className="flex justify-center items-center p-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  // If user is authenticated, show user info and logout
  if (authenticated && user) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="bg-base-200 p-6 rounded-lg max-w-md w-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Connected with Privy</h3>
            <div className="mb-4">
              <p className="text-sm text-base-content/70">Email:</p>
              <p className="font-medium">{user.email?.address || "N/A"}</p>
            </div>
            {user.wallet && (
              <div className="mb-4">
                <p className="text-sm text-base-content/70">Wallet:</p>
                <p className="font-mono text-sm">{user.wallet.address}</p>
              </div>
            )}
            <button onClick={logout} className="btn btn-outline btn-sm w-full">
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login interface
  return (
    <div className="flex justify-center items-center p-4">
      <div className="bg-base-200 p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-semibold text-center mb-4">Connect Your Wallet</h3>

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed mb-4">
          <a className={`tab ${activeTab === "wallet" ? "tab-active" : ""}`} onClick={() => setActiveTab("wallet")}>
            Wallet
          </a>
          <a className={`tab ${activeTab === "email" ? "tab-active" : ""}`} onClick={() => setActiveTab("email")}>
            Email
          </a>
        </div>

        {/* Wallet Connection */}
        {activeTab === "wallet" && (
          <div className="space-y-3">
            <p className="text-sm text-base-content/70 text-center">
              Connect with your existing wallet (MetaMask, Coinbase, etc.)
            </p>
            <button onClick={connectWallet} className="btn btn-primary w-full">
              Connect Wallet
            </button>
          </div>
        )}

        {/* Email Login */}
        {activeTab === "email" && (
          <div className="space-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email Address</span>
              </label>
              <input
                type="email"
                onChange={e => setEmail(e.currentTarget.value)}
                value={email}
                placeholder="Enter your email"
                className="input input-bordered w-full"
              />
            </div>
            <button onClick={() => sendCode({ email })} disabled={!email} className="btn btn-primary w-full">
              Send Verification Code
            </button>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Verification Code</span>
              </label>
              <input
                type="text"
                onChange={e => setCode(e.currentTarget.value)}
                value={code}
                placeholder="Enter verification code"
                className="input input-bordered w-full"
              />
            </div>
            <button onClick={() => loginWithCode({ code })} disabled={!code} className="btn btn-secondary w-full">
              Verify & Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
