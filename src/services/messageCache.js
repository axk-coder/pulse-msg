class MessageCache {
  constructor() {
    this.maxCachedPerStream = 25;
    this.memoryCache = new Map();
  }

  setCookie(name, value, days = 7) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      const safeVal = encodeURIComponent(value);
      document.cookie = `${name}=${safeVal};${expires};path=/;SameSite=Lax`;
    } catch {}
  }

  getCookie(name) {
    try {
      const cname = name + "=";
      const decodedCookie = decodeURIComponent(document.cookie || "");
      const ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(cname) === 0) {
          return c.substring(cname.length, c.length);
        }
      }
    } catch {}
    return null;
  }

  getCacheKey(streamKey) {
    return `pulse_mc_${String(streamKey || "global").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32)}`;
  }

  getCachedMessages(streamKey) {
    if (!streamKey) return [];
    if (this.memoryCache.has(streamKey)) {
      return this.memoryCache.get(streamKey);
    }

    const cookieKey = this.getCacheKey(streamKey);
    const cookieVal = this.getCookie(cookieKey);
    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        if (Array.isArray(parsed)) {
          this.memoryCache.set(streamKey, parsed);
          return parsed;
        }
      } catch {}
    }

    try {
      const localVal = localStorage.getItem(cookieKey);
      if (localVal) {
        const parsedLocal = JSON.parse(localVal);
        if (Array.isArray(parsedLocal)) {
          this.memoryCache.set(streamKey, parsedLocal);
          return parsedLocal;
        }
      }
    } catch {}

    return [];
  }

  setCachedMessages(streamKey, messages) {
    if (!streamKey || !Array.isArray(messages)) return;
    const slice = messages.slice(-this.maxCachedPerStream).map(m => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.timestamp,
      isEdited: !!m.isEdited,
      replyTo: m.replyTo ? {
        id: m.replyTo.id,
        senderId: m.replyTo.senderId,
        text: m.replyTo.text
      } : null
    }));

    this.memoryCache.set(streamKey, slice);

    const serialized = JSON.stringify(slice);
    const cookieKey = this.getCacheKey(streamKey);

    if (serialized.length < 3500) {
      this.setCookie(cookieKey, serialized);
    }

    try {
      localStorage.setItem(cookieKey, serialized);
    } catch {}
  }
}

export const messageCache = new MessageCache();
