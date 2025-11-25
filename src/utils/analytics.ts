/**
 * Heap Analytics Integration
 * 
 * Basic setup - Heap automatically tracks:
 * - User sessions and page views
 * - Geographic location (country/region)
 * - Device type and browser
 * - Screen size
 */

/**
 * Initialize Heap with app ID
 * Call this once when the app loads
 */
export const initHeap = (appId?: string): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const heapAppId = appId || import.meta.env.VITE_HEAP_APP_ID;
  
  if (!heapAppId || heapAppId === 'undefined') {
    // Silently fail if no app ID - analytics is optional
    return;
  }

  // Initialize Heap loader function
  if (!(window as any).heap) {
    (window as any).heap = [];
    (window as any).heap.load = function(e: string, t?: Record<string, unknown>) {
      (window as any).heap.appid = e;
      (window as any).heap.config = t || {};
      const r = document.createElement("script");
      r.type = "text/javascript";
      r.async = true;
      r.src = "https://cdn.heapanalytics.com/js/heap-" + e + ".js";
      const a = document.getElementsByTagName("script")[0];
      a.parentNode?.insertBefore(r, a);
      
      // Initialize Heap methods
      const n = function(e: string) {
        return function() {
          (window as any).heap.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      const p = ["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"];
      for (let o = 0; o < p.length; o++) {
        (window as any).heap[p[o]] = n(p[o]);
      }
    };
  }

  // Load Heap with app ID
  try {
    (window as any).heap.load(heapAppId);
  } catch (error) {
    console.error('Error initializing Heap:', error);
  }
};

