"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Navbar } from "~~/components";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  placeholder: string;
  enabled: boolean;
  username: string;
}

const Settings: NextPage = () => {
  const { isConnected } = useAccount();
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated } = usePrivy();

  // Social platforms state
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    {
      id: "youtube",
      name: "YouTube",
      icon: "🎥",
      placeholder: "Enter your YouTube channel name",
      enabled: false,
      username: "",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      placeholder: "Enter your Facebook page name",
      enabled: false,
      username: "",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📷",
      placeholder: "Enter your Instagram username",
      enabled: false,
      username: "",
    },
    {
      id: "twitch",
      name: "Twitch",
      icon: "🎮",
      placeholder: "Enter your Twitch username",
      enabled: false,
      username: "",
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  if (!isUserConnected) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-warning text-warning-content p-8 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Wallet Required</h2>
          <p className="mb-4">Please connect your wallet to access settings.</p>
          <p className="text-sm">Use the wallet connect button in the header above.</p>
        </div>
      </div>
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

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Simulate API call - replace with actual save logic
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSaveSuccess(true);

      // Reset success state after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are any changes to save
  const hasChanges = platforms.some(platform => platform.enabled && platform.username.trim());

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-base-content/70">Manage your social media platform connections</p>
          </div>

          {/* Social Platforms Settings */}
          <div className="bg-base-100 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">Social Media Platforms</h2>

            <div className="space-y-6">
              {platforms.map(platform => (
                <div
                  key={platform.id}
                  className="border border-base-300 rounded-lg p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    {/* Platform Info */}
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{platform.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold">{platform.name}</h3>
                        <p className="text-sm text-base-content/70">
                          {platform.enabled ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text mr-4">Enable</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={platform.enabled}
                          onChange={() => togglePlatform(platform.id)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Username Form (shown when enabled) */}
                  {platform.enabled && (
                    <div className="mt-4 animate-in slide-in-from-top duration-300">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">{platform.name} Username/Channel Name</span>
                        </label>
                        <div className="input-group">
                          <span className="bg-base-200 px-4 flex items-center text-lg">{platform.icon}</span>
                          <input
                            type="text"
                            placeholder={platform.placeholder}
                            className="input input-bordered flex-1"
                            value={platform.username}
                            onChange={e => updateUsername(platform.id, e.target.value)}
                          />
                        </div>
                        {platform.username && (
                          <label className="label">
                            <span className="label-text-alt text-success">✓ {platform.name} account linked</span>
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
                className="btn btn-outline"
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
                className={`btn btn-primary ${isSaving ? "loading" : ""}`}
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>

            {/* Success Message */}
            {saveSuccess && (
              <div className="mt-4 alert alert-success">
                <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Settings saved successfully!</span>
              </div>
            )}
          </div>

          {/* Connected Platforms Summary */}
          <div className="bg-base-100 p-6 rounded-lg shadow-lg mt-6">
            <h3 className="text-lg font-semibold mb-4">Connected Platforms Summary</h3>

            {platforms.filter(p => p.enabled && p.username).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms
                  .filter(platform => platform.enabled && platform.username)
                  .map(platform => (
                    <div key={platform.id} className="bg-base-200 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-base-content/70">@{platform.username}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/50">
                <p>No platforms connected yet.</p>
                <p className="text-sm">Enable platforms above to connect your social media accounts.</p>
              </div>
            )}
          </div>

          {/* Information Panel */}
          <div className="bg-info/10 border border-info/20 p-6 rounded-lg mt-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-info mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="font-medium text-info mb-2">Platform Connection Info</h4>
                <ul className="space-y-1 text-sm text-base-content/70">
                  <li>• Your social media connections help donors find and support you</li>
                  <li>• Only enable platforms you actively use and want to display publicly</li>
                  <li>• You can update or disconnect platforms at any time</li>
                  <li>• All connections are secure and we never store sensitive account information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
