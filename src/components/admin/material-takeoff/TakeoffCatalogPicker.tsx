import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaterialCatalog, MaterialCatalogItem } from '@/hooks/useMaterialCatalog';
import { normalizeForSearch } from '@/utils/employeeSearch';
import { cleanQuantity } from '@/utils/takeoffItems';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TakeoffCatalogPickerProps {
  /** Catalog ids already on the takeoff (shown with an "on list" tag). */
  onListIds: Set<string>;
  onAdd: (picks: Array<{ item: MaterialCatalogItem; quantity: number }>) => void;
  onClose: () => void;
}

const matches = (item: MaterialCatalogItem, words: string[]) => {
  if (words.length === 0) return true;
  const hay = normalizeForSearch(
    [item.name, item.sku, item.spec_size, item.category_name, item.unit].filter(Boolean).join(' '),
  );
  return words.every(w => hay.includes(w));
};

/**
 * Pick several Material Catalog items at once, each with a quantity.
 * Shown inline inside the takeoff editor (not a second dialog).
 */
const TakeoffCatalogPicker: React.FC<TakeoffCatalogPickerProps> = ({ onListIds, onAdd, onClose }) => {
  const { data: catalog = [], isLoading, error } = useMaterialCatalog(undefined, undefined, true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  // catalog id -> quantity text while picking
  const [picked, setPicked] = useState<Record<string, string>>({});

  const categories = useMemo(
    () => [...new Set(catalog.map(i => i.category_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [catalog],
  );

  const visible = useMemo(() => {
    const words = normalizeForSearch(search).split(/\s+/).filter(Boolean);
    return catalog.filter(i => (category === 'all' || i.category_name === category) && matches(i, words));
  }, [catalog, search, category]);

  // Group by category for easier scanning
  const groups = useMemo(() => {
    const map = new Map<string, MaterialCatalogItem[]>();
    for (const item of visible) {
      const key = item.category_name || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()];
  }, [visible]);

  const pickedCount = Object.keys(picked).length;

  const toggle = (item: MaterialCatalogItem) =>
    setPicked(prev => {
      const next = { ...prev };
      if (item.id in next) delete next[item.id];
      else next[item.id] = '1';
      return next;
    });

  const setQty = (id: string, value: string) => setPicked(prev => ({ ...prev, [id]: value }));

  const handleAdd = () => {
    const byId = new Map(catalog.map(i => [i.id, i]));
    const picks = Object.entries(picked)
      .map(([id, qty]) => ({ item: byId.get(id)!, quantity: cleanQuantity(qty) }))
      .filter(p => p.item);
    onAdd(picks);
    setPicked({});
  };

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Add from Material Catalog</h4>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={onClose} aria-label="Close catalog">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, SKU or size…"
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className="max-h-72 overflow-y-auto rounded-md border bg-background"
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">Could not load the Material Catalog.</p>
        ) : catalog.length === 0 ? (
          <p className="py-8 px-4 text-center text-sm text-muted-foreground">
            Your Material Catalog is empty. Add materials in System Settings → Material Catalog, or use “Custom item”.
          </p>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No materials match “{search}”.</p>
        ) : (
          groups.map(([group, list]) => (
            <div key={group}>
              <div className="sticky top-0 z-10 bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </div>
              {list.map(item => {
                const isPicked = item.id in picked;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-muted/40',
                      isPicked && 'bg-primary/5',
                    )}
                    onClick={() => toggle(item)}
                  >
                    <Checkbox checked={isPicked} onCheckedChange={() => toggle(item)} onClick={e => e.stopPropagation()} aria-label={`Select ${item.name}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {item.name}
                        {onListIds.has(item.id) && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">on list</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[item.spec_size, item.sku && `SKU ${item.sku}`, item.unit].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {isPicked && (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={picked[item.id]}
                          onChange={e => setQty(item.id, e.target.value)}
                          className="h-8 w-20 text-right"
                          aria-label={`Quantity of ${item.name}`}
                        />
                        <span className="w-10 text-xs text-muted-foreground">{item.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {pickedCount > 0 ? `${pickedCount} selected` : 'Tick materials and set quantities'}
        </span>
        <Button type="button" size="sm" disabled={pickedCount === 0} onClick={handleAdd}>
          Add {pickedCount > 0 ? pickedCount : ''} to takeoff
        </Button>
      </div>
    </div>
  );
};

export default TakeoffCatalogPicker;
