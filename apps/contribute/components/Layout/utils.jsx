import axios from 'axios';

const WALLET_STATUS = {
  linked: 'linked',
  unlinked: 'unlinked',
  linking: 'linking',
};

const pollStatus = async (url) =>
  new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(url);
        const walletStatus = response?.data?.status;

        // if linking, poll the status
        if (walletStatus !== WALLET_STATUS.linking) {
          clearInterval(interval);
          resolve(walletStatus === WALLET_STATUS.linked);
        }
      } catch (error) {
        reject(error);
      }
    }, 4000);
  });

export async function getAddressStatus(account) {
  return new Promise((resolve, reject) => {
    try {
      const URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/address_status/${account}`;

      axios.get(URL).then((response) => {
        const walletStatus = response?.data?.status;

        // if `linking`, poll until linked or unlinked else resolve
        if (walletStatus !== WALLET_STATUS.linking) {
          resolve(walletStatus === WALLET_STATUS.linked);
        } else {
          pollStatus(URL).then((pollResponse) => {
            resolve(pollResponse);
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
