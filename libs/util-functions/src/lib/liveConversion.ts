const cache = new Map<number, number>();

export async function convertUsdToEth(
  usdAmount: number,
  roundTo: number = 4,
): Promise<number | null> {
  if (cache.has(usdAmount)) {
    return cache.get(usdAmount) as number;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    );
    const data = await response.json();

    const ethRate = data.ethereum.usd;
    const ethAmount = usdAmount / ethRate;
    const ethAmountRounded = Number(ethAmount.toFixed(roundTo));

    // Cache the result
    cache.set(usdAmount, ethAmountRounded);

    return ethAmountRounded;
  } catch (error) {
    throw new Error('Error fetching conversion rate');
  }
}
