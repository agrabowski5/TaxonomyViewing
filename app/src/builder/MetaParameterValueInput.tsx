import { COUNTRIES } from "./countryList";
import type { MetaDimension } from "./types";

interface Props {
  dimension: MetaDimension;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const YEAR_OPTIONS: number[] = [];
for (let y = 2030; y >= 1990; y--) YEAR_OPTIONS.push(y);

export function MetaParameterValueInput({ dimension, value, onChange, className, style }: Props) {
  if (dimension === "geography") {
    return (
      <>
        <input
          list="country-list"
          className={className}
          style={style}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select country..."
        />
        <datalist id="country-list">
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name} />
          ))}
        </datalist>
      </>
    );
  }

  if (dimension === "time") {
    return (
      <select
        className={className}
        style={style}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select year...</option>
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    );
  }

  // jurisdiction, production_standard, grade: plain text input
  return (
    <input
      className={className}
      style={style}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value"
    />
  );
}
