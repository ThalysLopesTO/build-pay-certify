import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
  Badge,
} from 'vite_react_shadcn_ts';

const rows = [
  { name: 'Danillo Souza', trade: 'Carpenter', hours: '38.0', status: 'Approved' },
  { name: 'Josemar Reis', trade: 'Electrician', hours: '40.0', status: 'Approved' },
  { name: 'Rubens Alves', trade: 'Laborer', hours: '32.5', status: 'Pending' },
];

export function Timesheets() {
  return (
    <div style={{ width: 460 }}>
      <Table>
        <TableCaption>Week of Apr 8 — Riverside Tower</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Worker</TableHead>
            <TableHead>Trade</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell style={{ fontWeight: 500 }}>{r.name}</TableCell>
              <TableCell>{r.trade}</TableCell>
              <TableCell>{r.hours}</TableCell>
              <TableCell>
                <Badge variant={r.status === 'Approved' ? 'secondary' : 'outline'}>{r.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
