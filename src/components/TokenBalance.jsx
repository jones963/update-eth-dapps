import React from 'react';

const TokenBalance = ({ balances, loading }) => {
if (loading) return <div className="text-gray-400 animate-pulse">Loading...</div>;
if (!balances) return <div className="text-gray-500">Connect wallet to see balances</div>;
return (

<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-
gray-200">

<h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Your Balances</h3>
<div className="space-y-3">
<div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700
rounded">
<span className="font-semibold">Native Token</span>
<span className="text-blue-600 font-mono">{balances.eth}</span>
</div>
{balances.tokens.map((token) => (
<div key={token.symbol} className="flex justify-between items-center p-3 bg-gray-50
dark:bg-gray-700 rounded">
<span className="font-semibold">{token.symbol.toUpperCase()}</span>
<span className="text-green-600 font-mono">{token.balance}</span>
</div>
))}
</div>
</div>
);
};
export default TokenBalance;