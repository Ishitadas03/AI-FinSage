import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
  writable: true,
});

Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverMock,
  writable: true,
});

// Default Mock for @clerk/react in Vitest testing environment
import { vi } from "vitest";
import React from "react";

const clerkMock = {
  ClerkProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "clerk-provider" }, children),
  SignedIn: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  SignedOut: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  SignIn: () =>
    React.createElement("div", { "data-testid": "clerk-signin-component" }, "Clerk SignIn Form"),
  SignUp: () =>
    React.createElement("div", { "data-testid": "clerk-signup-component" }, "Clerk SignUp Form"),
  UserButton: () =>
    React.createElement("div", { "data-testid": "clerk-user-button" }, "User Button"),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    getToken: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(undefined),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: false,
    user: null,
  }),
  useClerk: () => ({
    signOut: vi.fn().mockResolvedValue(undefined),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
  }),
};

vi.mock("@clerk/react", () => clerkMock);
vi.mock("@clerk/clerk-react", () => clerkMock);

