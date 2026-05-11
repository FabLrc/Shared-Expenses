"use client";

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export const ExpenseLabelInput = forwardRef<HTMLInputElement, Props>(
  function ExpenseLabelInput({ value, onChange, placeholder, required, id }: Props, ref) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/me/labels?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const labels = data.labels.filter(
          (l: string) => l.toLowerCase() !== query.toLowerCase()
        );
        setSuggestions(labels);
        setOpen(labels.length > 0);
        setHighlightIndex(-1);
      }
    } catch {
      // ignore
    }
  }, []);

  function handleChange(val: string) {
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(val), 200);
  }

  function selectLabel(label: string) {
    onChange(label);
    setOpen(false);
    setSuggestions([]);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter" || e.key === "Escape") {
        setOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
      case " ":
        if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
          e.preventDefault();
          selectLabel(suggestions[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHighlightIndex(-1);
        break;
      case "Tab":
        if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
          selectLabel(suggestions[highlightIndex]);
        }
        break;
    }
  }

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  return (
    <div className="relative">
      <Input
        ref={(node) => {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
      />
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((label, i) => (
            <li
              key={label}
              onMouseDown={(e) => {
                e.preventDefault();
                selectLabel(label);
              }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === highlightIndex
                  ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              }`}
            >
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
