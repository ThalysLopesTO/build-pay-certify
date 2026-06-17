import { Tabs, TabsList, TabsTrigger, TabsContent } from 'vite_react_shadcn_ts';

const panel = { padding: '14px 4px', fontSize: 14, color: '#475569' } as const;

export function Overview() {
  return (
    <Tabs defaultValue="hours" style={{ width: 380 }}>
      <TabsList>
        <TabsTrigger value="hours">Hours</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="hours"><div style={panel}>112.5 hours logged across 14 workers this week.</div></TabsContent>
      <TabsContent value="tasks"><div style={panel}>8 of 11 tasks completed on the Riverside site.</div></TabsContent>
      <TabsContent value="reports"><div style={panel}>2 daily reports awaiting your approval.</div></TabsContent>
    </Tabs>
  );
}
