import { EmptyMessage } from 'components/styles';

export const ListEmptyMessage = ({ type = null }: { type: string | null }) => {
  if (!type) {
    return <EmptyMessage>Please check type!</EmptyMessage>;
  }

  return (
    <EmptyMessage data-testid="not-registered-message">
      <div className="empty-message-logo" />
      <p>{`No ${type}s registered`}</p>
    </EmptyMessage>
  );
};
