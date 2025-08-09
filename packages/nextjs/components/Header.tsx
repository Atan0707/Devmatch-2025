"use client";

import React from "react";
import { PrivyConnectButton } from "~~/components/PrivyConnectButton";

/**
 * Minimal site header with only wallet connection
 */
export const Header = () => {
  return (
    <div className="navbar bg-base-100 min-h-0 shrink-0 justify-end z-20 px-4">
      <div className="navbar-end">
        <PrivyConnectButton />
      </div>
    </div>
  );
};
