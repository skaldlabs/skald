# Project Guidelines

## Tooling

- We use `pnpm` for the JS projects

## Code Style

### General

- Write very concise and simple code.
- Avoid very complex patterns.

### Frontend

- Store state in Zustand stores, following the patterns found in the stores/ directory. Only use useState when the state is 100% component-specific.
- Use the api.ts util for all API requests.
- Build using modular components that make sense as independent units.
- Do not create files with multiple components, unless there is a main component and a very small supporting component that won't be used elsewhere.

### Backend

- Follow existing API patterns from /api/xxxx.py files when creating new endpoints.
- Make sure endpoints are secure.
- Ensure everything has static types.
