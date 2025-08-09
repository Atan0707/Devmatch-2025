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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300/50">
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
                      ? "bg-primary text-primary-content shadow-lg"
                      : "text-base-content/70 hover:text-base-content hover:bg-base-200/70"
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
                <div className="flex items-center space-x-2 bg-base-200/70 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <Address address={userAddress} />
                </div>
                <button onClick={handleDisconnect} className="btn btn-outline btn-sm">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnect} className="btn btn-primary btn-sm" disabled={isPrivyAvailable && !ready}>
                {isPrivyAvailable && !ready ? "Loading..." : "Connect Wallet"}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden btn btn-ghost btn-sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
          <div className="md:hidden border-t border-base-300/50 bg-base-100/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-content shadow-lg"
                        : "text-base-content/70 hover:text-base-content hover:bg-base-200/70"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Wallet Connection */}
              <div className="pt-3 border-t border-base-300/50">
                {isUserConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-base-200/70 rounded-lg">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <Address address={userAddress} />
                    </div>
                    <button onClick={handleDisconnect} className="btn btn-outline btn-sm w-full">
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="btn btn-primary btn-sm w-full"
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
