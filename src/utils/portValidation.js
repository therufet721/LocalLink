/**
 * Validates a port string for the custom port input.
 * @param {string} portString - Raw input from the user
 * @param {number[]} existingPorts - Ports already added
 * @returns {string|null} Error message or null if valid
 */
export function validatePort(portString, existingPorts = []) {
  const num = parseInt(portString, 10);
  if (isNaN(num) || num < 1 || num > 65535) {
    return "Enter a valid port (1–65535).";
  }
  if (existingPorts.includes(num)) {
    return "Port already added.";
  }
  return null;
}
