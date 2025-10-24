import { QueryClient } from "@tanstack/react-query";

// Singleton QueryClient used across the app and in interceptors
export const queryClient = new QueryClient();

