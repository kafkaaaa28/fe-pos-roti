import api from "./api";

export type UploadImageResponse = {
  url: string;
  publicId: string;
  assetId: string;
  originalFilename: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  resourceType: string;
  createdAt: string;
};

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateProductImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "File produk harus berupa gambar.";
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return "Ukuran gambar maksimal 5MB.";
  }

  return "";
}

export async function uploadProductImage(file: File): Promise<UploadImageResponse> {
  const validationError = validateProductImageFile(file);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadImageResponse>("/uploads/images", formData);
  return data;
}
