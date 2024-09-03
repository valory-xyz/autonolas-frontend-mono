export async function convertUsdToEth(
  usdAmount: number,
  roundTo: number = 4,
): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
    );
    const data = await response.json();

    const ethRate = data.ethereum.usd; // USD to ETH rate
    const ethAmount = usdAmount / ethRate;

    return Number(ethAmount.toFixed(roundTo));
  } catch (error) {
    throw new Error('Error fetching conversion rate');
  }
}
