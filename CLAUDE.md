# Project Guidelines

## Tooling

- We use `uv` for managing the Python project
- We use the virtual environment at .venv
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

- Follow existing API patterns from xxxx_api.py files when creating new endpoints.
- Make sure endpoints are secure.
- Ensure everything has static types.


## Docs

### Documentation generation

- Always follow the same tone and patterns as existing documentation
- Keep docs very concise and to the point
- Whenever you make changes (or spot changes) to:
    - services: update README.md to include the most up-to-date running instructions
    - the API's structural components: like changes to auth, update api-overview.md
    - API endpoints: update api-reference.md
    - models: update models.md

### Using the docs

- Refer to the docs/ directory for overviews on how things work