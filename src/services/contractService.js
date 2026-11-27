import { ethers } from 'ethers';
import TOKEN_ABI from '../contracts/USDT.json';
import { TOKEN_ADDRESSES } from '../utils/constants';
export class ContractService {
constructor(provider) {
this.provider = provider;
}
async getBalances(provider, address, chainId) {
try {
const ethBalance = await provider.getBalance(address);
const balances = {
eth: parseFloat(ethers.formatEther(ethBalance)).toFixed(4),
tokens: []
};
const tokenConfigs = TOKEN_ADDRESSES[chainId];
if (!tokenConfigs) return balances;
for (const [symbol, tokenAddress] of Object.entries(tokenConfigs)) {
try {
const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
const rawBalance = await contract.balanceOf(address);

const decimals = Number(await contract.decimals());
const formatted = parseFloat(ethers.formatUnits(rawBalance, decimals)).toFixed(4);
if (parseFloat(formatted) > 0) {
balances.tokens.push({ symbol, address: tokenAddress, balance: formatted });
}
} catch (e) {
console.warn(`Error fetching ${symbol}:`, e);
}
}
return { ...balances, chainId };
} catch (error) {
throw error;
}
}
}