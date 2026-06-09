const loadedImageCache = new Set<string>();

export function preloadImages(urls: string[]) {
  if (typeof window === "undefined") return;

  urls.forEach((url) => {
    if (!url || loadedImageCache.has(url)) return;

    const img = new Image();
    img.decoding = "async";
    img.src = url;
    loadedImageCache.add(url);
  });
}
