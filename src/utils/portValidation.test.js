import { describe, it, expect } from "vitest";
import { validatePort } from "./portValidation.js";

describe("validatePort", () => {
  it("returns null for valid port", () => {
    expect(validatePort("3000", [])).toBe(null);
    expect(validatePort("5173", [3000])).toBe(null);
    expect(validatePort("1", [])).toBe(null);
    expect(validatePort("65535", [])).toBe(null);
  });

  it("returns error for out-of-range ports", () => {
    expect(validatePort("0", [])).toBe("Enter a valid port (1–65535).");
    expect(validatePort("65536", [])).toBe("Enter a valid port (1–65535).");
    expect(validatePort("-1", [])).toBe("Enter a valid port (1–65535).");
  });

  it("returns error for invalid input", () => {
    expect(validatePort("", [])).toBe("Enter a valid port (1–65535).");
    expect(validatePort("abc", [])).toBe("Enter a valid port (1–65535).");
  });

  it("returns error for duplicate ports", () => {
    expect(validatePort("3000", [3000])).toBe("Port already added.");
    expect(validatePort("5173", [3000, 5173, 8080])).toBe(
      "Port already added."
    );
  });

  it("returns null when port is valid and not in existing list", () => {
    expect(validatePort("8080", [3000, 5173])).toBe(null);
  });
});
