"use client";

import { useState } from "react";

type OptionsInputProps = {
  name: string;
  initialOptions?: string[] | null;
  label?: string;
  placeholder?: string;
};

export default function OptionsInput({
  name,
  initialOptions = [],
  label = "Options",
  placeholder = "e.g. UK 8",
}: OptionsInputProps) {
  const sanitizedInitial =
    initialOptions?.map((value) => value?.trim()).filter((value) => !!value) ?? [];
  const [options, setOptions] = useState(sanitizedInitial);
  const [inputValue, setInputValue] = useState("");

  const addOption = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    if (options.some((option) => option.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      return;
    }
    setOptions((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  const removeOption = (value: string) => {
    setOptions((prev) => prev.filter((option) => option !== value));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addOption();
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={addOption}
          className="rounded-full border border-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition duration-200 hover:bg-accent/10"
        >
          Add option
        </button>
      </div>
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <span
              key={option}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm text-foreground"
            >
              {option}
              <button
                type="button"
                onClick={() => removeOption(option)}
                className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
              >
                ×
              </button>
              <input type="hidden" name={name} value={option} />
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/50">No options added.</p>
      )}
      {options.length === 0 && <input type="hidden" name={name} value="" />}
    </div>
  );
}

