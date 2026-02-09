import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ArrayFieldEditorProps<T> {
  items: T[];
  onUpdate: (items: T[]) => void;
  renderItem: (item: T, index: number, onChange: (updated: T) => void) => React.ReactNode;
  addLabel: string;
  newItem: () => T;
  maxItems?: number;
  collapsibleLabel?: (item: T, index: number) => string;
}

export function ArrayFieldEditor<T>({
  items,
  onUpdate,
  renderItem,
  addLabel,
  newItem,
  maxItems,
  collapsibleLabel,
}: ArrayFieldEditorProps<T>) {
  const handleAdd = () => {
    if (maxItems && items.length >= maxItems) return;
    onUpdate([...items, newItem()]);
  };

  const handleRemove = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, updated: T) => {
    const newItems = [...items];
    newItems[index] = updated;
    onUpdate(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onUpdate(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onUpdate(newItems);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const content = (
          <div className="flex gap-2">
            <div className="flex-1">
              {renderItem(item, index, (updated) => handleChange(index, updated))}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleMoveDown(index)}
                disabled={index === items.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

        if (collapsibleLabel) {
          return (
            <Collapsible key={index} defaultOpen={false}>
              <div className="border rounded-lg p-3 bg-muted/30">
                <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                  <span className="text-sm font-medium truncate">
                    {collapsibleLabel(item, index) || `Element ${index + 1}`}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  {content}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        }

        return (
          <div key={index} className="border rounded-lg p-3 bg-muted/30">
            {content}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={maxItems ? items.length >= maxItems : false}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {addLabel}
      </Button>
    </div>
  );
}
