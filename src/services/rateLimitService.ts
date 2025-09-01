class RateLimitService {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  
  // Rate limits
  private readonly LOGIN_LIMIT = 5; // 5 login attempts per 15 minutes
  private readonly API_LIMIT = 100; // 100 API calls per minute
  private readonly LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly API_WINDOW = 60 * 1000; // 1 minute

  checkRateLimit(key: string, type: 'login' | 'api'): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const limit = type === 'login' ? this.LOGIN_LIMIT : this.API_LIMIT;
    const window = type === 'login' ? this.LOGIN_WINDOW : this.API_WINDOW;
    
    const record = this.requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + window
      });
      return { allowed: true, remaining: limit - 1, resetTime: now + window };
    }
    
    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }
    
    // Increment count
    record.count++;
    this.requestCounts.set(key, record);
    
    return { 
      allowed: true, 
      remaining: limit - record.count, 
      resetTime: record.resetTime 
    };
  }

  getClientKey(): string {
    // Use IP address or user ID for rate limiting
    // For now, using a simple approach - in production, get real IP
    return 'client-' + Math.random().toString(36).substr(2, 9);
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();

// Clean up expired records every 5 minutes
setInterval(() => {
  rateLimitService.clearExpired();
}, 5 * 60 * 1000); 