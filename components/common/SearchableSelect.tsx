
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih user",
  searchPlaceholder = "Cari nama...",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find(
    (option) => option.value === value
  );

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(keyword)
    );
  }, [options, search]);

  function closeDropdown() {
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <span
          className={
            selected ? "text-slate-700" : "text-slate-400"
          }
        >
          {selected?.label ?? placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup dropdown"
            onClick={closeDropdown}
            className="fixed inset-0 z-[95] cursor-default"
          />

          <div className="absolute left-0 top-full z-[100] mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                <Search
                  size={16}
                  className="shrink-0 text-slate-400"
                />

                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      closeDropdown();
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 py-2.5 text-sm outline-none"
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-5 text-center text-sm text-slate-400">
                  Data tidak ditemukan.
                </p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      closeDropdown();
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                      option.value === value
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    <span className="break-words">
                      {option.label}
                    </span>

                    {option.value === value && (
                      <Check
                        size={16}
                        className="shrink-0 text-blue-600"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
