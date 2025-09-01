export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage?: number;
    prevPage?: number;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class PaginationService {
  /**
   * Calculate pagination metadata
   */
  calculatePagination(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    
    return {
      total,
      page: currentPage,
      limit,
      totalPages
    };
  }

  /**
   * Calculate offset from page and limit
   */
  calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Build pagination result
   */
  buildPaginationResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginationResult<T> {
    const meta = this.calculatePagination(total, page, limit);
    
    return {
      data,
      pagination: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPages,
        hasNext: meta.page < meta.totalPages,
        hasPrev: meta.page > 1,
        nextPage: meta.page < meta.totalPages ? meta.page + 1 : undefined,
        prevPage: meta.page > 1 ? meta.page - 1 : undefined
      }
    };
  }

  /**
   * Generate page numbers for pagination UI
   */
  generatePageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
    const pages: number[] = [];
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      // Adjust start if end is at the limit
      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(params: PaginationParams): PaginationParams {
    const { page, limit, sortBy, sortOrder } = params;
    
    return {
      page: Math.max(1, page || 1),
      limit: Math.min(100, Math.max(1, limit || 10)), // Max 100 items per page
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
    };
  }

  /**
   * Build Supabase query with pagination
   */
  buildSupabaseQuery(query: any, params: PaginationParams) {
    const { page, limit, sortBy, sortOrder } = this.validatePaginationParams(params);
    const offset = this.calculateOffset(page, limit);
    
    return query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
  }

  /**
   * Get total count for pagination
   */
  async getTotalCount(query: any): Promise<number> {
    const { count, error } = await query.select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting total count:', error);
      return 0;
    }
    
    return count || 0;
  }

  /**
   * Create paginated query with count
   */
  async executePaginatedQuery<T>(
    baseQuery: any,
    params: PaginationParams
  ): Promise<PaginationResult<T>> {
    const validatedParams = this.validatePaginationParams(params);
    
    // Get total count
    const total = await this.getTotalCount(baseQuery);
    
    if (total === 0) {
      return this.buildPaginationResult([], 0, validatedParams.page, validatedParams.limit);
    }
    
    // Build paginated query
    const paginatedQuery = this.buildSupabaseQuery(baseQuery, validatedParams);
    
    // Execute query
    const { data, error } = await paginatedQuery;
    
    if (error) {
      console.error('Error executing paginated query:', error);
      throw error;
    }
    
    return this.buildPaginationResult(data || [], total, validatedParams.page, validatedParams.limit);
  }
}

export const paginationService = new PaginationService(); 