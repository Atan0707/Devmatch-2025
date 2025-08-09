"use client";

import { donatorsData, formatDonationDateTime, getDonationsCount, getTotalDonationsAmount } from "../../data/donators";
import type { NextPage } from "next";
import { Navbar } from "~~/components";
import { Address } from "~~/components/scaffold-eth";

const Donator: NextPage = () => {
  const totalAmount = getTotalDonationsAmount();
  const totalCount = getDonationsCount();

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Donators</h1>
            <p className="text-base-content/70">List of all donors and their contributions</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-primary/20">
              <h3 className="text-lg font-semibold mb-2">Total Donations</h3>
              <div className="text-3xl font-bold text-primary">
                ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
              </div>
            </div>
            <div className="bg-base-100 p-6 rounded-lg shadow-lg border border-secondary/20">
              <h3 className="text-lg font-semibold mb-2">Total Donors</h3>
              <div className="text-3xl font-bold text-secondary">{totalCount}</div>
            </div>
          </div>

          {/* Donators List */}
          <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-base-300">
              <h2 className="text-xl font-semibold">Donation History</h2>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-4 gap-4 px-6 py-3 bg-base-200 text-sm font-medium text-base-content/70">
              <div>Donor Address</div>
              <div>Amount (USDC)</div>
              <div>Date & Time</div>
              <div>Status</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-base-300">
              {donatorsData.map(donator => (
                <div
                  key={donator.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 hover:bg-base-50 transition-colors"
                >
                  {/* Mobile: Stack layout, Desktop: Grid layout */}
                  <div className="flex flex-col md:flex-row md:items-center">
                    <span className="text-sm font-medium text-base-content/70 md:hidden mb-1">Donor:</span>
                    <Address address={donator.walletAddress} />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <span className="text-sm font-medium text-base-content/70 md:hidden mb-1">Amount:</span>
                    <div className="text-lg font-semibold text-primary">
                      ${donator.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <span className="text-sm font-medium text-base-content/70 md:hidden mb-1">Date & Time:</span>
                    <div className="text-sm text-base-content/80">
                      {formatDonationDateTime(donator.date, donator.time)}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center">
                    <span className="text-sm font-medium text-base-content/70 md:hidden mb-1">Status:</span>
                    <div className="badge badge-success">Completed</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State (if no donators) */}
            {donatorsData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-base-content/50 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-base-content/70 mb-2">No donations yet</h3>
                <p className="text-base-content/50">Donations will appear here once received.</p>
              </div>
            )}
          </div>

          {/* Pagination (for future implementation) */}
          {donatorsData.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="join">
                <button className="join-item btn btn-outline">«</button>
                <button className="join-item btn btn-outline btn-active">1</button>
                <button className="join-item btn btn-outline">2</button>
                <button className="join-item btn btn-outline">3</button>
                <button className="join-item btn btn-outline">»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Donator;
