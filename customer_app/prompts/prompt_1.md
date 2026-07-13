You are initializing the React project directory for the LilTreat application.

Before starting, read `GUIDE.md` completely. This project will convert exported screen designs into reusable React components and screens. This initial task is only to create the project foundation. Do not implement any full application screens yet unless explicitly requested.

## Goal

Initialize a clean React project structure that is ready for screen-by-screen implementation.

The project should use the minimum number of packages that we are confident are needed at the beginning. Do not add convenience packages, UI libraries, validation libraries, animation libraries, state management libraries, icon libraries, or networking libraries yet. Additional packages should only be introduced later when a specific screen implementation clearly needs them.

## Required Initial Stack

Use:

* React.
* TypeScript.
* Vite.
* CSS modules.
* `react-router-dom` for SPA routing with browser-like back behavior.

Do not install form libraries yet.

Do not install API/networking libraries yet.

Do not install global state libraries yet.

Do not install UI component libraries yet.

Do not install icon libraries yet. Icons should come from `export_for_build/icons-pack` or `export_for_build/assets`.

Do not install animation libraries yet.

## Package Policy

Install only the packages needed to start the app and support routing.

Expected runtime dependencies:

```text
react
react-dom
react-router-dom
```

Expected development dependencies should be limited to the standard Vite React TypeScript setup, such as:

```text
vite
typescript
@vitejs/plugin-react
```

If the project creation tool adds standard linting packages, keep them only if they are part of the generated template and do not complicate the setup. Do not add extra linting, formatting, testing, styling, or build tooling unless already required by the base template.

## Project Creation

Create the project as a Vite React TypeScript app.

Use the existing repository/project directory if one already exists. Do not create a nested app folder unless the repository is empty and no app structure exists.

If the repo is empty, initialize the project in the current directory.

## Required Directory Structure

Create or normalize the following structure:

```text
src/
  assets/
  components/
  config/
  mocks/
  routes/
  screens/
  styles/
  utils/
```

Also create:

```text
component_directory.md
```

If `component_directory.md` already exists, preserve it and update it only as needed.

## Required Initial Files

Create these files if they do not already exist:

```text
src/config/brand.ts
src/config/support.ts
src/styles/colors.ts
src/routes/AppRoutes.tsx
src/screens/HomeScreen/HomeScreen.tsx
src/screens/HomeScreen/HomeScreen.module.css
src/components/AppShell/AppShell.tsx
src/components/AppShell/AppShell.module.css
src/components/AppShell/index.ts
component_directory.md
```

## Brand Config

Create `src/config/brand.ts` with separate parameters for the app name and the collected treat unit.

Use:

```ts
export const brand = {
  appName: 'LilTreat',
  treatUnitSingular: 'LilTreat',
  treatUnitPlural: 'LilTreats',
} as const;
```

Do not hardcode app-name or treat-unit copy elsewhere when these values should be used.

## Support Config

Create `src/config/support.ts`.

Use:

```ts
export const support = {
  email: 'liltreat@email.com',
  vendorAppLabel: 'vendor app',
} as const;
```

## Colors

Create `src/styles/colors.ts`.

Start with a minimal placeholder token set. These values should be refined later as exact colors are extracted from the screen designs.

```ts
export const colors = {
  black: '#000000',
  white: '#FFFFFF',

  greenOnBlack: '#A8F0B1',
  greenOnWhite: '#128A3A',

  yellowOnBlack: '#FFE66D',
  yellowOnWhite: '#D6A800',

  grey50: '#F7F7F7',
  grey100: '#EFEFEF',
  grey300: '#CFCFCF',
  grey500: '#808080',
  grey700: '#4A4A4A',
} as const;
```

Do not over-expand the token file yet. Add or refine tokens later as actual screens are implemented.

## Routing Setup

Set up routing with `react-router-dom`.

Create `src/routes/AppRoutes.tsx`.

For now, include only a basic home route and a fallback redirect to home.

Example behavior:

```text
/        → HomeScreen
unknown  → redirect to /
```

The route structure should be easy to extend as screens are implemented.

## Initial Home Screen

Create a very simple placeholder `HomeScreen`.

The goal is only to confirm that the app boots and routing works. Do not attempt to reproduce the designed home screen yet unless explicitly requested in a later screen implementation prompt.

The placeholder should:

* Render the app name from `brand.appName`.
* Make clear that the project has been initialized.
* Use CSS modules.
* Avoid backend calls.
* Avoid mock data unless needed.

## App Shell

Create a minimal `AppShell` component.

For now, it can simply wrap route content.

Do not build navigation, sidebar, footer navigation, or headers yet unless required by the first actual screen implementation.

The shell should be reusable and easy to expand later.

## Component Directory

Initialize `component_directory.md` if it does not exist.

Add entries only for reusable components actually created during this task.

At minimum, document `AppShell`.

Use this format:

```md
## AppShell

**Location:** `src/components/AppShell/AppShell.tsx`

**Purpose:** Provides the top-level layout wrapper for routed app screens.

**Used by:** `src/routes/AppRoutes.tsx`

**Key props:**
- `children`: Route content rendered inside the shell.

**Notes:** Minimal initial wrapper. Intended to grow only when shared app layout requirements emerge from implemented screens.
```

Do not add entries for components that do not exist yet.

## Styling Rules

Use CSS modules.

Do not add Sass, Tailwind, styled-components, Emotion, Material UI, Chakra UI, or any other styling system.

Keep global CSS minimal.

Use global CSS only for base reset, body sizing, and app-level defaults if needed.

## Asset Rules

Do not move or duplicate files from `export_for_build` during initialization.

Do not create an icon abstraction yet.

Do not import design assets until a specific screen implementation needs them.

## Mock Data Rules

Create the `src/mocks` folder, but do not populate mock data yet unless needed by the initial placeholder.

Mock data should be added later by specific screen implementation tasks.

## Non-Goals

Do not implement:

* Real login.
* Real signup.
* Google sign-in.
* API calls.
* Networking layer.
* Form validation.
* QR scanning.
* Vendor flows.
* Treat redemption.
* Full home screen design.
* Sidebar.
* Bottom navigation.
* Profile screens.
* Help screens.
* Any other full UI screen.

## After Initialization

Run the project’s build or typecheck command if available.

If the project uses Vite, verify that the app compiles.

## Output Expected From You

After completing initialization, provide a concise summary with:

1. Commands run.
2. Packages installed.
3. Files created.
4. Files modified.
5. Initial route behavior.
6. Any assumptions made.
7. Any issues encountered.

Keep the project intentionally lean. Add new dependencies only later, when a screen-specific implementation requires them.
