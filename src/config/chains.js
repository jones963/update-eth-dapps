import { mainnet, bsc, polygon } from 'wagmi/chains';

export const supportedChains = [mainnet, bsc, polygon];
export const getChainName = (chainId) => {
switch (chainId) {
case mainnet.id: return 'Ethereum Mainnet';
case bsc.id: return 'Binance Smart Chain';
case polygon.id: return 'Polygon Network';
default: return `Chain ID ${chainId}`;
}
};