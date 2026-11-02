let cachedIp = null;

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

const isValidIp = (ip) => {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  return IPV4_REGEX.test(trimmed) || (trimmed.includes(":") && IPV6_REGEX.test(trimmed));
};

/**
 * Proactively detects the user device's genuine public IP address.
 * Uses fast, reliable public endpoints with a strict timeout so UI never hangs.
 */
export const detectClientIp = async () => {
  if (cachedIp) return cachedIp;

  const endpoints = [
    { url: "https://api64.ipify.org?format=json", isJson: true },
    { url: "https://api.ipify.org?format=json", isJson: true },
    { url: "https://icanhazip.com", isJson: false },
    { url: "https://ipapi.co/json/", isJson: true },
  ];

  for (const { url, isJson } of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: isJson ? "application/json" : "text/plain" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        let ip = "";
        if (isJson) {
          const data = await res.json();
          ip = data?.ip || "";
        } else {
          ip = (await res.text()).trim();
        }

        if (isValidIp(ip)) {
          cachedIp = ip.trim();
          return cachedIp;
        }
      }
    } catch {
      // Continue to next endpoint fallback
    }
  }

  return "";
};
