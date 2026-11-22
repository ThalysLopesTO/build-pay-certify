import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMaterialTakeoffNotes } from '@/hooks/useMaterialTakeoffNotes';
import { useMaterialTakeoffItems } from '@/hooks/useMaterialTakeoffItems';
import { MATERIAL_UNITS } from '@/hooks/useMaterialCatalog';
import {
  TakeoffItemDraft,
  addCatalogPicks,
  addCustomItem,
  cleanQuantity,
  sameItems,
} from '@/utils/takeoffItems';
import TakeoffCatalogPicker from './TakeoffCatalogPicker';
import { toast } from 'react-hot-toast';
import { Loader2, Save, X, Plus, Package, Trash2, PenLine, ChevronUp, ChevronDown } from 'lucide-react';

interface MaterialTakeoffNotesEditorProps {
  jobsiteId: string;
  jobsiteName: string;
  open: boolean;
  onClose: () => void;
}

const toDraft = (i: TakeoffItemDraft): TakeoffItemDraft => ({
  id: i.id,
  catalog_item_id: i.catalog_item_id,
  name: i.name,
  sku: i.sku,
  spec_size: i.spec_size,
  unit: i.unit,
  category_name: i.category_name,
  quantity: i.quantity,
  notes: i.notes,
});

const MaterialTakeoffNotesEditor: React.FC<MaterialTakeoffNotesEditorProps> = ({
  jobsiteId,
  jobsiteName,
  open,
  onClose,
}) => {
  const { getNoteByJobsite, createOrUpdateNote } = useMaterialTakeoffNotes();
  const { getItemsByJobsite, saveItems, tableMissing, isLoading: itemsLoading } = useMaterialTakeoffItems();

  const existingNote = getNoteByJobsite(jobsiteId);
  const savedItems = useMemo(() => getItemsByJobsite(jobsiteId).map(toDraft), [getItemsByJobsite, jobsiteId]);

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TakeoffItemDraft[]>([]);
  const [qtyText, setQtyText] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ name: '', unit: 'pcs', quantity: '1' });
  const [saving, setSaving] = useState(false);

  // Load the saved takeoff once per opening, so a background refresh never
  // wipes what the user is typing.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      loadedRef.current = false;
      return;
    }
    if (loadedRef.current || itemsLoading) return;
    loadedRef.current = true;
    setNotes(existingNote?.takeoff_notes || '');
    setItems(savedItems);
    setQtyText({});
    setShowPicker(savedItems.length === 0 && !tableMissing);
    setShowCustom(false);
    setCustom({ name: '', unit: 'pcs', quantity: '1' });
  }, [open, itemsLoading, existingNote, savedItems, tableMissing]);

  const notesChanged = notes !== (existingNote?.takeoff_notes || '');
  const itemsChanged = !tableMissing && !sameItems(items, savedItems);
  const hasChanges = notesChanged || itemsChanged;

  const onListIds = useMemo(
    () => new Set(items.map(i => i.catalog_item_id).filter(Boolean) as string[]),
    [items],
  );

  const updateItem = (id: string, patch: Partial<TakeoffItemDraft>) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const moveItem = (index: number, dir: -1 | 1) =>
    setItems(prev => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const handleAddCustom = () => {
    if (!custom.name.trim()) return;
    setItems(prev => addCustomItem(prev, { ...custom, quantity: cleanQuantity(custom.quantity) }));
    setCustom({ name: '', unit: custom.unit, quantity: '1' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (itemsChanged) {
        try {
          await saveItems.mutateAsync({ jobsiteId, items });
        } catch (error) {
          toast.error('Failed to save the material list');
          throw error;
        }
      }
      // Save the notes when they changed, and also the first time a list is
      // saved so the jobsite shows up on the Material Takeoffs page.
      const needsNoteRow = !existingNote && items.length > 0;
      if (notesChanged || needsNoteRow) {
        await createOrUpdateNote.mutateAsync({ jobsiteId, notes });
      } else {
        toast.success('Material takeoff saved');
      }
      onClose();
    } catch (error) {
      // The failing step already showed its own error message; keep the dialog open
      console.error('Error saving material takeoff:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (saving) return;
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleCancel(); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Material Takeoff - {jobsiteName}
          </DialogTitle>
          <DialogDescription>
            Pick materials from your Material Catalog and set quantities. Use the notes for anything else.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-1">
          {/* Material list */}
          {tableMissing ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              The material list isn't switched on yet for this account (database update pending). You can keep using the notes below.
            </div>
          ) : (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Materials {items.length > 0 && <span className="text-muted-foreground font-normal">({items.length})</span>}
                </Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={showPicker ? 'secondary' : 'default'} onClick={() => setShowPicker(v => !v)}>
                    <Plus className="h-4 w-4 mr-1" /> Add from catalog
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowCustom(v => !v)}>
                    <PenLine className="h-4 w-4 mr-1" /> Custom item
                  </Button>
                </div>
              </div>

              {showPicker && (
                <TakeoffCatalogPicker
                  onListIds={onListIds}
                  onAdd={(picks) => {
                    setItems(prev => addCatalogPicks(prev, picks));
                    setQtyText({});
                    setShowPicker(false);
                  }}
                  onClose={() => setShowPicker(false)}
                />
              )}

              {showCustom && (
                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    For a material that isn't in the catalog. It's added to this takeoff only.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      autoFocus
                      value={custom.name}
                      onChange={e => setCustom(c => ({ ...c, name: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
                      placeholder="Material name"
                      maxLength={300}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={custom.quantity}
                        onChange={e => setCustom(c => ({ ...c, quantity: e.target.value }))}
                        className="w-24 text-right"
                        aria-label="Quantity"
                      />
                      <Input
                        list="takeoff-units"
                        value={custom.unit}
                        onChange={e => setCustom(c => ({ ...c, unit: e.target.value }))}
                        className="w-24"
                        aria-label="Unit"
                        maxLength={20}
                      />
                      <Button type="button" onClick={handleAddCustom} disabled={!custom.name.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>
                  <datalist id="takeoff-units">
                    {MATERIAL_UNITS.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              )}

              {items.length === 0 ? (
                !showPicker && (
                  <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                    No materials yet. Click “Add from catalog” to pick materials.
                  </div>
                )
              ) : (
                <div className="rounded-lg border divide-y">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.name}
                          {!item.catalog_item_id && (
                            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">custom</span>
                          )}
                        </div>
                        {(item.spec_size || item.sku || item.category_name) && (
                          <div className="text-xs text-muted-foreground truncate">
                            {[item.category_name, item.spec_size, item.sku && `SKU ${item.sku}`].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        <Input
                          value={item.notes || ''}
                          onChange={e => updateItem(item.id, { notes: e.target.value })}
                          placeholder="Note (optional)"
                          maxLength={1000}
                          className="mt-1.5 h-7 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={qtyText[item.id] ?? String(item.quantity)}
                          onChange={e => {
                            setQtyText(t => ({ ...t, [item.id]: e.target.value }));
                            updateItem(item.id, { quantity: cleanQuantity(e.target.value) });
                          }}
                          onBlur={() => setQtyText(t => { const n = { ...t }; delete n[item.id]; return n; })}
                          className="h-8 w-24 text-right"
                          aria-label={`Quantity of ${item.name}`}
                        />
                        <span className="w-12 text-xs text-muted-foreground">{item.unit}</span>
                        <div className="flex flex-col">
                          <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === 0} onClick={() => moveItem(index, -1)} aria-label="Move up">
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} aria-label="Move down">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Free-text notes (unchanged) */}
          <section className="flex flex-col gap-2">
            <Label htmlFor="notes">
              Notes
              <span className="text-sm text-muted-foreground ml-2">(delivery, supplier, anything else)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={'e.g.\n- Check with supplier for bulk pricing\n- Delivery needed by Friday'}
              className="min-h-[140px] font-mono text-sm"
              maxLength={50000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {notes.length.toLocaleString()} / 50,000 characters
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {existingNote ? (
              <>Last updated: {new Date(existingNote.updated_at).toLocaleString()}</>
            ) : (
              <>New material takeoff</>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialTakeoffNotesEditor;
