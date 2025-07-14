import { ethers } from 'ethers';

export async function verifyAddress(account, id) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/link`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discord_id: id, wallet_address: account }),
    });

    // no need to return the response, if resolved then verified
    return null;
  } catch (error) {
    console.error(error);
    return error;
  }
}

function verifyPayload(payload, signature) {
  const messageHash = ethers.hashMessage(payload);
  const recoveredAddress = ethers.recoverAddress(messageHash, signature);
  return recoveredAddress === process.env.NEXT_PUBLIC_DISCORD_VERIFICATION_ADDRESS;
}

export function isRouteValid(linkExpiration, signature, discordId) {
  const isExpiration = !!linkExpiration;
  const isSignature = !!signature;

  if (!isExpiration && !isSignature && !discordId) {
    // when we have no args in the contribute flow, allow redirect to the flow
    return true;
  }

  if (isExpiration && linkExpiration < Date.now()) {
    // if the verification is included and lower than now we return not valid
    return false;
  }

  if (!isSignature) {
    // if no signature we return false
    return false;
  }

  const payload = {
    'discord-id': String(discordId),
    'link-expiration': Number(linkExpiration),
  };

  // our check that the address of the signer of the message matches the address we are expecting.
  return verifyPayload(JSON.stringify(payload), signature);
}
