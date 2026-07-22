export const slugify = (value: string): string => {
   return value
      .trim()
      .toLowerCase()
      .normalize("NFD") // Remove accents (e.g. é → e)
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with one
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
};
