/**
 * @file studio-indexeddb-storage.test.ts
 * @description Unit tests for the HTML5 IndexedDB storage wrapper.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteImage,
  openDatabase,
  readImage,
  writeImage,
} from "@/lib/studio/indexeddb-storage";

// Mock store map to hold in-memory database entries
const mockStore = new Map<string, string>();

const mockIDBObjectStore = {
  put: vi.fn((value: string, key: string) => {
    mockStore.set(key, value);
    const req = {
      onerror: null,
      onsuccess: null,
    } as unknown as IDBRequest<IDBValidKey>;
    setTimeout(() => {
      if (req.onsuccess) {
        req.onsuccess(new Event("success"));
      }
    }, 0);
    return req;
  }),
  get: vi.fn((key: string) => {
    const value = mockStore.get(key);
    const req = {
      onerror: null,
      onsuccess: null,
      result: undefined as unknown,
    } as unknown as IDBRequest<unknown>;

    setTimeout(() => {
      (req as { result: unknown }).result = value;
      if (req.onsuccess) {
        req.onsuccess(new Event("success"));
      }
    }, 0);
    return req;
  }),
  delete: vi.fn((key: string) => {
    mockStore.delete(key);
    const req = {
      onerror: null,
      onsuccess: null,
    } as unknown as IDBRequest<undefined>;
    setTimeout(() => {
      if (req.onsuccess) {
        req.onsuccess(new Event("success"));
      }
    }, 0);
    return req;
  }),
};

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
};

const mockIDBDatabase = {
  objectStoreNames: {
    contains: vi.fn(() => true),
  },
  createObjectStore: vi.fn(),
  transaction: vi.fn(() => mockIDBTransaction),
  close: vi.fn(),
};

const mockIndexedDB = {
  open: vi.fn(() => {
    const req = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: mockIDBDatabase as unknown as IDBDatabase,
      error: null as Error | null,
    } as unknown as IDBOpenDBRequest;

    setTimeout(() => {
      if (req.onupgradeneeded) {
        req.onupgradeneeded(
          new Event("upgradeneeded") as unknown as IDBVersionChangeEvent,
        );
      }
      if (req.onsuccess) {
        req.onsuccess(new Event("success"));
      }
    }, 0);
    return req;
  }),
};

describe("IndexedDB Storage Wrapper", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.restoreAllMocks();

    // Mock global window object
    vi.stubGlobal("window", {
      indexedDB: mockIndexedDB,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should open database successfully", async () => {
    const db = await openDatabase();
    expect(db).toBe(mockIDBDatabase);
    expect(mockIndexedDB.open).toHaveBeenCalledWith("comic-studio-images", 1);
  });

  it("should fail to open database when indexedDB is not supported", async () => {
    vi.stubGlobal("window", {});
    await expect(openDatabase()).rejects.toThrow(
      "IndexedDB is not supported in this environment.",
    );
  });

  it("should open database successfully with onupgradeneeded flow", async () => {
    const customMockDB = {
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      createObjectStore: vi.fn(),
    };
    const customIndexedDB = {
      open: vi.fn(() => {
        const req = {
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          result: customMockDB as unknown as IDBDatabase,
          error: null,
        } as unknown as IDBOpenDBRequest;

        setTimeout(() => {
          if (req.onupgradeneeded) {
            req.onupgradeneeded(
              new Event("upgradeneeded") as unknown as IDBVersionChangeEvent,
            );
          }
          if (req.onsuccess) {
            req.onsuccess(new Event("success"));
          }
        }, 0);
        return req;
      }),
    };
    vi.stubGlobal("window", { indexedDB: customIndexedDB });

    const db = await openDatabase();
    expect(db).toBe(customMockDB);
    expect(customMockDB.createObjectStore).toHaveBeenCalledWith("images");
  });

  it("should handle request error during database opening", async () => {
    const errorIndexedDB = {
      open: vi.fn(() => {
        const req = {
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          result: mockIDBDatabase as unknown as IDBDatabase,
          error: new Error("Failed to open DB"),
        } as unknown as IDBOpenDBRequest;

        setTimeout(() => {
          if (req.onerror) {
            req.onerror(new Event("error"));
          }
        }, 0);
        return req;
      }),
    };
    vi.stubGlobal("window", { indexedDB: errorIndexedDB });

    await expect(openDatabase()).rejects.toThrow("Failed to open DB");
  });

  it("should write an image successfully", async () => {
    await writeImage("test-key", "data:image/png;base64,123");
    expect(mockStore.get("test-key")).toBe("data:image/png;base64,123");
    expect(mockIDBObjectStore.put).toHaveBeenCalledWith(
      "data:image/png;base64,123",
      "test-key",
    );
  });

  it("should read an image successfully", async () => {
    mockStore.set("test-key", "data:image/png;base64,123");
    const data = await readImage("test-key");
    expect(data).toBe("data:image/png;base64,123");
    expect(mockIDBObjectStore.get).toHaveBeenCalledWith("test-key");
  });

  it("should return null for non-existing image", async () => {
    const data = await readImage("non-existent");
    expect(data).toBeNull();
  });

  it("should delete an image successfully", async () => {
    mockStore.set("test-key", "data:image/png;base64,123");
    await deleteImage("test-key");
    expect(mockStore.has("test-key")).toBe(false);
    expect(mockIDBObjectStore.delete).toHaveBeenCalledWith("test-key");
  });
});
