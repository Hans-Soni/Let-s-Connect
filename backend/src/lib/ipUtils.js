import net from "net";

/**
 * Normalizes an IP address string by trimming, stripping port if any,
 * and stripping IPv4-mapped IPv6 prefix ("::ffff:").
 */
export const cleanIp = (ip) => {
  if (!ip || typeof ip !== "string") return "";
  let trimmed = ip.trim();

  // Strip port if IPv4 is formatted as ip:port (e.g., "203.0.113.195:443")
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(trimmed)) {
    trimmed = trimmed.split(":")[0];
  }

  // Strip IPv4-mapped IPv6 prefix
  if (trimmed.startsWith("::ffff:")) {
    trimmed = trimmed.substring(7);
  }

  // Normalize IPv6 localhost
  if (trimmed === "::1") {
    return "127.0.0.1";
  }

  return trimmed;
};

/**
 * Checks if an IP is a local loopback, RFC1918 private, link-local, or unspecified address.
 */
export const isLocalOrPrivateIp = (rawIp) => {
  if (!rawIp) return true;
  const ip = cleanIp(rawIp);

  if (ip === "127.0.0.1" || ip === "localhost" || ip === "::1" || ip === "0.0.0.0") {
    return true;
  }

  // RFC 1918 Private IPv4 ranges
  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
  // 169.254.0.0/16 (link-local)
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;

  // IPv6 Unique Local Address (ULA) fc00::/7
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  // IPv6 Link-Local fe80::/10
  if (/^fe80:/i.test(ip)) return true;

  return false;
};

/**
 * Extracts the accurate client device IP address from request headers, socket, or verified client payload.
 *
 * Priority order:
 * 1. Cloudflare untampered header: CF-Connecting-IP
 * 2. True-Client-IP (Cloudflare Enterprise / Akamai)
 * 3. X-Real-IP (Nginx / standard reverse proxies)
 * 4. X-Forwarded-For (first public IP in the chain)
 * 5. Other reverse proxy headers (Fastly, Cluster, etc.)
 * 6. Direct Express req.ip or socket remote address (if public)
 * 7. Client-provided verified public IP (used when backend is running on localhost/dev or behind internal NAT)
 * 8. First valid IP available (even if private/local)
 * 9. Fallback to "127.0.0.1"
 */
export const extractClientIp = (req) => {
  if (!req) return "127.0.0.1";

  const candidates = [];

  // 1. Cloudflare header
  if (req.headers?.["cf-connecting-ip"]) {
    candidates.push(req.headers["cf-connecting-ip"]);
  }

  // 2. True-Client-IP
  if (req.headers?.["true-client-ip"]) {
    candidates.push(req.headers["true-client-ip"]);
  }

  // 3. X-Real-IP
  if (req.headers?.["x-real-ip"]) {
    candidates.push(req.headers["x-real-ip"]);
  }

  // 4. X-Forwarded-For (can be multiple comma-separated IPs)
  const forwarded = req.headers?.["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    const list = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    candidates.push(...list);
  }

  // 5. Other proxy headers
  const otherHeaders = [
    req.headers?.["x-client-ip"],
    req.headers?.["fastly-client-ip"],
    req.headers?.["x-cluster-client-ip"],
  ];
  for (const h of otherHeaders) {
    if (h && typeof h === "string") candidates.push(h);
  }

  // 6. Direct socket / req.ip
  if (req.ip) candidates.push(req.ip);
  if (req.socket?.remoteAddress) candidates.push(req.socket.remoteAddress);

  // Priority 1: Check for first valid PUBLIC IP among server-received headers/socket
  for (const raw of candidates) {
    const cleaned = cleanIp(raw);
    if (net.isIP(cleaned) && !isLocalOrPrivateIp(cleaned)) {
      return cleaned;
    }
  }

  // Priority 2: If server headers only see private/loopback network (e.g. dev localhost, LAN, or proxy without forwarded IP),
  // check if client device provided a verified public IP
  const clientProvided = req.body?.clientIp;
  if (clientProvided && typeof clientProvided === "string") {
    const cleaned = cleanIp(clientProvided);
    if (net.isIP(cleaned) && !isLocalOrPrivateIp(cleaned)) {
      return cleaned;
    }
  }

  // Priority 3: Fall back to first valid IP even if private/local
  for (const raw of candidates) {
    const cleaned = cleanIp(raw);
    if (net.isIP(cleaned)) {
      return cleaned;
    }
  }

  return "127.0.0.1";
};
