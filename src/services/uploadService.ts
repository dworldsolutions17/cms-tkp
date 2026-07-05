import api from './api';

export type UploadFolder = 'products' | 'categories' | 'profiles' | 'reviews';

const resolveUploadUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

export const uploadService = {
  single: async (file: File, folder: UploadFolder, oldUrl?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (oldUrl) {
      formData.append('oldUrl', oldUrl);
    }

    const response = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data as { url: string };
  },

  multiple: async (files: File[], folder: UploadFolder) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    const response = await api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data as { urls: string[] };
  },

  resolveUrl: resolveUploadUrl,
};
