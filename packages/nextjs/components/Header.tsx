"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { PrivyConnectButton } from "~~/components/PrivyConnectButton";

/**
 * Minimal site header with wallet connection and dashboard link
 */
export const Header = () => {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated } = usePrivy();

  // Check if user is connected (either via Privy or direct wallet connection)
  const isUserConnected = (isPrivyAvailable && ready && authenticated) || isConnected;

  return (
    <div className="navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 px-4">
      <div className="navbar-start">
        {/* Show dashboard link only when wallet is connected and not on home page */}
        {isUserConnected && pathname !== "/" && (
          <Link href="/dashboard" className={`btn btn-ghost ${pathname === "/dashboard" ? "btn-active" : ""}`}>
            Dashboard
          </Link>
        )}
      </div>
      <div className="navbar-end">
        <PrivyConnectButton />
      </div>
    </div>
  );
};
