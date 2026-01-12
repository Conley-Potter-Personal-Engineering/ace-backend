export interface PaginationResult {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Builds a standard pagination payload.
 */
export const buildPagination = (
  total: number,
  limit: number,
  offset: number,
): PaginationResult => ({
  total,
  limit,
  offset,
  has_more: offset + limit < total,
});

/**
 * Applies offset/limit slicing to an array.
 */
export const paginate = <T>(
  items: T[],
  limit: number,
  offset: number,
): T[] => items.slice(offset, offset + limit);
