import { useState, useCallback } from "react";

export interface StateManagerOptions<T> {
  initialValue: T;
  validator?: (value: T) => boolean;
  onStateChange?: (oldValue: T, newValue: T) => void;
}

export interface StateManager<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  reset: () => void;
  isValid: boolean;
}

export class StateAdapter {
  static createStateManager<T>(options: StateManagerOptions<T>) {
    return function useStateManager(): StateManager<T> {
      const { initialValue, validator, onStateChange } = options;
      const [value, setValueInternal] = useState<T>(initialValue);
      const [isValid, setIsValid] = useState(true);

      const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
        setValueInternal(prevValue => {
          const nextValue = typeof newValue === "function" 
            ? (newValue as (prev: T) => T)(prevValue) 
            : newValue;

          // Validate if validator provided
          const valid = validator ? validator(nextValue) : true;
          setIsValid(valid);

          // Call change handler if provided
          if (onStateChange && valid) {
            onStateChange(prevValue, nextValue);
          }

          return valid ? nextValue : prevValue;
        });
      }, [validator, onStateChange]);

      const reset = useCallback(() => {
        setValue(initialValue);
        setIsValid(true);
      }, [initialValue, setValue]);

      return {
        value,
        setValue,
        reset,
        isValid,
      };
    };
  }

  // Pre-built state managers for common patterns
  static createLoadingState(initialLoading = false) {
    return this.createStateManager({
      initialValue: { isLoading: initialLoading, error: null as string | null },
      validator: (state) => typeof state.isLoading === "boolean",
    });
  }

  static createModalState(initialOpen = false) {
    return this.createStateManager({
      initialValue: { isOpen: initialOpen, data: null as any },
      validator: (state) => typeof state.isOpen === "boolean",
    });
  }

  static createFormState<T extends Record<string, any>>(initialData: T) {
    return this.createStateManager({
      initialValue: { 
        data: initialData, 
        errors: {} as Partial<Record<keyof T, string>>,
        isDirty: false,
        isValid: true 
      },
      validator: (state) => state.isValid,
    });
  }

  static createListState<T>(initialItems: T[] = []) {
    return this.createStateManager({
      initialValue: {
        items: initialItems,
        selectedIds: new Set<string | number>(),
        filter: "",
        sortBy: "default",
      },
      validator: (state) => Array.isArray(state.items),
    });
  }
}

// Utility functions for common state operations
export const StateUtils = {
  toggleItem<T>(items: T[], item: T, key: keyof T): T[] {
    const index = items.findIndex(i => i[key] === item[key]);
    if (index === -1) {
      return [...items, item];
    } else {
      return items.filter((_, i) => i !== index);
    }
  },

  updateItem<T>(items: T[], updatedItem: T, key: keyof T): T[] {
    return items.map(item => 
      item[key] === updatedItem[key] ? updatedItem : item
    );
  },

  removeItem<T>(items: T[], itemToRemove: T, key: keyof T): T[] {
    return items.filter(item => item[key] !== itemToRemove[key]);
  },

  sortItems<T>(items: T[], sortBy: keyof T, direction: "asc" | "desc" = "asc"): T[] {
    return [...items].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  },

  filterItems<T>(items: T[], predicate: (item: T) => boolean): T[] {
    return items.filter(predicate);
  },
}; 