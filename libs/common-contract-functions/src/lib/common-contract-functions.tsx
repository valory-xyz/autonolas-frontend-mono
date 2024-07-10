import styles from './common-contract-functions.module.css';

/* eslint-disable-next-line */
export interface CommonContractFunctionsProps {}

export function CommonContractFunctions(props: CommonContractFunctionsProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to CommonContractFunctions!</h1>
    </div>
  );
}

export default CommonContractFunctions;
