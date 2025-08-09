"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { usePrivyAvailability } from "~~/components/PrivyClientProvider";
import { PrivyLoginSection } from "~~/components/PrivyLoginSection";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { isPrivyAvailable } = usePrivyAvailability();
  const { ready, authenticated, user } = usePrivy();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>

          {/* Show connection info when user is authenticated */}
          {isPrivyAvailable && ready && authenticated && user ? (
            <div className="flex justify-center items-center space-x-2 flex-col">
              <p className="my-2 font-medium">Connected via Privy:</p>
              <Address address={user.wallet?.address} />
              {user.email && <p className="text-sm text-base-content/70">Email: {user.email.address}</p>}
            </div>
          ) : connectedAddress ? (
            <div className="flex justify-center items-center space-x-2 flex-col">
              <p className="my-2 font-medium">Connected Address:</p>
              <Address address={connectedAddress} />
            </div>
          ) : (
            <div className="flex justify-center items-center space-x-2 flex-col">
              <p className="my-2 font-medium text-base-content/50">No wallet connected</p>
              <p className="text-sm text-base-content/50">Connect using Privy below</p>
            </div>
          )}

          <p className="text-center text-lg mt-6">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        {/* Privy Login Section - prominently displayed */}
        <div className="w-full mt-8">
          {isPrivyAvailable ? (
            <PrivyLoginSection />
          ) : (
            <div className="flex justify-center items-center p-4">
              <div className="bg-warning text-warning-content p-4 rounded-lg max-w-md">
                <h3 className="font-semibold mb-2">Privy Setup Required</h3>
                <p className="text-sm">
                  To enable wallet connection, add your Privy App ID to your environment variables:
                </p>
                <code className="block mt-2 p-2 bg-black/20 rounded text-xs">
                  NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here
                </code>
              </div>
            </div>
          )}
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
