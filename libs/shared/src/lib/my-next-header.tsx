import styles from './my-next-header.module.css';

/* eslint-disable-next-line */
export interface MyNextHeaderProps {}

export function MyNextHeader(props: MyNextHeaderProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to MyNextHeader!</h1>
    </div>
  );
}

export default MyNextHeader;
