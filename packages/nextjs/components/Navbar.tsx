"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivyAvailability } from "./PrivyClientProvider";
import { Address } from "./scaffold-eth";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Donators", href: "/donator", icon: "👥" },
  { name: "Withdraw", href: "/withdraw", icon: "💰" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
];

export const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { address: connectedAddress, isConnected } = useAccount();
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Determine connection status
  const isUserConnected = (isPrivyAvailable && authenticated) || isConnected;
  const userAddress = user?.wallet?.address || connectedAddress;

  // Handle wallet connection
  const handleConnect = () => {
    if (isPrivyAvailable) {
      login();
    }
  };

  const handleDisconnect = () => {
    if (isPrivyAvailable && authenticated) {
      logout();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-purple-500/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="text-2xl">🎯</div>
            <span className="text-xl font-bold text-primary">DevMatch</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            {isUserConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-2 rounded-lg border border-purple-500/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <Address address={userAddress} />
                </div>
                <button
                  onClick={handleDisconnect}
                  className="border border-gray-500/30 text-gray-300 hover:bg-gray-700/30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                disabled={isPrivyAvailable && !ready}
              >
                {isPrivyAvailable && !ready ? "Loading..." : "Connect Wallet"}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-purple-500/20 bg-gray-800/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Wallet Connection */}
              <div className="pt-3 border-t border-purple-500/20">
                {isUserConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 rounded-lg border border-purple-500/20">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <Address address={userAddress} />
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="w-full border border-gray-500/30 text-gray-300 hover:bg-gray-700/30 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                    disabled={isPrivyAvailable && !ready}
                  >
                    {isPrivyAvailable && !ready ? "Loading..." : "Connect Wallet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
