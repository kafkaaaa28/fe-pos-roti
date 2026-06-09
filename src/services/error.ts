export function getApiErrorMessage(error: unknown, fallback = "Terjadi kesalahan saat memproses request.") {
  if (typeof error === "object" && error !== null) {
    const maybeResponse = error as {
      response?: {
        data?: {
          message?: string | string[];
          error?: string;
        };
      };
      message?: string;
    };

    const message = maybeResponse.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
    if (maybeResponse.response?.data?.error) return maybeResponse.response.data.error;
    if (maybeResponse.message) return maybeResponse.message;
  }

  return fallback;
}
