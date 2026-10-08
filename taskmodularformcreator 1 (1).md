# Frontend Modular Form Creator Assignment

## 1. Business Analysis

### Product context
The product is a Resources Management application used to create, track, and complete resources through a structured module workflow.

### Business objective
Deliver a frontend that reproduces the intended resource lifecycle and behavior exactly as defined by the backend contract.

### Primary user outcomes
- Create a new resource quickly from the list page.
- Track each resource status and module progress.
- Complete resources only when business rules are satisfied.
- Review resource details in a clear summary view.

### Key business flows
- Provisioning flow
  - A resource starts in draft status.
  - Provisioning is the only valid way to move draft to completed.
  - Provisioning is allowed only when both modules are complete.
  - Re-provisioning an already completed resource is not allowed.
- Completed-resource edit flow
  - For completed resources, module form edits are first stored in frontend local state.
  - These edits are treated as temporary, non-persistent draft changes.
  - Backend persistence happens only after explicit user confirmation/submit.
  - If the app is refreshed or closed before submit, buffered edits are lost.

### In-scope deliverables
- List page
- Resource overview page with module progress and actions
- Two module forms: Basic Info and Project Details
- Details/summary page
- Status flow as defined

### Constraints
- Do not modify backend code.
- Do not modify design system code.
- Allowed changes are frontend app code in [src](modular-form-creator/src), routing/state/form logic, and frontend dependencies.

## 2. Technical Details

### Environment and backend
Run backend via Docker:

```bash
docker compose up -d
```

Backend base URL: `http://localhost:5001`  
Swagger UI: `http://localhost:5001/docs`

API behavior and endpoint details: [backend/README.md](modular-form-creator/backend/README.md)

### Routing requirements
- `/resources`
  - Main resources list page.
  - Allow creating and deleting resources.
- `/resources/:resourceId`
  - Resource overview page.
  - Show both modules, progress/status, and key actions.
  - Allow completing resource when rules are satisfied.
- `/resources/:resourceId/details`
  - Resource details/summary page.
  - Present data from both modules.
  - Reflect current status and completion state.
- `/resources/:resourceId/basic-info`
  - Basic Info module page.
- `/resources/:resourceId/project-details`
  - Project Details module page.

### API contract requirements
- Use backend API exactly as documented in [backend/README.md](modular-form-creator/backend/README.md).
- Do not change backend contracts.

### Core business rules
1. Resource creation
- A resource is created from a name.
- Resource name cannot be changed after creation.

2. Module update flow for draft resources
- Basic Info and Project Details are updated as separate modules.
- Project Details becomes available only after Basic Info is completed (for draft resources).

3. Completion flow
- Draft can be moved to completed only through provisioning action.
- Provisioning is allowed only when both modules are completed.
- Completed resource cannot be provisioned again.

4. Completed resources edit flow
- For a completed resource, module form edits must not be sent immediately.
- Keep edits in frontend local state as a temporary buffer.
- Persist buffered edits only after explicit user submission through full update request.
- Buffer is intentionally non-persistent and must be lost on refresh/close.

## 3. Evaluation Focus
- Correctness of business logic implementation
- Code structure and readability
- Form/state management decisions
- Edge-case handling and UX clarity
- Correct usage of given tools, API, components, and related project resources

## 4. Bonus Points
- Add the frontend app to Docker Compose so the full stack can be started with one command.
- Provide a frontend service in `docker-compose.yml` with a working containerized dev or preview setup.
- Ensure frontend-to-backend communication works in Docker without changing backend business/API contracts.
  
## 5. Disqualifying Criteria
- App does not build successfully.
- App has static code analysis errors (lint/type errors) in submitted frontend code.
- Backend contract is changed or bypassed instead of being respected.
- Backend or design system source code is modified.
- Required routes are missing or clearly non-functional.
- Core status flow is incorrect (for example, invalid draft/completed transitions).
- Assignment is submitted in any form other than a GitHub repository.
  
