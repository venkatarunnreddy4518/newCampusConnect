type QueryFilter = {
  type: "eq" | "in";
  column: string;
  value: unknown;
};

type QueryOrder = {
  column: string;
  ascending?: boolean;
};

type Session = {
  user: {
    id: string;
    email: string | null;
    user_metadata?: {
      full_name?: string;
    };
    app_metadata?: {
      roles?: string[];
      primary_role?: string;
      permissions?: unknown[];
    };
  };
  expires_at: string;
};

type DbError = {
  message: string;
};

type DbResponse<T> = {
  data: T;
  error: DbError | null;
  count?: number | null;
};

type SelectOptions = {
  count?: "exact";
  head?: boolean;
};

type AuthListener = (event: string, session: Session | null) => void;

let sessionCache: Session | null = null;
const authListeners = new Set<AuthListener>();

function encodePath(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function requestJson<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(pathname, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  return response.json();
}

async function requestRaw<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(pathname, {
    credentials: "include",
    ...init,
  });

  return response.json();
}

function emitAuthChange(event: string, session: Session | null) {
  sessionCache = session;
  for (const listener of authListeners) {
    listener(event, session);
  }
}

class SelectBuilder<T = any> implements PromiseLike<DbResponse<T[]>> {
  private filters: QueryFilter[] = [];
  private orderBy?: QueryOrder;
  private limitCount?: number;
  private columns = "*";
  private options: SelectOptions = {};

  constructor(private readonly table: string) {}

  select(columns = "*", options: SelectOptions = {}) {
    this.columns = columns;
    this.options = options;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ type: "in", column, value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending: options.ascending };
    return this;
  }

  limit(value: number) {
    this.limitCount = value;
    return this;
  }

  async single(): Promise<DbResponse<T | null>> {
    return this.execute<T | null>({ single: true });
  }

  async maybeSingle(): Promise<DbResponse<T | null>> {
    return this.execute<T | null>({ maybeSingle: true });
  }

  then<TResult1 = DbResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DbResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute<T[]>().then(onfulfilled, onrejected);
  }

  private async execute<TResult>(flags: { single?: boolean; maybeSingle?: boolean } = {}): Promise<DbResponse<TResult>> {
    return requestJson<DbResponse<TResult>>(`/api/db/${this.table}/select`, {
      method: "POST",
      body: JSON.stringify({
        columns: this.columns,
        filters: this.filters,
        orderBy: this.orderBy,
        limit: this.limitCount,
        count: this.options.count,
        head: this.options.head,
        ...flags,
      }),
    });
  }
}

class MutationBuilder<T = any> implements PromiseLike<DbResponse<T[] | null>> {
  private filters: QueryFilter[] = [];
  private returning = false;

  constructor(
    private readonly table: string,
    private readonly action: "insert" | "update" | "delete",
    private readonly values?: unknown,
  ) {}

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ type: "in", column, value });
    return this;
  }

  select() {
    this.returning = true;
    return this;
  }

  async single(): Promise<DbResponse<T | null>> {
    return this.execute<T | null>({ single: true });
  }

  then<TResult1 = DbResponse<T[] | null>, TResult2 = never>(
    onfulfilled?: ((value: DbResponse<T[] | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute<T[] | null>().then(onfulfilled, onrejected);
  }

  private async execute<TResult>(flags: { single?: boolean } = {}): Promise<DbResponse<TResult>> {
    return requestJson<DbResponse<TResult>>(`/api/db/${this.table}/${this.action}`, {
      method: "POST",
      body: JSON.stringify({
        values: this.values,
        filters: this.filters,
        returning: this.returning,
        ...flags,
      }),
    });
  }
}

class PollingChannel {
  private listeners: Array<(payload: Record<string, unknown>) => void> = [];
  private timerId: number | null = null;

  on(_eventType: string, _config: Record<string, unknown>, callback: (payload: Record<string, unknown>) => void) {
    this.listeners.push(callback);
    return this;
  }

  subscribe() {
    this.timerId = window.setInterval(() => {
      for (const listener of this.listeners) {
        listener({});
      }
    }, 4000);

    return this;
  }

  unsubscribe() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const supabase = {
  from<T = any>(table: string) {
    return {
      select(columns = "*", options: SelectOptions = {}) {
        return new SelectBuilder<T>(table).select(columns, options);
      },
      insert(values: unknown) {
        return new MutationBuilder<T>(table, "insert", values);
      },
      update(values: unknown) {
        return new MutationBuilder<T>(table, "update", values);
      },
      delete() {
        return new MutationBuilder<T>(table, "delete");
      },
      upsert(values: unknown) {
        return requestJson<DbResponse<null>>(`/api/db/${table}/upsert`, {
          method: "POST",
          body: JSON.stringify({ values }),
        });
      },
    };
  },
  auth: {
    async getSession() {
      const result = await requestJson<{ session: Session | null }>("/api/auth/session");
      sessionCache = result.session;
      return { data: { session: result.session } };
    },
    onAuthStateChange(callback: AuthListener) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
    async signUp(payload: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
      const result = await requestJson<{ session?: Session; error?: DbError }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          fullName: payload.options?.data?.full_name || "",
        }),
      });

      if (result.error) {
        return { data: { session: null, user: null }, error: result.error };
      }

      emitAuthChange("SIGNED_IN", result.session ?? null);
      return {
        data: {
          session: result.session ?? null,
          user: result.session?.user ?? null,
        },
        error: null,
      };
    },
    async signInWithPassword(payload: { email: string; password: string }) {
      const result = await requestJson<{ session?: Session; error?: DbError }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result.error) {
        return { data: { session: null, user: null }, error: result.error };
      }

      emitAuthChange("SIGNED_IN", result.session ?? null);
      return {
        data: {
          session: result.session ?? null,
          user: result.session?.user ?? null,
        },
        error: null,
      };
    },
    async signOut() {
      await requestJson("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
      emitAuthChange("SIGNED_OUT", null);
      return { error: null };
    },
    async signInWithOAuth() {
      return {
        data: null,
        error: {
          message: "OAuth sign-in is not configured in the local SQL version of this project.",
        },
      };
    },
    async setSession() {
      return {
        data: null,
        error: {
          message: "Token-based session handoff is not supported in the local SQL version.",
        },
      };
    },
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(filePath: string, file: File, options?: { upsert?: boolean }) {
          const result = await requestRaw<{ data?: { path: string; publicUrl: string }; error?: DbError }>(
            `/api/storage/${bucket}/upload?path=${encodeURIComponent(filePath)}&upsert=${options?.upsert ? "true" : "false"}`,
            {
              method: "POST",
              headers: {
                "Content-Type": file.type || "application/octet-stream",
              },
              body: file,
            },
          );

          return {
            data: result.data ?? null,
            error: result.error ?? null,
          };
        },
        getPublicUrl(filePath: string) {
          return {
            data: {
              publicUrl: `/uploads/${bucket}/${encodePath(filePath)}`,
            },
          };
        },
      };
    },
  },
  channel() {
    return new PollingChannel();
  },
  removeChannel(channel: PollingChannel) {
    channel.unsubscribe();
  },
};
