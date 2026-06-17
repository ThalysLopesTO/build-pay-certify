import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge,
} from 'vite_react_shadcn_ts';

export function JobsiteCard() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader>
        <CardTitle>Riverside Tower — Phase 2</CardTitle>
        <CardDescription>Downtown · 14 workers on site</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>Hours logged today</span>
          <Badge variant="secondary">112.5 h</Badge>
        </div>
      </CardContent>
      <CardFooter style={{ display: 'flex', gap: 8 }}>
        <Button size="sm">Open</Button>
        <Button size="sm" variant="outline">Reports</Button>
      </CardFooter>
    </Card>
  );
}

export function Simple() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader>
        <CardTitle>Weekly summary</CardTitle>
        <CardDescription>Apr 8 – Apr 14</CardDescription>
      </CardHeader>
      <CardContent style={{ fontSize: 14, color: '#475569' }}>
        All timesheets approved. No pending exceptions.
      </CardContent>
    </Card>
  );
}
