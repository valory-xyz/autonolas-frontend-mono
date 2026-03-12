/**
 * Error component displayed when a user tries to connect with an address
 * that is on the OFAC (Office of Foreign Assets Control) prohibited list
 */
export const CannotConnectAddressOfacError = () => (
  <>
    Cannot connect – address is on&nbsp;
    <a rel="noreferrer" href="https://www.treasury.gov/ofac/downloads/sdnlist.pdf" target="_blank">
      OFAC SDN list
    </a>
  </>
);
