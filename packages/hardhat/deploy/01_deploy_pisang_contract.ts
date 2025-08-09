import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "StreamingDonation" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployPisangContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("PisangContract", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const pisangContract = await hre.ethers.getContract<Contract>("PisangContract", deployer);
  console.log("🎥 PisangContract contract deployed!");

  // Get initial platform stats
  const stats = await pisangContract.getPlatformStats();
  console.log("📊 Platform Stats:");
  console.log("   Total Contents:", stats[0].toString());
  console.log("   Total Donations:", stats[1].toString());
  console.log("   Platform Fee:", stats[2].toString(), "basis points");

  // Example: Add a mock USDC token support (you would use real addresses on mainnet/testnets)
  // Uncomment the following lines when you have real token addresses:

  // console.log("💰 Adding supported tokens...");
  // Example USDC address (Base Sepolia testnet) - replace with actual addresses
  const mockUSDCAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
  try {
    await pisangContract.addSupportedToken(mockUSDCAddress, "USDC");
    console.log("✅ Added USDC support");
  } catch (error) {
    console.log("ℹ️  USDC might already be supported or address invalid", error);
  }
  // Get supported tokens
  const supportedTokens = await pisangContract.getSupportedTokens();
  console.log("🪙 Supported tokens:", supportedTokens[1]); // symbols array
};

export default deployPisangContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags PisangContract
deployPisangContract.tags = ["PisangContract"];
