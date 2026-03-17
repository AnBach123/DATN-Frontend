# AGENTS.md - Development Guide for DATN-Frontend

This document provides essential information for AI coding agents working on this Vue 3 + TypeScript + Vite project.

## Project Overview

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript (strict mode with `noUncheckedIndexedAccess`)
- **Build Tool**: Vite
- **Router**: Vue Router 4
- **HTTP Client**: Axios + native fetch
- **UI Framework**: Bootstrap 5
- **Testing**: Playwright (E2E)
- **Linting**: ESLint + oxlint
- **Formatting**: Prettier

## Build, Lint, and Test Commands

### Development

```bash
npm run dev                    # Start dev server (http://localhost:5173)
```

### Build

```bash
npm run build                  # Type-check and build for production
npm run build-only             # Build without type-checking
npm run preview                # Preview production build (http://localhost:4173)
```

### Type Checking

```bash
npm run type-check             # Run vue-tsc type checking
```

### Linting and Formatting

```bash
npm run lint                   # Run ESLint with auto-fix
npm run format                 # Format code with Prettier
```

### Testing

```bash
# E2E Tests with Playwright
npm run test:e2e                              # Run all E2E tests
npm run test:e2e -- --project=chromium       # Run tests on Chromium only
npm run test:e2e -- e2e/vue.spec.ts          # Run a specific test file
npm run test:e2e -- --debug                  # Run tests in debug mode
npx playwright install                        # Install browser binaries (first time)
```

**Note**: E2E tests automatically start the dev server. On CI, they use the preview server.

## Code Style Guidelines

### General Formatting

- **Indentation**: 2 spaces (enforced by .editorconfig)
- **Line Length**: 100 characters max
- **Semicolons**: No semicolons (Prettier config)
- **Quotes**: Single quotes (Prettier config)
- **Line Endings**: LF (Unix-style)
- **Final Newline**: Required
- **Trailing Whitespace**: Remove

### TypeScript

- Use strict TypeScript with `noUncheckedIndexedAccess: true`
- Always provide explicit types for function parameters and return values
- Use type inference for local variables when obvious
- Prefer `type` over `interface` for object shapes
- Use `unknown` instead of `any` when type is truly unknown

### Imports

- Use path alias `@/` for imports from `src/` directory
- Group imports in this order:
  1. Vue core imports (`vue`, `vue-router`)
  2. Third-party libraries (`axios`, `sweetalert2`, `bootstrap`)
  3. Local components (using `@/` alias)
  4. Types (can be inline with imports)
  5. Styles

Example:

```typescript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import MyComponent from '@/components/MyComponent.vue'
import type { ApiResponse } from '@/services/authApi'
import './styles/component.css'
```

### Vue Components

- Use `<script setup lang="ts">` syntax (Composition API)
- Define props with `defineProps<T>()` using TypeScript generics
- Define emits with `defineEmits<T>()` using TypeScript generics
- Use `ref()` for reactive primitives, `reactive()` for objects
- Prefer composables over mixins
- Component file structure:

  ```vue
  <template>
    <!-- Template content -->
  </template>

  <script setup lang="ts">
  // Imports
  // Props/Emits
  // Composables
  // Reactive state
  // Computed properties
  // Methods
  // Lifecycle hooks
  </script>

  <style scoped>
  /* Component styles */
  </style>
  ```

### Naming Conventions

- **Components**: PascalCase (e.g., `ReservationForm.vue`, `BookingModal.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useBookingStore.ts`)
- **Services/APIs**: camelCase with API suffix (e.g., `authApi.ts`, `productApi.ts`)
- **Types**: PascalCase (e.g., `ApiResponse`, `LoginPayload`)
- **Variables/Functions**: camelCase (e.g., `isOpen`, `callLogin`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `PRODUCT_API`)

### API Services Pattern

- Create dedicated API service files in `src/services/`
- Export types for payloads and responses
- Use consistent naming: `call*` for API functions (e.g., `callLogin`, `callRegister`)
- Define `ApiResponse<T>` wrapper type for consistent API responses
- Handle errors gracefully with try-catch

Example:

```typescript
export type ApiResponse<T> = {
  message: string
  data: T
  errors?: Array<{ field: string; error: string }>
}

export type LoginPayload = {
  email: string
  password: string
}

export function callLogin(payload: LoginPayload) {
  return postJson<ApiResponse<LoginData>>('/api/auth/login', payload)
}
```

### Error Handling

- Use try-catch blocks for async operations
- Log errors to console with descriptive messages
- Return fallback values (empty arrays, null) instead of throwing
- Show user-friendly error messages using SweetAlert2
- Never expose sensitive error details to users

### State Management

- Use composables for shared state (see `src/composables/bookingStore.ts`)
- Export reactive refs and methods from composables
- Keep composables focused and single-purpose
- Use `ref()` for primitive values, `reactive()` for complex objects

### Routing

- Define routes in `src/router/index.ts`
- Use named routes for navigation
- Use layouts for shared UI structure (`MainLayout`, `ReceptionMainLayout`)
- Redirect root `/` to appropriate default route

### API Proxy Configuration

- Backend API proxied through Vite dev server
- All `/api/*` requests forwarded to `http://localhost:8080`
- Use relative URLs starting with `/api/` in API calls

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── home/           # Home page components
│   ├── reception/      # Reception desk components
│   ├── reservation/    # Reservation components
│   └── staff/          # Staff-specific components
├── composables/        # Composable functions (shared state/logic)
├── layout/             # Layout components (MainLayout, ReceptionMainLayout)
├── router/             # Vue Router configuration
├── services/           # API service modules
├── styles/             # Global styles
├── views/              # Page-level components
│   ├── auth/          # Authentication pages
│   ├── menu/          # Menu pages
│   └── reservation/   # Reservation pages
├── App.vue            # Root component
└── main.ts            # Application entry point
```

## Important Notes

- **No Comments**: Do NOT add code comments unless explicitly requested
- **Bootstrap**: Use Bootstrap 5 classes for styling; custom CSS in scoped styles
- **Fonts**: Project uses Google Fonts (Manrope, Playfair Display)
- **Icons**: Check existing components for icon usage patterns
- **Accessibility**: Ensure semantic HTML and proper ARIA attributes
- **Security**: Never commit secrets; use environment variables for sensitive data

## Before Committing

Always run these commands before committing:

```bash
npm run type-check     # Ensure no TypeScript errors
npm run lint           # Fix linting issues
npm run format         # Format code consistently
```

## Common Patterns

### Fetch with Error Handling

```typescript
async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) throw data
  return data as T
}
```

### Axios with Error Handling

```typescript
try {
  const res = await axios.get(PRODUCT_API)
  return res.data.data || []
} catch (error) {
  console.error('Load product lỗi:', error)
  return []
}
```

### Composable Pattern

```typescript
import { ref } from 'vue'

const state = ref(false)

export const useMyStore = () => {
  const toggle = () => {
    state.value = !state.value
  }
  return { state, toggle }
}
```
