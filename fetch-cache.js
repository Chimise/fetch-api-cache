import Cache from "node-cache";

const generateUniformUrl = (url) => {
  url = url instanceof URL ? url : new URL(url);
  url.searchParams.sort();
  url.search = "?" + url.searchParams.toString();
  return url.toString();
};

const generateUniformHeader = (headers) => {
  if (!headers) {
    return "";
  }

  if (typeof headers !== "object") {
    return "";
  }

  if (Array.isArray(headers)) {
    return "";
  }

  if (Object.keys(headers).length === 0) {
    return "";
  }

  let headerEntries;
  if ("entries" in headers && typeof headers.entries === "function") {
    headerEntries = Array.from(headers.entries());
  } else {
    headerEntries = Object.entries(headers);
  }

  headerEntries.sort(([key1], [key2]) =>
    key1 > key2 ? 1 : key1 < key2 ? -1 : 0
  );
  return JSON.stringify(Object.fromEntries(headerEntries));
};

const generateCacheKey = (url, options) => {
  return [generateUniformUrl(url), generateUniformHeader(options.headers)].join(
    ":"
  );
};

export default function cacheFetch(fetchApi, globalOptions = {}) {
  const stdTTL = globalOptions.expiresIn;
  const cache = new Cache({stdTTL, useClones: false});

  return function (...args) {
    const options = args[1] ?? {};
    const url = args[0];
    const expiresIn = options.expiresIn;
    const method = options.method || "GET";

    if (!url) {
      throw new Error("No URL provided");
    }

    if (options.expiresIn) {
      delete options.expiresIn;
    }

    const cacheKey = generateCacheKey(url, options);
    console.log(cacheKey);
    const hasKey = cache.has(cacheKey);

    // Only cache request with method GET or HEAD
    if (method === "GET" || method === "HEAD") {
      if (hasKey) {
        return cache.get(cacheKey);
      }

      const promise = fetchApi(...args);
      cache.set(cacheKey, promise);
      promise
        .then(() => {
          if (expiresIn && typeof expiresIn === "number") {
            cache.ttl(cacheKey, expiresIn);
          }
        })
        .catch(() => {
          cache.del(cacheKey);
        });
      return promise;
    }

    // If a request with similar cacheKey is either POST, PUT, DELETE or PATCH request, invalidate the request in the cache
    if (
      (method === "POST" ||
        method === "PUT" ||
        method === "DELETE" ||
        method === "PATCH") &&
      hasKey
    ) {
      cache.del(cacheKey);
    }

    return fetchApi(...args);
  };
}
