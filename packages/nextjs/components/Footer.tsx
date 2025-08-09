import React from "react";
import { SwitchTheme } from "~~/components/SwitchTheme";

/**
 * Minimal site footer with only theme switcher
 */
export const Footer = () => {
  return (
    <div className="min-h-0 py-2">
      <div className="fixed flex justify-end items-center w-full z-10 p-4 bottom-0 right-0 pointer-events-none">
        <SwitchTheme className="pointer-events-auto" />
      </div>
    </div>
  );
};
