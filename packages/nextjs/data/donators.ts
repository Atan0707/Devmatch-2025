export interface Donator {
  id: string;
  walletAddress: string;
  amount: number; // USDC amount
  date: string; // ISO date string
  time: string; // Time in HH:MM format
}

export const donatorsData: Donator[] = [
  {
    id: "1",
    walletAddress: "0x742d35Cc6532C02bAB897C2e4b1e5C4e7a3A5f1D",
    amount: 150.5,
    date: "2024-01-15",
    time: "14:30",
  },
  {
    id: "2",
    walletAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    amount: 250.0,
    date: "2024-01-14",
    time: "09:45",
  },
];

// Helper function to get formatted date and time
export const formatDonationDateTime = (date: string, time: string): string => {
  const dateObj = new Date(`${date}T${time}:00`);
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper function to get total donations amount
export const getTotalDonationsAmount = (): number => {
  return donatorsData.reduce((total, donator) => total + donator.amount, 0);
};

// Helper function to get donations count
export const getDonationsCount = (): number => {
  return donatorsData.length;
};
