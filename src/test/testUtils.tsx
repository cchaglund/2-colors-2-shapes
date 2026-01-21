/**
 * Test utilities for React Testing Library
 *
 * Provides wrapper components and helper functions for testing
 * React components with the necessary providers.
 */

import { StrictMode, type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';

/**
 * Props for TestProviders wrapper
 */
interface TestProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides all necessary providers for testing.
 * Currently wraps with StrictMode to match production behavior.
 *
 * Add additional providers here as needed (e.g., mock Supabase context,
 * theme provider, etc.)
 */
export function TestProviders({ children }: TestProvidersProps): ReactElement {
  return <StrictMode>{children}</StrictMode>;
}

/**
 * Custom render options extending RTL's RenderOptions
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Additional providers or configuration can be passed here in the future
   */
}

/**
 * Render a component wrapped with all test providers.
 * Use this instead of RTL's render for consistent test setup.
 *
 * @example
 * ```tsx
 * import { renderWithProviders, screen } from '../test/testUtils';
 *
 * test('renders greeting', () => {
 *   renderWithProviders(<Greeting name="World" />);
 *   expect(screen.getByText('Hello, World!')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: TestProviders,
    ...renderOptions,
  });
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';

// Override the default render with our custom one
export { renderWithProviders as render };
