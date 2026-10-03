import { useEffect, useState } from 'react';
import { validWeight } from '../core/weights';

type WeightControlProps = { value: number; increment: number; onChange: (value: number) => void };
export function WeightControl({ value, increment, onChange }: WeightControlProps) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  function adjust(direction: number) {
    const next = Math.min(100, Math.max(0, Number((value + direction * increment).toFixed(3))));
    setDraft(String(next));
    onChange(next);
  }
  return (
    <div className="weight-control" role="group" aria-label="Element weight">
      <span>Weight</span>
      <button
        type="button"
        aria-label="Decrease weight"
        disabled={value <= 0}
        onClick={() => adjust(-1)}
      >
        −
      </button>
      <input
        type="number"
        aria-label="Weight"
        min="0"
        max="100"
        step={increment}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          const next = event.target.valueAsNumber;
          if (validWeight(next)) onChange(next);
        }}
        onBlur={() => setDraft(String(value))}
      />
      <button
        type="button"
        aria-label="Increase weight"
        disabled={value >= 100}
        onClick={() => adjust(1)}
      >
        +
      </button>
    </div>
  );
}
