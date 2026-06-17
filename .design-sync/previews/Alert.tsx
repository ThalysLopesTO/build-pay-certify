import { Alert, AlertTitle, AlertDescription } from 'vite_react_shadcn_ts';

export function Default() {
  return (
    <Alert style={{ maxWidth: 460 }}>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        Three certificates expire within 30 days. Review them before assigning crews.
      </AlertDescription>
    </Alert>
  );
}

export function Destructive() {
  return (
    <Alert variant="destructive" style={{ maxWidth: 460 }}>
      <AlertTitle>Payment overdue</AlertTitle>
      <AlertDescription>
        Invoice #1042 is 12 days past due. Send a reminder to the client.
      </AlertDescription>
    </Alert>
  );
}
