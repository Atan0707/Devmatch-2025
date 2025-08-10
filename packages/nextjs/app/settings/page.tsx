"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useSignTransaction, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { Address } from "~~/components/scaffold-eth";
import { PisangContractFunctions } from "~~/contracts/contractFunction";

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  placeholder: string;
  enabled: boolean;
  username: string;
  registered?: boolean;
}

const Settings: NextPage = () => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const { isPrivyAvailable } = usePrivyAvailability();

  // Contract state
  const [isContractConnected, setIsContractConnected] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [pisangContract, setPisangContract] = useState<PisangContractFunctions | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Social platforms state
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    {
      id: "youtube",
      name: "YouTube",
      icon: "🎥",
      placeholder: "Enter your YouTube channel name",
      enabled: false,
      username: "",
      registered: false,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      placeholder: "Enter your Facebook page name",
      enabled: false,
      username: "",
      registered: false,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📷",
      placeholder: "Enter your Instagram username",
      enabled: false,
      username: "",
      registered: false,
    },
    {
      id: "twitch",
      name: "Twitch",
      icon: "🎮",
      placeholder: "Enter your Twitch username",
      enabled: false,
      username: "",
      registered: false,
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: "🎵",
      placeholder: "Enter your TikTok username",
      enabled: false,
      username: "",
      registered: false,
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: "🐦",
      placeholder: "Enter your Twitter username",
      enabled: false,
      username: "",
      registered: false,
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const connectToContract = useCallback(async () => {
    try {
      setContractLoading(true);

      if (!authenticated || !wallets.length) {
        throw new Error("Please connect your wallet first");
      }

      const wallet = wallets[0]; // Use the first wallet
      const address = wallet.address;

      // Create ethers provider from Privy wallet
      const provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(provider);

      // Initialize contract with Privy signing
      const pisangContract = new PisangContractFunctions(ethersProvider, address, signTransaction);

      setIsContractConnected(true);
      setAccount(address);
      setPisangContract(pisangContract);

      // Check existing registrations
      await checkExistingRegistrations(pisangContract, address);
    } catch (err: any) {
      console.error("Failed to connect to contract:", err);
      setError(err.message);
    } finally {
      setContractLoading(false);
    }
  }, [authenticated, wallets, signTransaction]);

  // Connect to contract when wallet is connected
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      connectToContract();
    }
  }, [authenticated, wallets, connectToContract]);

  const checkExistingRegistrations = async (contract: PisangContractFunctions, userAddress: string) => {
    try {
      const creatorContents = await contract.getCreatorContents(userAddress);

      // Update platforms with registration status
      setPlatforms(prev =>
        prev.map(platform => {
          const isRegistered = creatorContents.some((contentKey: string) => {
            const parts = contentKey.split("@");
            return parts[1] === platform.id;
          });

          if (isRegistered) {
            const contentKey = creatorContents.find((key: string) => key.endsWith(`@${platform.id}`));
            const username = contentKey ? contentKey.split("@")[0] : "";
            return {
              ...platform,
              registered: true,
              enabled: true,
              username,
            };
          }
          return platform;
        }),
      );
    } catch (err) {
      console.error("Failed to check existing registrations:", err);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Show loading state while Privy is initializing
  if (isPrivyAvailable && !ready) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Check if user is connected
  const isUserConnected = authenticated && wallets.length > 0;

  if (!isUserConnected) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div className="bg-warning text-warning-content p-8 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Wallet Required</h2>
            <p className="mb-4">Please connect your wallet to access settings.</p>
            <p className="text-sm">Use the connect button in the header above.</p>
          </div>
        </div>
      </>
    );
  }

  // Toggle platform enabled state
  const togglePlatform = (platformId: string) => {
    setPlatforms(prev =>
      prev.map(platform =>
        platform.id === platformId
          ? {
              ...platform,
              enabled: !platform.enabled,
              username: !platform.enabled ? platform.username : "", // Clear username when disabling
            }
          : platform,
      ),
    );
  };

  // Update platform username
  const updateUsername = (platformId: string, username: string) => {
    setPlatforms(prev => prev.map(platform => (platform.id === platformId ? { ...platform, username } : platform)));
  };

  // Register content on contract
  const registerContent = async (platform: SocialPlatform) => {
    if (!pisangContract || !platform.username.trim()) return;

    try {
      setContractLoading(true);
      clearMessages();

      const result = await pisangContract.registerContent(platform.username, platform.id);
      setSuccess(`Content registered successfully for ${platform.name} - Transaction: ${result.txHash}`);

      // Update platform registration status
      setPlatforms(prev => prev.map(p => (p.id === platform.id ? { ...p, registered: true } : p)));

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setContractLoading(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    clearMessages();

    try {
      const enabledPlatforms = platforms.filter(p => p.enabled && p.username.trim() && !p.registered);

      if (enabledPlatforms.length === 0) {
        setError("No new platforms to register or all enabled platforms are already registered");
        return;
      }

      // Register each enabled platform that hasn't been registered yet
      for (const platform of enabledPlatforms) {
        await registerContent(platform);
      }

      setSaveSuccess(true);
      // Reset success state after 5 seconds
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are any changes to save
  const hasChanges = platforms.some(platform => platform.enabled && platform.username.trim() && !platform.registered);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-3 text-white">Settings</h1>
              <p className="text-gray-400 text-lg">Register your social media platform content on the blockchain</p>
            </div>

            {/* Wallet Connection Status */}
            <div className="mb-8">
              {!authenticated ? (
                <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-300 p-4 rounded-2xl backdrop-blur-sm">
                  <span>Please connect your wallet to continue</span>
                </div>
              ) : !isContractConnected ? (
                <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 p-4 rounded-2xl backdrop-blur-sm flex items-center justify-between">
                  <span>Connecting to contract...</span>
                  <div className="flex items-center space-x-2">
                    {contractLoading && <span className="loading loading-spinner loading-sm"></span>}
                    {!contractLoading && (
                      <button
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                        onClick={connectToContract}
                      >
                        Retry Connection
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-2xl backdrop-blur-sm">
                  <span>
                    ✅ Connected: <Address address={account} />
                  </span>
                </div>
              )}
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

            {/* Social Platforms Settings */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 shadow-2xl">
              <h2 className="text-2xl font-semibold mb-8 text-white">Social Media Platforms</h2>

              <div className="space-y-6">
                {platforms.map(platform => (
                  <div
                    key={platform.id}
                    className="border border-gray-600/30 bg-gray-700/30 rounded-xl p-6 hover:border-purple-500/50 transition-colors backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      {/* Platform Info */}
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{platform.icon}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{platform.name}</h3>
                          <p className="text-sm">
                            {platform.registered ? (
                              <span className="text-green-400">✓ Registered on blockchain</span>
                            ) : platform.enabled ? (
                              <span className="text-yellow-400">⚠ Ready to register</span>
                            ) : (
                              <span className="text-gray-400">Not configured</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className="form-control">
                        <label className="label cursor-pointer">
                          <span className="text-white mr-4">Enable</span>
                          <input
                            type="checkbox"
                            className="toggle bg-purple-500 border-purple-500 [--tglbg:theme(colors.purple.500)] hover:bg-purple-600"
                            checked={platform.enabled}
                            onChange={() => togglePlatform(platform.id)}
                            disabled={platform.registered}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Username Form (shown when enabled) */}
                    {platform.enabled && (
                      <div className="mt-4 animate-in slide-in-from-top duration-300">
                        <div className="form-control">
                          <label className="label">
                            <span className="text-white font-medium">{platform.name} Username/Channel Name</span>
                          </label>
                          <div className="flex">
                            <span className="bg-gray-600/50 px-4 flex items-center text-lg rounded-l-lg border border-gray-500/30">
                              {platform.icon}
                            </span>
                            <input
                              type="text"
                              placeholder={platform.placeholder}
                              className="flex-1 bg-gray-700/50 border border-gray-500/30 rounded-r-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none"
                              value={platform.username}
                              onChange={e => updateUsername(platform.id, e.target.value)}
                              disabled={platform.registered}
                            />
                          </div>
                          {platform.username && platform.registered && (
                            <label className="label">
                              <span className="text-green-400 text-sm">✓ {platform.name} registered on blockchain</span>
                            </label>
                          )}
                          {platform.username && !platform.registered && (
                            <label className="label">
                              <span className="text-yellow-400 text-sm">⚠ Ready to register on blockchain</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  className="border border-gray-500/30 text-gray-300 hover:bg-gray-700/30 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  onClick={() => {
                    // Reset to default state
                    setPlatforms(prev =>
                      prev.map(platform => ({
                        ...platform,
                        enabled: false,
                        username: "",
                      })),
                    );
                  }}
                  disabled={isSaving}
                >
                  Reset All
                </button>

                <button
                  type="button"
                  className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 ${isSaving || contractLoading ? "cursor-not-allowed" : ""}`}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving || contractLoading || !isContractConnected}
                >
                  {isSaving || (contractLoading && <span className="loading loading-spinner loading-sm"></span>)}
                  <span>{isSaving || contractLoading ? "Registering..." : "Register on Blockchain"}</span>
                </button>
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="mt-6 bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-2xl backdrop-blur-sm flex items-center space-x-3">
                  <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Content registered successfully on blockchain!</span>
                </div>
              )}
            </div>

            {/* Registered Platforms Summary */}
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 shadow-2xl mt-8">
              <h3 className="text-2xl font-semibold mb-6 text-white">Registered Platforms Summary</h3>

              {platforms.filter(p => p.registered && p.username).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {platforms
                    .filter(platform => platform.registered && platform.username)
                    .map(platform => (
                      <div
                        key={platform.id}
                        className="bg-gray-700/50 p-6 rounded-xl border-l-4 border-green-500 backdrop-blur-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{platform.icon}</span>
                            <div>
                              <div className="font-medium text-white">{platform.name}</div>
                              <div className="text-sm text-gray-400">@{platform.username}</div>
                            </div>
                          </div>
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Registered
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No platforms registered yet.</p>
                  <p className="text-gray-500 mt-2">
                    Enable platforms above to register your social media accounts on the blockchain.
                  </p>
                </div>
              )}
            </div>

            {/* Information Panel */}
            <div className="bg-blue-900/20 border border-blue-500/30 p-8 rounded-2xl mt-8 backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <svg className="w-6 h-6 text-blue-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-400 mb-4 text-lg">Wallet & Blockchain Registration</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Connect any supported wallet for secure blockchain interaction</li>
                    <li>
                      • Registering your content on the blockchain enables donations and creates immutable ownership
                    </li>
                    <li>• Once registered, you can receive ETH and token donations directly to your content</li>
                    <li>• Registration requires a blockchain transaction and gas fees</li>
                    <li>• Registered content cannot be easily changed - ensure your username is correct</li>
                    <li>• You maintain full ownership and control of your registered content</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {(contractLoading || isSaving) && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-gray-800/90 backdrop-blur-sm border border-purple-500/30 p-8 rounded-2xl">
                  <span className="loading loading-spinner loading-lg text-purple-400"></span>
                  <p className="mt-4 text-white">
                    {contractLoading ? "Connecting to contract..." : "Registering content..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
