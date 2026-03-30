export interface FormatOptions {
  quoteStrings?: boolean;
}

function isSchemeNumber(value: any): boolean {
  return (
    value &&
    typeof value === "object" &&
    typeof value.coerce === "function" &&
    "numberType" in value
  );
}

function isPair(value: any): boolean {
  return Array.isArray(value) && (value as any).pair === true;
}

function formatPair(pair: any, formatValue: (value: any) => string): string {
  const parts: string[] = [];
  let current = pair;

  while (isPair(current)) {
    parts.push(formatValue(current[0]));
    current = current[1];
  }

  if (current === null) {
    return `(${parts.join(" ")})`;
  }

  return `(${parts.join(" ")} . ${formatValue(current)})`;
}

export function formatSchemeValue(
  value: any,
  options: FormatOptions = {}
): string {
  const quoteStrings = options.quoteStrings ?? true;

  if (value === undefined) return "undefined";
  if (value === null) return "()";
  if (isSchemeNumber(value)) return String(value.coerce());
  if (typeof value === "boolean") return value ? "#t" : "#f";
  if (typeof value === "string") {
    return quoteStrings ? `"${value}"` : value;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "function") return "#<procedure>";
  if (value && typeof value === "object" && typeof value.sym === "string") {
    return value.sym;
  }
  if (isPair(value)) {
    return formatPair(value, v => formatSchemeValue(v, options));
  }
  if (Array.isArray(value)) {
    const elements = value.map(v => formatSchemeValue(v, options)).join(" ");
    return `#(${elements})`;
  }
  if (value && typeof value === "object" && (value as any).__call__) {
    return "#<procedure>";
  }
  return String(value);
}
