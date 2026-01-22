/**
 * Mock Supabase client factory for testing
 * Provides chainable query builder that mimics Supabase's API
 */

import type { MockUser, MockFollow, WallSubmission, Scenario } from './mockData';
import type { Profile } from '../hooks/useProfile';

// ============================================================================
// TYPES
// ============================================================================

export interface MockSupabaseConfig {
  user: MockUser | null;
  profile: Profile | null;
  follows: MockFollow[];
  submissions: WallSubmission[];
  profiles: Profile[];
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

type FilterOperator = 'eq' | 'neq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in';

interface Filter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

// ============================================================================
// MOCK QUERY BUILDER
// ============================================================================

class MockQueryBuilder<T> {
  private data: T[];
  private filters: Filter[] = [];
  private orderColumn: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(_table: string, data: T[]) {
    this.data = data;
  }

  select(): this {
    // Column selection not implemented in mock - returns all columns
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): Promise<QueryResult<T>> {
    this.isSingle = true;
    return this.execute() as Promise<QueryResult<T>>;
  }

  maybeSingle(): Promise<QueryResult<T | null>> {
    this.isMaybeSingle = true;
    return this.execute() as Promise<QueryResult<T | null>>;
  }

  then<TResult>(
    onfulfilled?: (value: QueryResult<T[]>) => TResult
  ): Promise<TResult> {
    return this.execute().then(onfulfilled as (value: QueryResult<T | T[] | null>) => TResult);
  }

  private applyFilter(item: T, filter: Filter): boolean {
    const value = (item as Record<string, unknown>)[filter.column];

    switch (filter.operator) {
      case 'eq':
        return value === filter.value;
      case 'neq':
        return value !== filter.value;
      case 'lt':
        return (value as string | number) < (filter.value as string | number);
      case 'gt':
        return (value as string | number) > (filter.value as string | number);
      case 'lte':
        return (value as string | number) <= (filter.value as string | number);
      case 'gte':
        return (value as string | number) >= (filter.value as string | number);
      case 'in':
        return (filter.value as unknown[]).includes(value);
      default:
        return true;
    }
  }

  private async execute(): Promise<QueryResult<T | T[] | null>> {
    // Apply filters
    let result = this.data.filter(item =>
      this.filters.every(filter => this.applyFilter(item, filter))
    );

    // Apply ordering
    if (this.orderColumn) {
      const col = this.orderColumn;
      const asc = this.orderAscending;
      result = [...result].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[col] as string | number;
        const bVal = (b as Record<string, unknown>)[col] as string | number;
        if (aVal < bVal) return asc ? -1 : 1;
        if (aVal > bVal) return asc ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    // Handle single/maybeSingle
    if (this.isSingle) {
      if (result.length === 0) {
        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      }
      if (result.length > 1) {
        return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' } };
      }
      return { data: result[0], error: null };
    }

    if (this.isMaybeSingle) {
      if (result.length === 0) {
        return { data: null, error: null };
      }
      if (result.length > 1) {
        return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' } };
      }
      return { data: result[0], error: null };
    }

    return { data: result, error: null };
  }
}

// ============================================================================
// MOCK AUTH
// ============================================================================

interface MockAuth {
  user: MockUser | null;
  listeners: Set<(event: string, session: { user: MockUser | null } | null) => void>;
}

function createMockAuth(initialUser: MockUser | null): {
  getSession: () => Promise<{ data: { session: { user: MockUser } | null } }>;
  onAuthStateChange: (
    callback: (event: string, session: { user: MockUser | null } | null) => void
  ) => { data: { subscription: { unsubscribe: () => void } } };
  signInWithOAuth: () => Promise<{ error: null }>;
  signOut: () => Promise<{ error: null }>;
  _setUser: (user: MockUser | null) => void;
} {
  const state: MockAuth = {
    user: initialUser,
    listeners: new Set(),
  };

  return {
    getSession: async () => ({
      data: {
        session: state.user ? { user: state.user } : null,
      },
    }),

    onAuthStateChange: (callback) => {
      state.listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              state.listeners.delete(callback);
            },
          },
        },
      };
    },

    signInWithOAuth: async () => ({ error: null }),
    signOut: async () => {
      state.user = null;
      state.listeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    },

    // Test helper to change user
    _setUser: (user: MockUser | null) => {
      state.user = user;
      const event = user ? 'SIGNED_IN' : 'SIGNED_OUT';
      state.listeners.forEach(cb => cb(event, user ? { user } : null));
    },
  };
}

// ============================================================================
// MOCK SUPABASE CLIENT FACTORY
// ============================================================================

export interface MockSupabaseClient {
  auth: ReturnType<typeof createMockAuth>;
  from: <T>(table: string) => MockQueryBuilder<T>;
  _config: MockSupabaseConfig;
  _setUser: (user: MockUser | null) => void;
}

export function createMockSupabaseClient(config: MockSupabaseConfig): MockSupabaseClient {
  const auth = createMockAuth(config.user);

  // Build table data map
  const tableData: Record<string, unknown[]> = {
    profiles: config.profiles,
    follows: config.follows,
    submissions: config.submissions,
  };

  return {
    auth,
    from: <T>(table: string) => {
      const data = (tableData[table] ?? []) as T[];
      return new MockQueryBuilder<T>(table, data);
    },
    _config: config,
    _setUser: auth._setUser,
  };
}

// ============================================================================
// SCENARIO HELPER
// ============================================================================

/**
 * Create a mock Supabase client from a scenario
 */
export function createMockFromScenario(
  scenario: Scenario,
  allSubmissions: WallSubmission[],
  allProfiles: Profile[]
): MockSupabaseClient {
  return createMockSupabaseClient({
    user: scenario.user,
    profile: scenario.profile,
    follows: scenario.follows,
    submissions: allSubmissions,
    profiles: allProfiles,
  });
}
