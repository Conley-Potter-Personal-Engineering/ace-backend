export interface SortSpec<T> {
  key: keyof T;
  ascending: boolean;
}

/**
 * Resolves a sort spec from an allowed map, falling back to a default key.
 */
export const resolveSort = <T>(
  value: string | undefined,
  mapping: Record<string, SortSpec<T>>,
  fallback: string,
): SortSpec<T> => mapping[value ?? ""] ?? mapping[fallback];

/**
 * Sorts a list of items using a provided sort specification.
 */
export const sortRecords = <T>(items: T[], spec: SortSpec<T>): T[] => {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aValue = a[spec.key];
    const bValue = b[spec.key];

    if (aValue === bValue) {
      return 0;
    }

    if (aValue === null || aValue === undefined) {
      return spec.ascending ? -1 : 1;
    }

    if (bValue === null || bValue === undefined) {
      return spec.ascending ? 1 : -1;
    }

    if (aValue > bValue) {
      return spec.ascending ? 1 : -1;
    }

    return spec.ascending ? -1 : 1;
  });
  return sorted;
};
