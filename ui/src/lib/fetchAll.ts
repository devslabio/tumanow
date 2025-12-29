/**
 * Utility function to fetch all records from a paginated API endpoint
 * Handles pagination automatically by fetching in batches
 */
export async function fetchAll<T>(
  fetchFn: (params: any) => Promise<{ data: T[]; meta?: { total?: number } }>,
  baseParams: any = {},
  batchSize: number = 100
): Promise<T[]> {
  const allData: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = {
      ...baseParams,
      page,
      limit: batchSize,
    };

    const response = await fetchFn(params);
    const batch = response.data || [];

    if (batch.length === 0) {
      hasMore = false;
    } else {
      allData.push(...batch);
      
      // Check if we've fetched all records
      const total = response.meta?.total;
      if (total !== undefined && allData.length >= total) {
        hasMore = false;
      } else if (batch.length < batchSize) {
        // Last batch was smaller than batchSize, so we're done
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return allData;
}

