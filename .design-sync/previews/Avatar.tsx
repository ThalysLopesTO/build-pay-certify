import { Avatar, AvatarImage, AvatarFallback } from 'vite_react_shadcn_ts';

export function Fallback() {
  return (
    <Avatar>
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}

export function WithImage() {
  return (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/96?img=12" alt="Alex Lopes" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}

export function Stack() {
  return (
    <div style={{ display: 'flex' }}>
      {['JD', 'RM', 'AL', 'KP'].map((initials, i) => (
        <Avatar key={initials} style={{ marginLeft: i ? -10 : 0, boxShadow: '0 0 0 2px #fff' }}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
