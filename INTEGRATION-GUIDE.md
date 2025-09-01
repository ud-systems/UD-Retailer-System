# Integration Guide - Production Services

## Overview

This guide shows how to integrate and use all the new production-ready services in your application components and services.

## 1. Concurrency Service Integration

### Basic Usage

```typescript
import { concurrencyService } from '@/services/concurrencyService';

// Optimistic update with conflict resolution
const updateUser = async (userId: string, updates: any) => {
  const result = await concurrencyService.optimisticUpdate(
    'profiles',
    userId,
    updates,
    'version'
  );

  if (!result.resolved) {
    throw new Error(result.error);
  }

  return result.data;
};
```

### Transaction Support

```typescript
// Complex operation with rollback
const createOrderWithInventory = async (orderData: any) => {
  return concurrencyService.transaction(
    [
      () => createOrder(orderData),
      () => updateInventory(orderData.productId, orderData.quantity)
    ],
    [
      () => deleteOrder(orderData.id),
      () => restoreInventory(orderData.productId, orderData.quantity)
    ]
  );
};
```

### Lock Management

```typescript
// Exclusive access to a record
const editProduct = async (productId: string) => {
  const lockAcquired = await concurrencyService.acquireLock('products', productId);
  
  if (!lockAcquired) {
    throw new Error('Product is being edited by another user');
  }

  try {
    // Perform edit operations
    await updateProduct(productId, changes);
  } finally {
    await concurrencyService.releaseLock('products', productId);
  }
};
```

## 2. Caching Service Integration

### Basic Caching

```typescript
import { cacheService, cacheKeys } from '@/services/cacheService';

// Cache data with TTL
const getRetailers = async () => {
  const cacheKey = cacheKeys.retailers();
  const cached = cacheService.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  const data = await fetchRetailersFromAPI();
  cacheService.set(cacheKey, data, 5 * 60 * 1000); // 5 minutes
  return data;
};
```

### Cache Invalidation

```typescript
// Invalidate cache when data changes
const updateRetailer = async (retailerId: string, updates: any) => {
  await updateRetailerInAPI(retailerId, updates);
  
  // Invalidate specific retailer and all retailers cache
  cacheService.invalidateEntityById('retailers', retailerId);
  cacheService.invalidateEntity('retailers');
};
```

### Cache Statistics

```typescript
// Monitor cache performance
const cacheStats = cacheService.getStats();
console.log(`Cache hit rate: ${cacheStats.hitRate * 100}%`);
console.log(`Cache size: ${cacheStats.size}/${cacheStats.maxSize}`);
```

## 3. Pagination Service Integration

### Server-Side Pagination

```typescript
import { paginationService, PaginationParams } from '@/services/paginationService';

// In your data service
const getPaginatedOrders = async (params: PaginationParams) => {
  const baseQuery = supabase
    .from('orders')
    .select('*');

  return paginationService.executePaginatedQuery(baseQuery, params);
};
```

### UI Integration

```typescript
// In your React component
const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const loadOrders = async (page: number) => {
    const result = await getPaginatedOrders({
      page,
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    setOrders(result.data);
    setPagination(result.pagination);
  };

  return (
    <div>
      {/* Orders table */}
      <OrdersTable orders={orders} />
      
      {/* Pagination controls */}
      <PaginationControls
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={loadOrders}
      />
    </div>
  );
};
```

## 4. Security Service Integration

### Input Sanitization

```typescript
import { securityService } from '@/services/securityService';

// Sanitize user input
const handleFormSubmit = (formData: any) => {
  const sanitizedData = securityService.sanitizeObject(formData);
  
  // Now safe to use in database
  await updateUser(userId, sanitizedData);
};
```

### Password Validation

```typescript
// Validate password strength
const validatePassword = (password: string) => {
  const result = securityService.validatePassword(password);
  
  if (!result.isValid) {
    setErrors(result.errors);
    return false;
  }
  
  return true;
};
```

### CSRF Protection

```typescript
// Generate and validate CSRF tokens
const handleFormSubmit = async (formData: any) => {
  const csrfToken = securityService.generateCSRFToken();
  
  // Add token to form data
  const dataWithToken = {
    ...formData,
    _csrf: csrfToken
  };
  
  // Validate token on server side
  if (!securityService.validateCSRFToken(csrfToken, storedToken)) {
    throw new Error('Invalid CSRF token');
  }
};
```

## 5. Monitoring Service Integration

### Performance Tracking

```typescript
import { monitoringService } from '@/services/monitoringService';

// Track API calls
const apiCall = async (endpoint: string, data: any) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const duration = performance.now() - startTime;
    monitoringService.trackAPICall(endpoint, 'POST', duration, response.status);
    
    return response.json();
  } catch (error) {
    const duration = performance.now() - startTime;
    monitoringService.trackAPICall(endpoint, 'POST', duration, 500);
    throw error;
  }
};
```

### Error Logging

```typescript
// Automatic error logging
const riskyOperation = async () => {
  try {
    return await monitoringService.measureExecutionTime(
      'risky_operation',
      async () => {
        // Your operation here
        return await someAPI();
      },
      { userId: currentUser.id }
    );
  } catch (error) {
    monitoringService.logError(
      'Risky operation failed',
      error,
      { userId: currentUser.id },
      currentUser.id
    );
    throw error;
  }
};
```

### User Action Tracking

```typescript
// Track user actions
const handleUserAction = (action: string, metadata?: any) => {
  monitoringService.trackUserAction(
    action,
    window.location.pathname,
    metadata,
    currentUser?.id
  );
};

// Usage in components
const handleEditProduct = (productId: string) => {
  handleUserAction('edit_product', { productId });
  // ... edit logic
};
```

## 6. Rate Limiting Integration

### Login Rate Limiting

```typescript
import { rateLimitService } from '@/services/rateLimitService';

// Already integrated in auth service
const login = async (credentials: LoginCredentials) => {
  const clientKey = rateLimitService.getClientKey();
  const rateLimit = rateLimitService.checkRateLimit(clientKey, 'login');
  
  if (!rateLimit.allowed) {
    throw new Error(`Too many login attempts. Please try again after ${new Date(rateLimit.resetTime).toLocaleTimeString()}.`);
  }
  
  // Proceed with login
  return await performLogin(credentials);
};
```

### API Rate Limiting

```typescript
// Protect sensitive operations
const sensitiveOperation = async () => {
  const clientKey = rateLimitService.getClientKey();
  const rateLimit = rateLimitService.checkRateLimit(clientKey, 'api');
  
  if (!rateLimit.allowed) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Proceed with operation
  return await performSensitiveOperation();
};
```

## 7. Complete Service Integration Example

### Enhanced Data Service

```typescript
import { cacheService, cacheKeys } from '@/services/cacheService';
import { paginationService } from '@/services/paginationService';
import { monitoringService } from '@/services/monitoringService';
import { securityService } from '@/services/securityService';
import { concurrencyService } from '@/services/concurrencyService';

class EnhancedDataService {
  async getRetailers(params?: PaginationParams) {
    return monitoringService.measureExecutionTime(
      'get_retailers',
      async () => {
        // Check cache first
        const cacheKey = cacheKeys.retailers();
        const cached = cacheService.get(cacheKey);
        
        if (cached && !params) {
          return cached;
        }

        // Fetch from database with pagination
        const baseQuery = supabase.from('retailers').select('*');
        const result = params 
          ? await paginationService.executePaginatedQuery(baseQuery, params)
          : { data: await baseQuery, pagination: null };

        // Cache the result
        if (!params) {
          cacheService.set(cacheKey, result.data, 5 * 60 * 1000);
        }

        return result;
      },
      { hasPagination: !!params }
    );
  }

  async updateRetailer(id: string, updates: any) {
    return monitoringService.measureExecutionTime(
      'update_retailer',
      async () => {
        // Sanitize input
        const sanitizedUpdates = securityService.sanitizeObject(updates);
        
        // Use optimistic locking
        const result = await concurrencyService.optimisticUpdate(
          'retailers',
          id,
          sanitizedUpdates,
          'version'
        );

        if (!result.resolved) {
          throw new Error(result.error);
        }

        // Invalidate cache
        cacheService.invalidateEntityById('retailers', id);
        cacheService.invalidateEntity('retailers');

        return result.data;
      },
      { retailerId: id }
    );
  }
}
```

### Enhanced Component

```typescript
import { useState, useEffect } from 'react';
import { monitoringService } from '@/services/monitoringService';
import { securityService } from '@/services/securityService';

const RetailersPage = () => {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Track page load
    monitoringService.trackPageLoad('/retailers');
    loadRetailers();
  }, []);

  const loadRetailers = async () => {
    setLoading(true);
    try {
      const result = await enhancedDataService.getRetailers({
        page: 1,
        limit: 20
      });
      setRetailers(result.data);
    } catch (error) {
      monitoringService.logError('Failed to load retailers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRetailer = async (retailerId: string, updates: any) => {
    try {
      // Track user action
      monitoringService.trackUserAction('edit_retailer', { retailerId });
      
      // Validate input
      if (!securityService.validateEmail(updates.email)) {
        throw new Error('Invalid email format');
      }

      await enhancedDataService.updateRetailer(retailerId, updates);
      
      // Refresh data
      await loadRetailers();
    } catch (error) {
      monitoringService.logError('Failed to update retailer', error);
      throw error;
    }
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
};
```

## 8. Environment Configuration

### Development Environment

```env
# .env.development
VITE_ENABLE_DEBUG_MODE=true
VITE_PERFORMANCE_MONITORING=false
VITE_CACHE_TTL=60000
VITE_RATE_LIMIT_LOGIN_ATTEMPTS=10
```

### Production Environment

```env
# .env.production
VITE_ENABLE_DEBUG_MODE=false
VITE_PERFORMANCE_MONITORING=true
VITE_CACHE_TTL=300000
VITE_RATE_LIMIT_LOGIN_ATTEMPTS=5
VITE_ERROR_LOGGING_ENABLED=true
```

## 9. Testing the Integration

### Test Script

```typescript
// test-integration.ts
import { cacheService } from '@/services/cacheService';
import { monitoringService } from '@/services/monitoringService';
import { securityService } from '@/services/securityService';

// Test caching
cacheService.set('test', { data: 'test' }, 60000);
console.log('Cache test:', cacheService.get('test'));

// Test monitoring
monitoringService.logInfo('Integration test completed');
console.log('Monitoring stats:', monitoringService.getStats());

// Test security
const sanitized = securityService.sanitizeInput('<script>alert("xss")</script>');
console.log('Sanitization test:', sanitized);

// Test password validation
const passwordResult = securityService.validatePassword('weak');
console.log('Password validation:', passwordResult);
```

## 10. Best Practices

### Performance

1. **Use caching strategically**: Cache frequently accessed data
2. **Implement pagination**: For large datasets
3. **Monitor performance**: Track key metrics
4. **Optimize queries**: Use proper indexes

### Security

1. **Sanitize all inputs**: Prevent XSS attacks
2. **Validate data**: Check format and content
3. **Use rate limiting**: Prevent abuse
4. **Log security events**: Monitor for threats

### Reliability

1. **Handle conflicts**: Use optimistic locking
2. **Implement retries**: For transient failures
3. **Monitor errors**: Track and resolve issues
4. **Test thoroughly**: Before production deployment

---

This integration guide provides a comprehensive approach to using all the production-ready services in your application. Follow these patterns to ensure your application is secure, performant, and reliable. 