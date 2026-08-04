"use client";

import { ListFilter, ListOrdered, X } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApplicationFilters } from "@/types/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = NonNullable<ApplicationFilters["sort"]>;

export const SORT_OPTIONS: [SortOption, string][] = [
  ["date_desc", "Newest application"],
  ["date_asc", "Oldest application"],
];

export interface FilterFieldConfig {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  type?: "select" | "number";
  placeholder?: string;
}

export interface ActiveFilter {
  label: string;
  onClear: () => void;
}

interface FilterBarProps {
  id: string;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  fields: FilterFieldConfig[];
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  const selectedLabel =
    options.find(([optionValue]) => optionValue === value)?.[1] ??
    "Select option";
  return (
    <Select
      value={value}
      onValueChange={(selectedValue) => {
        onChange(selectedValue);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground",
        )}
      >
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, label]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface FilterBarShellProps {
  id: string;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  gridClassName: string;
  children: ReactNode;
  activeFilters: ActiveFilter[];
  onClearAll: () => void;
}

export function FilterBarShell({
  id,
  filtersOpen,
  onToggleFilters,
  gridClassName,
  children,
  activeFilters,
  onClearAll,
}: FilterBarShellProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls={id}
          onClick={onToggleFilters}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-muted"
        >
          <ListFilter size={16} />
          Advanced Filters
        </button>
      </div>
      {filtersOpen && (
        <div
          id={id}
          className={cn("grid gap-4 rounded-xl border border-border bg-card p-4", gridClassName)}
        >
          {children}
        </div>
      )}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <Badge key={filter.label} variant="outline" className="gap-1.5 px-3 py-1">
              {filter.label}
              <button type="button" onClick={filter.onClear} aria-label={`Clear ${filter.label}`}>
                ×
              </button>
            </Badge>
          ))}
          <Button type="button" variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={onClearAll}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  id,
  filtersOpen,
  onToggleFilters,
  fields,
  sort,
  onSortChange,
  activeFilters,
  onClearAll,
}: FilterBarProps) {
  const sortLabel =
    SORT_OPTIONS.find(([optionValue]) => optionValue === sort)?.[1] ??
    "Sort by";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls={id}
          onClick={onToggleFilters}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-muted"
        >
          <ListFilter size={16} />
          Advanced Filters
        </button>
        <Select
          aria-label="Sort applicants"
          value={sort}
          onValueChange={(selectedValue) => {
            onSortChange(selectedValue as SortOption);
          }}
        >
          <SelectTrigger className="h-auto min-w-[14rem] rounded-lg border border-border bg-card py-2 text-foreground shadow-none transition-colors hover:bg-muted focus-visible:border-border focus-visible:ring-0 data-[size=default]:h-auto">
            <span className="flex min-w-0 items-center">
              <ListOrdered size={16} aria-hidden="true" />
              <SelectValue className="truncate text-left">
                {sortLabel}
              </SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent
            position="popper"
            align="start"
            className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-0 px-2"
          >
            {SORT_OPTIONS.map(([optionValue, label]) => (
              <SelectItem key={optionValue} value={optionValue}>
                <span className="block truncate px-2">{label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtersOpen && (
        <div
          id={id}
          className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {fields.map((field) => (
            <FilterField key={field.key} label={field.label}>
              {field.type === "number" ? (
                <input
                  aria-label={field.label}
                  type="number"
                  min="0"
                  step="0.1"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                  }}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  placeholder={field.placeholder ?? "Any"}
                />
              ) : (
                <FilterSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={field.options}
                />
              )}
            </FilterField>
          ))}
        </div>
      )}
      {activeFilters.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Active filters"
        >
          {activeFilters.map((filter) => (
            <Badge
              key={filter.label}
              variant="outline"
              className="px-3 py-4 gap-1.5 md:py-1"
            >
              {filter.label}
              <button
                type="button"
                onClick={filter.onClear}
                aria-label={`Clear ${filter.label}`}
              >
                <X className="size-4 md:size-3" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs"
            onClick={onClearAll}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
