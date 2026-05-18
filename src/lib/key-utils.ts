export const sanitizeKey = (key: string | undefined): string | undefined =>
    key?.replace(/['"]/g, "").replace(/\\n/g, "\n");
