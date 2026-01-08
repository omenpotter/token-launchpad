import { ethers } from 'ethers';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES, TOKEN_FACTORY_ABI, ERC20_ABI, DEX_ROUTER_ABI, PRESALE_FACTORY_ABI, PRESALE_ABI } from './contracts';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
  }

  // Connect wallet
  async connectWallet(customProvider = null) {
    const ethereumProvider = customProvider || window.ethereum;
    
    if (typeof ethereumProvider === 'undefined') {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    try {
      await ethereumProvider.request({ method: 'eth_requestAccounts' });
      this.provider = new ethers.BrowserProvider(ethereumProvider);
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();
      
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId.toString();

      // Listen for account changes
      ethereumProvider.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.account = accounts[0];
        }
      });

      // Listen for chain changes
      ethereumProvider.on('chainChanged', () => {
        window.location.reload();
      });

      return {
        address: this.account,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
  }

  // Switch network
  async switchNetwork(network, customProvider = null) {
    const ethereumProvider = customProvider || window.ethereum;
    const config = NETWORK_CONFIG[network];
    if (!config) throw new Error('Invalid network');

    try {
      await ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.chainId }]
      });
    } catch (switchError) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        await ethereumProvider.request({
          method: 'wallet_addEthereumChain',
          params: [config]
        });
      } else {
        throw switchError;
      }
    }
  }

  // Get native balance
  async getBalance(address) {
    if (!this.provider) throw new Error('Provider not initialized');
    const balance = await this.provider.getBalance(address || this.account);
    return ethers.formatEther(balance);
  }

  // Create Token
  async createToken(network, tokenData, fee) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const contractAddress = CONTRACT_ADDRESSES[network].TokenFactory;
    const contract = new ethers.Contract(contractAddress, TOKEN_FACTORY_ABI, this.signer);

    const tx = await contract.createToken(
      tokenData.name,
      tokenData.symbol,
      tokenData.decimals,
      ethers.parseUnits(tokenData.supply.toString(), tokenData.decimals),
      tokenData.lockMint,
      tokenData.immutable,
      tokenData.maxPerWallet || 0,
      { value: ethers.parseEther(fee.toString()) }
    );

    const receipt = await tx.wait();
    
    // Extract token address from event logs
    const tokenAddress = receipt.logs[0].address;
    
    return {
      txHash: receipt.hash,
      tokenAddress,
      blockNumber: receipt.blockNumber
    };
  }

  // Mint tokens
  async mintTokens(tokenAddress, amount, decimals, fee) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const parsedAmount = ethers.parseUnits(amount.toString(), decimals);

    const tx = await contract.mint(this.account, parsedAmount, {
      value: ethers.parseEther(fee.toString())
    });

    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  // Burn tokens
  async burnTokens(tokenAddress, amount, decimals) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const parsedAmount = ethers.parseUnits(amount.toString(), decimals);

    const tx = await contract.burn(parsedAmount);
    const receipt = await tx.wait();
    
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  // Get token info
  async getTokenInfo(tokenAddress) {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, decimals)
    };
  }

  // Add Liquidity (Token + Native)
  async addLiquidityETH(network, tokenAddress, tokenAmount, ethAmount, decimals) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const routerAddress = CONTRACT_ADDRESSES[network].DEXRouter;
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const routerContract = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, this.signer);

    // Approve token spending
    const parsedTokenAmount = ethers.parseUnits(tokenAmount.toString(), decimals);
    const approveTx = await tokenContract.approve(routerAddress, parsedTokenAmount);
    await approveTx.wait();

    // Add liquidity
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const tx = await routerContract.addLiquidityETH(
      tokenAddress,
      parsedTokenAmount,
      0, // amountTokenMin (0 for simplicity, should calculate slippage)
      0, // amountETHMin
      this.account,
      deadline,
      { value: ethers.parseEther(ethAmount.toString()) }
    );

    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  // Swap tokens
  async swapTokens(network, fromToken, toToken, amountIn, amountOutMin, decimalsIn, isFromNative, isToNative) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const routerAddress = CONTRACT_ADDRESSES[network].DEXRouter;
    const routerContract = new ethers.Contract(routerAddress, DEX_ROUTER_ABI, this.signer);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    let tx;

    if (isFromNative) {
      // Swap ETH for Tokens
      const path = [ethers.ZeroAddress, toToken]; // Use zero address for native token
      tx = await routerContract.swapExactETHForTokens(
        ethers.parseUnits(amountOutMin.toString(), 18),
        path,
        this.account,
        deadline,
        { value: ethers.parseEther(amountIn.toString()) }
      );
    } else if (isToNative) {
      // Swap Tokens for ETH
      const tokenContract = new ethers.Contract(fromToken, ERC20_ABI, this.signer);
      const parsedAmount = ethers.parseUnits(amountIn.toString(), decimalsIn);
      
      // Approve
      const approveTx = await tokenContract.approve(routerAddress, parsedAmount);
      await approveTx.wait();

      const path = [fromToken, ethers.ZeroAddress];
      tx = await routerContract.swapExactTokensForETH(
        parsedAmount,
        ethers.parseEther(amountOutMin.toString()),
        path,
        this.account,
        deadline
      );
    } else {
      // Swap Token for Token
      const tokenContract = new ethers.Contract(fromToken, ERC20_ABI, this.signer);
      const parsedAmount = ethers.parseUnits(amountIn.toString(), decimalsIn);
      
      // Approve
      const approveTx = await tokenContract.approve(routerAddress, parsedAmount);
      await approveTx.wait();

      const path = [fromToken, toToken];
      tx = await routerContract.swapExactTokensForTokens(
        parsedAmount,
        0, // amountOutMin (should calculate with slippage)
        path,
        this.account,
        deadline
      );
    }

    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  // Create Presale
  async createPresale(network, presaleData, fee) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const contractAddress = CONTRACT_ADDRESSES[network].PresaleFactory;
    const contract = new ethers.Contract(contractAddress, PRESALE_FACTORY_ABI, this.signer);

    const startTime = Math.floor(new Date(presaleData.startDate).getTime() / 1000);
    const endTime = Math.floor(new Date(presaleData.endDate).getTime() / 1000);

    const tx = await contract.createPresale(
      presaleData.tokenAddress,
      ethers.parseEther(presaleData.softCap.toString()),
      ethers.parseEther(presaleData.hardCap.toString()),
      startTime,
      endTime,
      ethers.parseEther(presaleData.minContribution.toString()),
      ethers.parseEther(presaleData.maxContribution.toString()),
      { value: ethers.parseEther(fee.toString()) }
    );

    const receipt = await tx.wait();
    const presaleAddress = receipt.logs[0].address;
    
    return {
      txHash: receipt.hash,
      presaleAddress,
      blockNumber: receipt.blockNumber
    };
  }

  // Invest in Presale
  async investInPresale(presaleAddress, amount) {
    if (!this.signer) throw new Error('Wallet not connected');
    
    const contract = new ethers.Contract(presaleAddress, PRESALE_ABI, this.signer);
    
    const tx = await contract.invest({
      value: ethers.parseEther(amount.toString())
    });

    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  // Estimate gas for transaction
  async estimateGas(to, data, value) {
    if (!this.provider) throw new Error('Provider not initialized');
    
    const gasEstimate = await this.provider.estimateGas({
      to,
      data,
      value: value ? ethers.parseEther(value.toString()) : undefined
    });

    const feeData = await this.provider.getFeeData();
    const gasCost = gasEstimate * feeData.gasPrice;
    
    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei'),
      totalCost: ethers.formatEther(gasCost)
    };
  }
}

export const web3Service = new Web3Service();