This is how I transfer USDC

import { useState } from 'react'
import { ethers } from 'ethers'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ABI from './abi.json'

function App() {
  const [count, setCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [_provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [pisangContract, setPisangContract] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Connect wallet function
  async function connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send('eth_requestAccounts', [])
        const signer = await provider.getSigner()
        const account = accounts[0]
        
        // Initialize contract
        const contract = new ethers.Contract(ABI.address, ABI.abi, signer)
        
        setProvider(provider)
        setSigner(signer)
        setPisangContract(contract)
        setAccount(account)
        setIsConnected(true)
        setMessage('Wallet connected successfully!')
        
        console.log('Connected account:', account)
      } else {
        setMessage('Please install MetaMask!')
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setMessage('Failed to connect wallet')
    }
  }

  async function donateUSDC(contentUrl, amount) {
    if (!isConnected || !signer || !pisangContract) {
      setMessage('Please connect your wallet first!')
      return
    }
    
    try {
      setLoading(true)
      setMessage('Processing donation...')
      
      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      const pisangAddress = "0x581cBC507994764bccB70f2e0e79Da24D8D8012B";
      
      // Convert amount to proper decimals (USDC has 6 decimals)
      const amountInWei = ethers.parseUnits(amount, 6);
      
      // Create USDC contract with full ERC20 ABI
      const usdcContract = new ethers.Contract(
        usdcAddress,
        [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
          "function balanceOf(address account) view returns (uint256)",
          "function decimals() view returns (uint8)"
        ],
        signer
      );
      
      // Check current balance
      const userAddress = await signer.getAddress();
      const balance = await usdcContract.balanceOf(userAddress);
      console.log(`USDC Balance: ${ethers.formatUnits(balance, 6)} USDC`);
      
      if (balance < amountInWei) {
        throw new Error(`Insufficient USDC balance. You have ${ethers.formatUnits(balance, 6)} USDC but need ${amount} USDC`);
      }
      
      // Check current allowance
      const currentAllowance = await usdcContract.allowance(userAddress, pisangAddress);
      console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, 6)} USDC`);
      
      // If allowance is insufficient, approve
      if (currentAllowance < amountInWei) {
        console.log("Approving USDC spending...");
        setMessage('Approving USDC spending...')
        
        // First reset allowance to 0 (some tokens require this)
        if (currentAllowance > 0) {
          console.log("Resetting allowance to 0 first...");
          const resetTx = await usdcContract.approve(pisangAddress, 0);
          await resetTx.wait();
          console.log("Allowance reset to 0");
        }
        
        // Now set the new allowance
        const approveTx = await usdcContract.approve(pisangAddress, amountInWei);
        const approveReceipt = await approveTx.wait();
        console.log("✅ USDC approved, tx hash:", approveReceipt.hash);
        
        // Verify the allowance was set correctly
        const newAllowance = await usdcContract.allowance(userAddress, pisangAddress);
        console.log(`New allowance: ${ethers.formatUnits(newAllowance, 6)} USDC`);
        
        if (newAllowance < amountInWei) {
          throw new Error("Approval failed - allowance not set correctly");
        }
      } else {
        console.log("Sufficient allowance already exists");
      }
      
      // 2. Make the donation
      console.log("Making USDC donation...");
      setMessage('Making USDC donation...')
      const donateTx = await pisangContract.donateTokenToContent(
        contentUrl,
        usdcAddress,
        amountInWei
      );
      const donateReceipt = await donateTx.wait();
      console.log("✅ USDC donation successful, tx hash:", donateReceipt.hash);
      setMessage('✅ USDC donation successful!')
      
    } catch (error) {
      console.error("Donation failed:", error);
      if (error.message.includes("insufficient funds")) {
        setMessage("Donation failed: Insufficient ETH for gas fees")
      } else if (error.message.includes("User denied")) {
        setMessage("Donation cancelled by user")
      } else if (error.message.includes("transfer amount exceeds allowance")) {
        setMessage("Donation failed: Allowance issue. Please try again.")
      } else {
        setMessage(`Donation failed: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Debug function to check USDC balance and allowance
  async function checkUSDCStatus() {
    if (!isConnected || !signer) {
      setMessage('Please connect your wallet first!')
      return
    }
    
    try {
      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      const pisangAddress = "0x581cBC507994764bccB70f2e0e79Da24D8D8012B";
      
      const usdcContract = new ethers.Contract(
        usdcAddress,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function balanceOf(address account) view returns (uint256)"
        ],
        signer
      );
      
      const userAddress = await signer.getAddress();
      const balance = await usdcContract.balanceOf(userAddress);
      const allowance = await usdcContract.allowance(userAddress, pisangAddress);
      
      const balanceFormatted = ethers.formatUnits(balance, 6);
      const allowanceFormatted = ethers.formatUnits(allowance, 6);
      
      console.log(`USDC Balance: ${balanceFormatted} USDC`);
      console.log(`Current Allowance: ${allowanceFormatted} USDC`);
      
      setMessage(`Balance: ${balanceFormatted} USDC | Allowance: ${allowanceFormatted} USDC`);
    } catch (error) {
      console.error("Failed to check USDC status:", error);
      setMessage(`Failed to check USDC status: ${error.message}`);
    }
  }

  // Test function
  async function testDonation() {
    const testContentUrl = "https://www.youtube.com/"
    const testAmount = "1" // 1 USDC
    await donateUSDC(testContentUrl, testAmount)
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>USDC Donation Test</h1>
      
      <div className="card">
        {!isConnected ? (
          <button onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div>
            <p>✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'center' }}>
              <button 
                onClick={checkUSDCStatus}
                style={{ 
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check USDC Balance & Allowance
              </button>
              <button 
                onClick={testDonation} 
                disabled={loading}
                style={{ 
                  backgroundColor: loading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Test USDC Donation (1 USDC)'}
              </button>
            </div>
          </div>
        )}
        
        {message && (
          <p style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('failed') ? '#f8d7da' : '#d1ecf1',
            color: message.includes('✅') ? '#155724' : message.includes('failed') ? '#721c24' : '#0c5460',
            borderRadius: '4px'
          }}>
            {message}
          </p>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <h3>Original Counter (for testing)</h3>
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>
      </div>
      
      <p className="read-the-docs">
        Connect your wallet and test the USDC donation function
      </p>
    </>
  )
}

export default App
