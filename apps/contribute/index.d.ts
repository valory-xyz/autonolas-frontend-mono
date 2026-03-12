declare namespace JSX {
  interface IntrinsicElements {
    'w3m-button': {
      disabled?: boolean;
      balance?: 'show' | 'hide';
      size?: 'md' | 'sm';
      label?: string;
      loadingLabel?: string;
    };
  }
}
