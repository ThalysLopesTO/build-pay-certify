import { Progress } from 'vite_react_shadcn_ts';

const wrap = { display: 'grid', gap: 16, width: 320 } as const;
const labelRow = { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 } as const;

export function Levels() {
  return (
    <div style={wrap}>
      <div>
        <div style={labelRow}><span>Hours to 40h goal</span><span>25%</span></div>
        <Progress value={25} />
      </div>
      <div>
        <div style={labelRow}><span>Project completion</span><span>68%</span></div>
        <Progress value={68} />
      </div>
      <div>
        <div style={labelRow}><span>Invoices collected</span><span>100%</span></div>
        <Progress value={100} />
      </div>
    </div>
  );
}
