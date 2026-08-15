"use client";

import { useState } from "react";

interface TaskToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function TaskToolbar({
  search,
  onSearchChange,
}: TaskToolbarProps) {
  const [isSearchOpen, setIsSearchOpen] =
    useState(Boolean(search));

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    if (search.trim()) {
      return;
    }

    setIsSearchOpen(false);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center">
      {isSearchOpen ? (
        <div className="flex h-9 w-full max-w-md items-center rounded-md border border-gray-300 bg-white">
          <span className="pl-3 text-sm text-gray-400">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
            placeholder="Search tasks..."
            autoFocus
            className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />

          <button
            type="button"
            onClick={handleCloseSearch}
            className="mr-1 rounded-md px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close search"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpenSearch}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <span className="text-sm text-gray-500">
            ⌕
          </span>

          <span className="hidden sm:inline">
            Search
          </span>
        </button>
      )}
    </div>
  );
}