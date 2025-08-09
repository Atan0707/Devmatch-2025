"use client";

import { createContext, useContext } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
// import { WagmiProvider } from "wagmi";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arbitrum, baseSepolia, mainnet, optimism, polygon, sepolia } from "viem/chains";

// Context to track if Privy is available
const PrivyAvailabilityContext = createContext<{ isPrivyAvailable: boolean }>({ isPrivyAvailable: false });

export function usePrivyAvailability() {
  return useContext(PrivyAvailabilityContext);
}

export function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  const isPrivyAvailable = !!privyAppId;

  // If Privy credentials are not configured, render children without Privy
  if (!isPrivyAvailable) {
    console.warn("Privy App ID not configured. Please set NEXT_PUBLIC_PRIVY_APP_ID environment variable.");
    return (
      <PrivyAvailabilityContext.Provider value={{ isPrivyAvailable: false }}>
        {children}
      </PrivyAvailabilityContext.Provider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Appearance settings
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "https://your-logo-url.com/logo.png",
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          // noPromptOnSignature: false,
        },
        // Login methods
        loginMethods: ["email", "sms", "wallet"],
        // Supported chains
        supportedChains: [mainnet, sepolia, polygon, optimism, arbitrum, baseSepolia],
        // Default chain
        defaultChain: sepolia,
      }}
    >
      <PrivyAvailabilityContext.Provider value={{ isPrivyAvailable: true }}>
        {children}
      </PrivyAvailabilityContext.Provider>
    </PrivyProvider>
  );
}
