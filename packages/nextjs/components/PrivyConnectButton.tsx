"use client";

import { usePrivyAvailability } from "./PrivyClientProvider";
import { RainbowKitCustomConnectButton } from "./scaffold-eth";
import { usePrivy } from "@privy-io/react-auth";

export const PrivyConnectButton = () => {
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated, user, login, logout } = usePrivy();

  // If Privy is not available, fall back to RainbowKit
  if (!isPrivyAvailable) {
    return <RainbowKitCustomConnectButton />;
  }

  // Show loading while Privy is initializing
  if (!ready) {
    return (
      <div className="btn btn-primary btn-sm">
        <span className="loading loading-spinner loading-xs"></span>
        Loading...
      </div>
    );
  }

  // If authenticated, show user info and logout button
  if (authenticated && user) {
    return (
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-secondary btn-sm">
          {user.email?.address ? (
            <>
              <span className="hidden sm:inline">
                {user.email.address.length > 20
                  ? `${user.email.address.slice(0, 10)}...${user.email.address.slice(-8)}`
                  : user.email.address}
              </span>
              <span className="sm:hidden">{user.email.address.slice(0, 6)}...</span>
            </>
          ) : user.wallet?.address ? (
            <>
              <span className="hidden sm:inline">
                {`${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`}
              </span>
              <span className="sm:hidden">{user.wallet.address.slice(0, 4)}...</span>
            </>
          ) : (
            "Connected"
          )}
        </div>
        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
          {user.email && (
            <li>
              <div className="text-xs text-base-content/70">Email: {user.email.address}</div>
            </li>
          )}
          {user.wallet && (
            <li>
              <div className="text-xs text-base-content/70 font-mono">
                Wallet: {user.wallet.address.slice(0, 10)}...{user.wallet.address.slice(-10)}
              </div>
            </li>
          )}
          <li>
            <button onClick={logout} className="text-error hover:bg-error/10">
              Disconnect
            </button>
          </li>
        </ul>
      </div>
    );
  }

  // If not authenticated, show login button
  return (
    <button onClick={login} className="btn btn-primary btn-sm">
      Connect Wallet
    </button>
  );
};
