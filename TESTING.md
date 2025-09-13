# Testing Guide

This document provides a comprehensive guide to testing in the Zex-Content application.

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Test setup and global mocks
│   ├── utils.tsx             # Test utilities and helpers
│   ├── components.test.tsx   # Component tests
│   ├── hooks.test.tsx        # Hook tests
│   └── api.test.tsx          # API tests
└── **/
    ├── *.test.tsx            # Component-specific tests
    ├── *.spec.tsx            # Component-specific specs
    └── __tests__/            # Test directories
```

## Running Tests

### Basic Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Test Categories

#### 1. Component Tests
Location: `src/components/**/*.test.tsx` or `src/components/**/__tests__/**/*.tsx`

Example:
```tsx
import { render, screen } from '@testing-library/react';
import { ActionButton } from '@/components/ui/common-patterns';

describe('ActionButton', () => {
  test('renders button with text', () => {
    render(<ActionButton>Click me</ActionButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

#### 2. Hook Tests
Location: `src/hooks/**/*.test.tsx` or `src/hooks/**/__tests__/**/*.tsx`

Example:
```tsx
import { renderHook } from '@testing-library/react';
import { useErrorHandler } from '@/components/ErrorBoundaryEnhanced';

describe('useErrorHandler', () => {
  test('provides error handling utilities', () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('handleError');
    expect(result.current).toHaveProperty('resetError');
  });
});
```

#### 3. API Tests
Location: `src/test/api.test.tsx` or `src/**/api/**/*.test.tsx`

Example:
```tsx
import { createMockResponse } from '@/test/utils';

describe('API Tests', () => {
  test('handles successful responses', async () => {
    const mockData = { success: true };
    global.fetch = jest.fn().mockResolvedValue(createMockResponse(mockData));
    
    const response = await fetch('/api/test');
    const data = await response.json();
    
    expect(data).toEqual(mockData);
  });
});
```

## Testing Utilities

### Custom Render Function
The project provides a custom render function that includes all necessary providers:

```tsx
import { render } from '@/test/utils';

// Automatically includes:
// - QueryClientProvider
// - BrowserRouter
// - ThemeProvider
// - ErrorBoundary

render(<MyComponent />);
```

### Mock Data Generators
```tsx
import { mockUser, mockSite, mockContent } from '@/test/utils';

// Use predefined mock data
const user = mockUser;
const site = mockSite;
const content = mockContent;
```

### API Response Mocks
```tsx
import { createMockResponse, createMockErrorResponse } from '@/test/utils';

// Successful response
const successResponse = createMockResponse({ data: 'success' });

// Error response
const errorResponse = createMockErrorResponse('Error message', 400);
```

## Test Patterns

### 1. Component Testing Pattern
```tsx
describe('ComponentName', () => {
  // Render tests
  test('renders correctly', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });

  // Interaction tests
  test('handles user interactions', async () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // State tests
  test('updates state correctly', async () => {
    render(<ComponentName />);
    
    const input = screen.getByLabelText('Input label');
    await userEvent.type(input, 'new value');
    
    expect(screen.getByDisplayValue('new value')).toBeInTheDocument();
  });

  // Accessibility tests
  test('meets accessibility requirements', () => {
    render(<ComponentName />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
```

### 2. Hook Testing Pattern
```tsx
describe('useHookName', () => {
  test('returns expected values', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.value).toBe('expected');
  });

  test('handles state updates', () => {
    const { result } = renderHook(() => useHookName());
    
    act(() => {
      result.current.updateFunction('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });

  test('cleans up effects', () => {
    const { unmount } = renderHook(() => useHookName());
    const cleanupSpy = jest.spyOn(result.current, 'cleanup');
    
    unmount();
    
    expect(cleanupSpy).toHaveBeenCalled();
  });
});
```

### 3. API Testing Pattern
```tsx
describe('API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful request', async () => {
    const mockData = { success: true };
    global.fetch = jest.fn().mockResolvedValue(createMockResponse(mockData));
    
    const response = await apiCall();
    
    expect(response).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/endpoint', expect.any(Object));
  });

  test('error handling', async () => {
    global.fetch = jest.fn().mockResolvedValue(createMockErrorResponse('Error', 500));
    
    await expect(apiCall()).rejects.toThrow('Error');
  });

  test('retry logic', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(createMockResponse({ success: true }));
    
    const result = await apiCallWithRetry();
    
    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
```

## Best Practices

### 1. Test Organization
- Group related tests together using `describe` blocks
- Use descriptive test names that explain what is being tested
- Keep tests focused and independent
- Use `beforeEach` and `afterEach` for setup and cleanup

### 2. Mocking Strategy
- Mock external dependencies (APIs, browser APIs)
- Use meaningful mock data that resembles real data
- Clean up mocks after each test
- Avoid over-mocking - test real behavior when possible

### 3. Accessibility Testing
- Test keyboard navigation
- Verify ARIA labels and roles
- Test screen reader compatibility
- Ensure color contrast compliance

### 4. Performance Testing
- Test component render performance
- Verify hook memoization
- Test error handling performance
- Measure memory usage for complex components

## Coverage Goals

- **Overall Coverage**: 80% minimum
- **Component Coverage**: 90% for critical components
- **Hook Coverage**: 85% for custom hooks
- **API Coverage**: 80% for API utilities

## CI/CD Integration

Tests are automatically run in CI/CD pipelines:
- **Pull Requests**: All tests must pass
- **Main Branch**: Full test suite with coverage report
- **Deployments**: Tests must pass before deployment

## Debugging Tests

### Common Issues
1. **Act warnings**: Use `await act()` for state updates
2. **Missing providers**: Use the custom render function
3. **Async operations**: Use `waitFor` or `findBy*` queries
4. **Mock persistence**: Clean up mocks in `afterEach`

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- --testPathPattern=components.test.tsx

# Run tests with coverage for specific file
npm test -- --coverage --testPathPattern=hooks.test.tsx

# Run tests in debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

## Writing New Tests

When adding new features:
1. Write tests before implementation (TDD)
2. Test all happy paths and edge cases
3. Include accessibility tests
4. Add performance tests for complex features
5. Update documentation for complex test scenarios

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro/)
- [Jest DOM](https://github.com/testing-library/jest-dom)