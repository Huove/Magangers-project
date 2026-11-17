
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

interface ParticipantOption {
  value: string;
  label: string;
}

interface Props {
  options: ParticipantOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function SearchableParticipantSelect({
  options,
  value,
  onChange,
}: Props) {
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left outline-none focus:border-blue-600"
      >
        <span
          className={
            selected ? "text-gray-800" : "text-gray-400"
          }
        >
          {selected?.label ?? "-- Cari atau pilih peserta --"}
        </span>

        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Tutup pilihan peserta"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />

                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Ketik nama atau posisi..."
                  className="w-full py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-gray-400">
                  Peserta tidak ditemukan.
                </p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setSearch("");
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                  >
                    <span>{option.label}</span>

                    {option.value === value && (
                      <Check className="h-4 w-4 shrink-0 text-blue-600" />
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
