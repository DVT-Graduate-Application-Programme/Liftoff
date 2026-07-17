"use client";

import { ChevronDown, ListFilter, ListOrdered, X } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApplicationFilters } from "@/types/api";

export type SortOption = NonNullable<ApplicationFilters["sort"]>;

export const SORT_OPTIONS: [SortOption, string][] = [
  ["score_desc", "Highest score"],
  ["score_asc", "Lowest score"],
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

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
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
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-input bg-background px-2 pr-8 text-sm text-foreground",
        )}
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-muted-foreground" />
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
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-foreground">
          <ListOrdered size={16} aria-hidden="true" />
          <span className="sr-only">Sort applicants</span>
          <select
            aria-label="Sort applicants"
            value={sort}
            onChange={(event) => {
              onSortChange(event.target.value as SortOption);
            }}
            className="appearance-none bg-transparent pr-1 text-sm outline-none"
          >
            {SORT_OPTIONS.map(([optionValue, label]) => (
              <option key={optionValue} value={optionValue}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </label>
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
                <FilterSelect value={field.value} onChange={field.onChange} options={field.options} />
              )}
            </FilterField>
          ))}
        </div>
      )}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <Badge key={filter.label} variant="outline" className="gap-1.5 px-3 py-1">
              {filter.label}
              <button type="button" onClick={filter.onClear} aria-label={`Clear ${filter.label}`}>
                <X size={12} />
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
