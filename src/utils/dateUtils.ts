export const formatDate = (value: string | Date | null | undefined, fallback = 'N/A'): string => {
  if (!value) return fallback;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
};

export const formatDateTime = (value: string | Date | null | undefined, fallback = 'N/A'): string => {
  if (!value) return fallback;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
};

export const toDateInputValue = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};
