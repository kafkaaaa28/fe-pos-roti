import api from './api';

export type MidtransConfig = {
  clientKey: string;
  isProduction: boolean;
  snapJsUrl: string;
};

export type MidtransPayCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: MidtransPayCallbacks) => void;
    };
  }
}

let configPromise: Promise<MidtransConfig> | null = null;
let scriptPromise: Promise<void> | null = null;
let loadedScriptUrl = '';

export async function getMidtransConfig() {
  if (!configPromise) {
    configPromise = api.get<MidtransConfig>('/payments/midtrans/config').then((response) => response.data);
  }

  return configPromise;
}

export async function loadMidtransSnap() {
  const config = await getMidtransConfig();

  const snapScriptUrl = config.snapJsUrl;

  if (!snapScriptUrl) {
    throw new Error('URL script Midtrans tidak ditemukan dari config backend.');
  }

  console.log('Midtrans config:', config);

  if (window.snap && loadedScriptUrl === snapScriptUrl) {
    return config;
  }

  if (!scriptPromise || loadedScriptUrl !== snapScriptUrl) {
    loadedScriptUrl = snapScriptUrl;

    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[data-midtrans-snap="true"][src="${snapScriptUrl}"]`);

      if (existing) {
        if (window.snap) {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Gagal memuat script Midtrans Snap.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = snapScriptUrl;
      script.async = true;
      script.dataset.midtransSnap = 'true';
      script.setAttribute('data-client-key', config.clientKey);

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat script Midtrans Snap.'));

      document.body.appendChild(script);
    });
  }

  await scriptPromise;

  if (!window.snap) {
    throw new Error('Midtrans Snap belum tersedia setelah script dimuat.');
  }

  return config;
}

export async function payWithMidtransSnap(token: string, callbacks: MidtransPayCallbacks) {
  await loadMidtransSnap();
  window.snap?.pay(token, callbacks);
}
