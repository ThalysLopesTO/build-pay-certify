// Curated barrel entry for design-sync — re-exports only the scoped UI Kit
// components so the bundle stays lean (no heavy non-curated primitives).
// esbuild resolves @/ via tsconfig paths (cfg.tsconfig).
export * from '@/components/ui/button';
export * from '@/components/ui/optimistic-button';
export * from '@/components/ui/input';
export * from '@/components/ui/textarea';
export * from '@/components/ui/label';
export * from '@/components/ui/select';
export * from '@/components/ui/checkbox';
export * from '@/components/ui/switch';
export * from '@/components/ui/radio-group';
export * from '@/components/ui/radio-card';
export * from '@/components/ui/multi-select';
export * from '@/components/ui/file-dropzone';
export * from '@/components/ui/card';
export * from '@/components/ui/badge';
export * from '@/components/ui/avatar';
export { default as EmployeeAvatar } from '@/components/ui/employee-avatar';
export * from '@/components/ui/table';
export * from '@/components/ui/progress';
export * from '@/components/ui/alert';
export * from '@/components/ui/status-badges';
export * from '@/components/ui/dialog';
export * from '@/components/ui/alert-dialog';
export * from '@/components/ui/confirm-dialog';
export * from '@/components/ui/dropdown-menu';
export * from '@/components/ui/popover';
export * from '@/components/ui/tooltip';
export * from '@/components/ui/tabs';
export * from '@/components/ui/accordion';
export * from '@/components/ui/skeleton';
export * from '@/components/ui/sonner';
