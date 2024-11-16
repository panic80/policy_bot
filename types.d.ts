declare module 'next' {
  export type NextPage<P = {}, IP = P> = {
    (props: P): JSX.Element | null;
    defaultProps?: Partial<P>;
    displayName?: string;
  };
}

