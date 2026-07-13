# LilTreat UI Implementation Guide

This guide defines how implementation agents should convert the exported LilTreat screen designs into React components and screens during the initial UI build phase.

The goal of this phase is to faithfully convert the designs into reusable frontend components and navigable screens. Do not wire screens to backend calls yet. Use mock data and local state where needed. A shared networking layer will be introduced later.

---

## 1. Project Goal

Build the LilTreat application UI as a React single-page application using the exported design artifacts.

The implementation should prioritize:

- Accurate conversion of screen designs into React screens.
- A strictly mobile application experience. The UI should always render in a mobile-sized viewport, even when opened from a desktop browser.
- High component reuse.
- Clear navigation behavior that feels native while still using sub-URLs.
- Styling through CSS modules.
- Shared design tokens for colors and recurring values.
- Mock data that allows screens to be previewed and navigated without backend integration.
- A documented component inventory in `component_directory.md`.

---

## 2. Design Artifact Locations

All design exports are located in the `export_for_build` folder.

Expected structure:

```text
export_for_build/
  assets/
  icons-pack/
  screens/
```

### 2.1 Screens

Screen exports are in:

```text
export_for_build/screens
```

Each screen should have both:

```text
<screen-name>.png
<screen-name>.svg
```

Use both files together:

- Use the `.png` file to understand the visual layout, spacing, proportions, visual hierarchy, and final rendered appearance.
- Use the `.svg` file to inspect object names, class names, layer structure, icon references, text labels, and grouped elements.

The `.svg` files may be large, sometimes around 6 MB. Be tactical when inspecting them. Search within the SVG for relevant class names, text content, icon names, groups, and repeated structures instead of trying to manually read the full file.

### 2.2 Icons

Icons are located in:

```text
export_for_build/icons-pack
```

The SVG screen exports may reference icon names through class names or object labels. These names should be treated as hints. The icon names in the screen SVG may differ slightly from the actual filenames in `icons-pack`.

When implementing a screen:

1. Identify all icons used in the screen.
2. Search `icons-pack` first for a matching or similar icon.
3. If not found, search `export_for_build/assets`.
4. If no similar icon or asset exists, raise an implementation issue before substituting a different icon.

Do not silently replace missing icons with unrelated alternatives.

### 2.3 Other Assets

Other image and design assets are located in:

```text
export_for_build/assets
```

Use this folder for illustrations, logos, decorative assets, background elements, or image-like UI elements that are not part of the icon pack.

---

## 3. Technology Expectations

Unless the existing project already establishes a different convention, use the following approach.

### 3.1 React

Build screens and components as React components.

Prefer functional components.

Use TypeScript if the project is already configured for TypeScript. If the project is JavaScript-only, follow the existing convention and keep prop shapes clear through naming and component structure.

### 3.2 Styling

Use React CSS modules for component styling.

Preferred pattern:

```text
ComponentName.tsx
ComponentName.module.css
```

Keep most styling inside the CSS module.

Use inline styles only for truly dynamic values, such as calculated transforms, dynamic sizing, or runtime values that cannot reasonably live in CSS.

Avoid global CSS except for:

- Design tokens.
- Base reset or app-level defaults.
- Font registration, if applicable.
- Shared layout primitives, if already established by the project.

### 3.3 Routing

Use a standard routing library where possible, such as `react-router-dom`, unless the project already has an established router.

The app should behave like a single-page app, but the browser/app back button should feel natural. Use sub-URLs for meaningful screens and modal states where appropriate.

Example route style:

```text
/
 /login
 /signup
 /profile
 /profile/edit-name
 /profile/help
 /treat-jar
 /vendor/:vendorId
 /vendor/:vendorId/redeem
 /success/:successId
```

The exact routes should be determined by the implemented screens and existing project structure.

### 3.4 Mobile-Only Viewport Enforcement

LilTreat is strictly a mobile app. The application should not expand into a desktop layout. If a user opens the app from a tablet or desktop browser, the app should still render inside a constrained mobile viewport.

Implementation expectations:

- Use a top-level mobile viewport wrapper in the app shell or root layout.
- Center the mobile viewport horizontally on larger browser windows.
- Constrain the app to a mobile maximum width, based on the design exports and common mobile viewport widths.
- Keep the app height behavior mobile-like, using the viewport height while avoiding desktop-style wide layouts.
- Use the area outside the mobile viewport as a neutral page background.
- Do not create separate desktop layouts, desktop navigation, or responsive desktop variants unless a future product decision explicitly requests them.

A typical approach is to have the document/body fill the browser window while the React app renders inside a `.mobileViewport` container. The exact width should be chosen based on the exported screen dimensions, but it should remain in the range of common mobile widths rather than expanding to fill desktop space.

Example behavior:

```text
Desktop browser window → centered mobile app frame → same mobile UI as phone
Phone browser/PWA       → app fills available mobile viewport
```

### 3.5 Forms and Validation

Use standard libraries where useful, especially for form validation and controlled form handling.

Acceptable examples include:

- `react-hook-form`
- `zod`
- `yup`

Only introduce a dependency if it meaningfully simplifies the implementation and does not prevent matching the design.

During this phase, validation can be local and mock-based. Do not call a backend.

---

## 4. Design Tokens and Shared Styling

Create shared design token files as the screens are implemented.

At minimum, create a shared colors file.

Suggested location:

```text
src/styles/colors.ts
```

or, if the project uses CSS variables:

```text
src/styles/tokens.css
```

Follow the existing project structure if one already exists.

### 4.1 Required Color Tokens

The app uses a black-and-white visual language with small color accents. Extract exact values from the designs where possible.

Create semantic color tokens for:

- Black.
- White.
- Green used on black backgrounds.
- Green used on white backgrounds.
- Yellow used on black backgrounds.
- Yellow used on white backgrounds.
- Grey shades used for borders, dividers, muted text, disabled states, and backgrounds.

Example TypeScript token structure:

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
};
```

Do not assume these exact values are correct. Replace them with colors extracted from the design exports.

### 4.2 Token Naming

Prefer semantic names when a color has a known role.

Good examples:

```ts
backgroundPrimary
textPrimary
textMuted
borderSubtle
accentGreenOnDark
accentYellowOnLight
```

Avoid naming tokens after one-off uses unless the usage is genuinely unique.

### 4.3 Spacing, Radius, and Typography

As recurring values emerge, extract them into shared tokens or reusable CSS variables.

Examples:

```text
--space-xs
--space-sm
--space-md
--space-lg
--radius-sm
--radius-md
--radius-pill
--font-size-title
--font-size-body
--font-size-caption
```

Do not over-engineer tokens before patterns are clear. Extract shared values once they appear across multiple components or screens.

---

## 5. Application Naming and Text Parameters

During the design phase, both `SmallTreat` and `LilTreat` may appear. Some designs may also say `little treats`.

For this build phase:

- The application name should be `LilTreat`.
- The collected point/treat unit should also display as `LilTreat` for now.
- These must be parameterized separately.

Do not hardcode app naming directly inside reusable components.

### 5.1 Required Name Parameters

Create a shared configuration file.

Suggested location:

```text
src/config/brand.ts
```

Example:

```ts
export const brand = {
  appName: 'LilTreat',
  treatUnitSingular: 'LilTreat',
  treatUnitPlural: 'LilTreats',
};
```

Use `brand.appName` when referring to the application.

Use `brand.treatUnitSingular` and `brand.treatUnitPlural` when referring to collected points or treats.

This separation is important because the app name may remain `LilTreat` while the collected point unit may later change to something like `Little Treat`.

### 5.2 Text Normalization Rules

When a screen design says:

- `SmallTreat` → render as `brand.appName`
- `LilTreat` as app name → render as `brand.appName`
- `LilTreat` as collected points → render as `brand.treatUnitSingular` or `brand.treatUnitPlural`
- `little treats` as collected points → render using the treat unit parameter

When the design intent is unclear, infer from context:

- App title, login copy, legal copy, or headers usually refer to `brand.appName`.
- Balances, rewards, stamp counts, jars, vendor progress, and collection copy usually refer to the treat unit.

---

## 6. Data and Backend Rules

There should be no backend calls in this phase.

Do not create screen-specific API calls.

Do not add temporary fetch calls that will need to be removed later.

Do not couple screens directly to a future API shape unless a contract already exists.

### 6.1 Mock Data

Use mock data to make screens navigable and realistic.

Suggested location:

```text
src/mocks/
```

Possible files:

```text
src/mocks/user.ts
src/mocks/vendors.ts
src/mocks/rewards.ts
src/mocks/treats.ts
src/mocks/navigation.ts
```

Mock data should be realistic enough to exercise common UI states:

- User with confirmed email.
- User with unconfirmed email.
- User signed in with Google.
- User signed in with email/password.
- Vendors with no progress.
- Vendors with partial progress.
- Vendors with enough treats to redeem.
- Empty states.
- Success states.
- Error-like local validation states.

### 6.2 Screen State

For now, use local component state or lightweight mock stores to support interactions.

Examples:

- Opening and closing menus.
- Form input changes.
- Local validation.
- Toggling mock user states.
- Navigating between mock vendor details and reward screens.

Avoid introducing a heavyweight global state library unless the existing project already uses one.

### 6.3 Future Networking Layer

Assume a shared networking layer will be introduced later.

To make that future migration easy:

- Keep mock data access isolated.
- Avoid scattering mock literals across many components.
- Prefer passing data into components through props.
- Keep screens responsible for selecting mock data and passing it down.
- Keep presentational components backend-agnostic.

---

## 7. Navigation Behavior

The app should feel like a SPA while preserving browser-like back behavior.

Use sub-URLs for pages and modal-like states where the user expects back navigation to close or reverse the current step.

### 7.1 Browser-Like Back Behavior

When a user navigates from one screen to another, the browser/app back button should usually return them to the previous meaningful screen.

Example:

```text
Home → Vendor Detail → Redeem → Success
```

Back behavior should avoid invalid states.

For example, once a redemption is complete, going back to a one-time success screen may no longer be valid. In those cases, redirect to a stable screen such as Home or Vendor Detail.

### 7.2 Direct URL Access and Bad State Fallbacks

Because screens may be accessible by URL, each routed page must validate that it has enough data to render safely.

If a page requires route data or state that is missing or invalid, redirect to Home.

Examples:

- A vendor detail page with an unknown `vendorId`.
- A redeem page where the vendor does not exist.
- A redeem page where the user does not have enough treats.
- A success page with a missing or expired success ID.
- An edit page that depends on a profile field that cannot be edited.
- A modal route opened directly without enough context.

Fallback behavior:

```text
Invalid route state → redirect to /
```

Where appropriate, show a safe fallback state briefly only if it improves the user experience. Do not let the app crash or display broken placeholders.

### 7.3 Modal Routes

Use modal routes where they help the app feel native.

Good candidates:

- Confirmation dialogs.
- Edit nickname.
- Help details.
- Small success or completion states.
- QR scanning instructions.
- Vendor-specific actions.

Modal routes should still have URLs if the back button is expected to close them.

Direct access to a modal route must be handled safely. If the modal cannot render independently, redirect to Home.

### 7.4 Replacing History

Use history replacement instead of push navigation when the previous route should not remain reachable.

Good candidates:

- After login completes.
- After signup completes.
- After logout completes.
- After a redemption success is acknowledged.
- After an expired flow redirects to Home.
- After correcting a bad direct URL access.

Example:

```ts
navigate('/', { replace: true });
```

---

## 8. Component-First Workflow

The codebase should be built around reusable components.

Before implementing any screen, the agent must deconstruct the screen into components and compare those components against the existing `component_directory.md`.

### 8.1 Required File: component_directory.md

Create and maintain:

```text
component_directory.md
```

This file is the source of truth for reusable components that have been added.

Every time a new reusable component is created, add it to this file.

Every time an existing reusable component is made more generic, update its entry.

### 8.2 Component Directory Entry Format

Use this format:

```md
## ComponentName

**Location:** `src/components/ComponentName/ComponentName.tsx`

**Purpose:** Short description of what the component renders.

**Used by:** Screen or component names that currently use it.

**Key props:**
- `propName`: What it controls.
- `variant`: Supported visual variants, if applicable.

**Notes:** Any important implementation detail, design constraint, or known limitation.
```

### 8.3 Screen Implementation Workflow

For every screen:

1. Open the `.png` export and understand the visual layout.
2. Inspect the corresponding `.svg` tactically for object names, class names, text, icon names, and group structure.
3. List the screen’s visible sections.
4. Deconstruct each section into likely components.
5. Check `component_directory.md` for existing components.
6. Prefer reusing or generalizing existing components over creating new ones.
7. Create new components only when no existing component can reasonably be generalized.
8. Add or update entries in `component_directory.md`.
9. Implement the screen using mock data.
10. Add route handling and bad-state fallback logic.
11. Compare the implemented screen against the PNG export.
12. Verify responsive behavior where applicable.
13. Confirm that all icons and assets are sourced from `icons-pack` or `assets`.
14. Raise an issue for any missing asset, ambiguous icon, or design inconsistency.

### 8.4 Reuse Before Creation

Prefer this:

```text
Make ExistingCard support a `status` prop.
```

Over this:

```text
Create CompleteCard, EmptyCard, RedeemableCard, LockedCard.
```

Prefer this:

```text
Create one `ProfileFieldRow` component with editable and locked variants.
```

Over this:

```text
Create EmailRow, NicknameRow, GoogleEmailRow, EditableNicknameRow.
```

### 8.5 Presentational vs Screen Components

Use a clear separation:

- Presentational components receive props and render UI.
- Screen components handle route params, mock data selection, navigation, local state, and fallback logic.

Example:

```text
src/screens/ProfileScreen/ProfileScreen.tsx
src/components/ProfileFieldRow/ProfileFieldRow.tsx
```

---

## 9. Suggested Component Categories

The exact component set should emerge from the screens, but these categories are likely to recur.

### 9.1 App Structure

Potential components:

- `AppShell`
- `PageContainer`
- `TopBar`
- `BottomNavigation`
- `Sidebar`
- `ModalRoute`
- `ScreenHeader`

### 9.2 Brand and Illustration

Potential components:

- `BrandWordmark`
- `TreatJarIcon`
- `IllustrationFrame`
- `DecorativeDivider`

### 9.3 Navigation

Potential components:

- `MenuButton`
- `BackButton`
- `NavItem`
- `SidebarItem`
- `RouteGuard`

### 9.4 Cards and Lists

Potential components:

- `VendorCard`
- `TreatProgressCard`
- `RewardCard`
- `InfoCard`
- `HelpTopicCard`
- `EmptyState`

### 9.5 Forms

Potential components:

- `TextField`
- `FormField`
- `PrimaryButton`
- `SecondaryButton`
- `LinkButton`
- `LockedField`
- `ValidationMessage`

### 9.6 Profile

Potential components:

- `ProfileFieldRow`
- `EditableProfileField`
- `ConnectedAccountNotice`
- `EmailVerificationBanner`

### 9.7 Feedback and Flow States

Potential components:

- `SuccessScreenLayout`
- `ConfirmationModal`
- `Toast`
- `InlineNotice`
- `LoadingPlaceholder`

Create these only when needed by an implemented screen.

---

## 10. Screen Build Standards

### 10.1 Fidelity

The implemented screen should match the exported design as closely as practical.

Pay attention to:

- Layout.
- Spacing.
- Alignment.
- Font sizes.
- Weight.
- Border radius.
- Icon size.
- Decorative line work.
- Empty space.
- Button height.
- Input height.
- Visual grouping.
- Text hierarchy.
- Black, white, green, yellow, and grey usage.

### 10.2 Mobile Viewport and Responsiveness

LilTreat is a mobile-only application. Treat the exported designs as mobile screen designs, not as breakpoints for a responsive desktop product.

At minimum:

- Ensure every screen works at common mobile widths.
- Enforce a mobile-sized app viewport when the app is opened on desktop.
- Center the mobile viewport on larger browser windows.
- Do not stretch screens, cards, headers, navigation, or forms to desktop width.
- Avoid fixed widths that overflow small mobile screens.
- Keep tappable elements reasonably sized for touch.
- Avoid text clipping unless the design intentionally truncates.
- Make long labels resilient within the constrained mobile viewport.

Desktop behavior should be limited to hosting the centered mobile app frame. Do not introduce desktop-specific layouts, desktop sidebars, wider content grids, or desktop navigation patterns.

### 10.3 Accessibility

Maintain basic accessibility even during the visual build phase.

Requirements:

- Buttons should be real `<button>` elements unless they are navigation links.
- Links should be real links where appropriate.
- Inputs should have labels, even if visually hidden.
- Images and icons should have useful alt text when meaningful.
- Decorative icons should be hidden from assistive technologies.
- Form errors should be programmatically associated with fields where practical.
- Do not rely on color alone to communicate state.

### 10.4 Copy

Use the copy shown in the designs unless it conflicts with the naming rules.

Normalize app-name and treat-unit references using the shared brand config.

If the design has awkward wording from the design exploration phase, preserve it unless the screen-specific prompt instructs otherwise.

---

## 11. Asset Handling

### 11.1 Icons

Use the actual exported icons wherever possible.

Preferred approach:

- Import SVGs as React components if the build setup supports it.
- Otherwise, use them as image assets.
- Keep icon size controlled by the consuming component.
- Do not duplicate icons into component folders unless the project structure requires it.

### 11.2 Missing or Ambiguous Icons

If an icon referenced in the screen SVG cannot be found:

1. Search by similar names.
2. Search by visual role.
3. Search in both `icons-pack` and `assets`.
4. If no suitable match exists, raise an issue.

Issue format:

```md
### Missing asset: <screen-name>

The screen appears to reference `<icon-or-asset-name>`, but no matching file was found in `export_for_build/icons-pack` or `export_for_build/assets`.

Closest checked names:
- `<candidate-1>`
- `<candidate-2>`

Impact:
- Describe where the asset appears and whether implementation is blocked.
```

### 11.3 SVG Screen Exports

Do not directly embed an entire screen SVG as the implemented screen.

The SVG is a reference for layout and object names, not a substitute for React implementation.

Acceptable uses of screen SVGs:

- Inspecting layer names and class names.
- Identifying icons and assets.
- Measuring layout relationships.
- Extracting visual details.
- Confirming text and grouping.

---

## 12. Implementation Issues

Raise an issue when:

- A screen references an icon or asset that cannot be found.
- The PNG and SVG exports conflict in a meaningful way.
- A screen uses `SmallTreat`, `LilTreat`, and `little treats` in a way where the intended meaning is unclear.
- A route cannot be made safe without additional product decisions.
- A UI state appears necessary but is not represented in the design.
- A standard library prevents matching the design.
- A component is becoming too generic or too complex to remain useful.

Issue format:

```md
## Issue: <short title>

**Screen:** `<screen-name>`

**Context:** What was found.

**Why it matters:** Why this affects implementation.

**Recommendation:** Suggested resolution or decision needed.
```

Keep implementation moving where possible. Use a reasonable placeholder only when it does not hide the issue or create misleading UI.

---

## 13. Suggested Source Structure

Adapt to the existing project if it already has conventions.

Suggested structure:

```text
src/
  assets/
  components/
    ComponentName/
      ComponentName.tsx
      ComponentName.module.css
      index.ts
  config/
    brand.ts
  mocks/
    user.ts
    vendors.ts
    rewards.ts
    treats.ts
  routes/
    AppRoutes.tsx
    routeGuards.ts
  screens/
    HomeScreen/
      HomeScreen.tsx
      HomeScreen.module.css
      index.ts
    LoginScreen/
    SignupScreen/
    ProfileScreen/
  styles/
    colors.ts
    tokens.css
  utils/
```

Keep screen-specific CSS with the screen.

Keep reusable component CSS with the component.

---

## 14. Mock Data Guidelines

Mock data should support navigation and screen review.

Example:

```ts
export const mockUser = {
  id: 'user-1',
  displayName: 'Maya',
  nickname: 'Maya',
  email: 'maya@example.com',
  isEmailConfirmed: false,
  authProvider: 'password',
};
```

Example with Google sign-in:

```ts
export const mockGoogleUser = {
  id: 'user-2',
  displayName: 'Sam',
  nickname: 'Sam',
  email: 'sam@example.com',
  isEmailConfirmed: true,
  authProvider: 'google',
};
```

Example vendor:

```ts
export const mockVendors = [
  {
    id: 'vendor-1',
    name: 'Bean & Bloom',
    currentTreats: 4,
    treatsRequired: 8,
    rewardName: 'Free coffee',
    canRedeem: false,
  },
  {
    id: 'vendor-2',
    name: 'The Cookie Bar',
    currentTreats: 8,
    treatsRequired: 8,
    rewardName: 'Free cookie box',
    canRedeem: true,
  },
];
```

Use mock values that visibly test the UI.

---

## 15. Route Guard Examples

Use route guards or screen-level validation for pages that require valid state.

Example:

```tsx
function VendorScreen() {
  const { vendorId } = useParams();
  const vendor = mockVendors.find((item) => item.id === vendorId);

  if (!vendor) {
    return <Navigate to="/" replace />;
  }

  return <VendorDetail vendor={vendor} />;
}
```

Example redemption guard:

```tsx
function RedeemScreen() {
  const { vendorId } = useParams();
  const vendor = mockVendors.find((item) => item.id === vendorId);

  if (!vendor || !vendor.canRedeem) {
    return <Navigate to="/" replace />;
  }

  return <RedeemFlow vendor={vendor} />;
}
```

Example success guard:

```tsx
function SuccessScreen() {
  const { successId } = useParams();
  const success = mockSuccessEvents.find((item) => item.id === successId);

  if (!success || success.isExpired) {
    return <Navigate to="/" replace />;
  }

  return <SuccessState success={success} />;
}
```

---

## 16. Authentication UI States

Authentication should be mocked only.

Do not implement real login, signup, email confirmation, or Google authentication yet.

However, the UI should support relevant states from the designs:

- Login.
- Signup.
- Google sign-in entry point.
- Email/password sign-in entry point.
- User with unconfirmed email.
- User signed in through Google.
- User signed in through email/password.

### 16.1 Google Sign-In Email Locking

If the user is signed in with Google, the UI should prevent email editing and communicate why.

Use copy that clearly explains that the email is managed by Google sign-in.

Example:

```text
You signed in with Google, so this email can’t be changed here.
```

Use a reusable component for locked profile fields if possible.

### 16.2 Email Confirmation State

If the mock user has not confirmed their email, show the email confirmation state according to the relevant screen design.

This may appear as:

- A banner.
- Inline notice.
- Home screen warning.
- Profile page notice.

Parameterize text using `brand.appName` where the app name appears.

---

## 17. Help and Support Screens

The help screens should be implemented as reusable topic blocks or cards where possible.

Known help topics from design exploration include:

- Vendor guidance.
- How collecting treats works.
- Reporting a technical issue.

Use `Common Help Topics` as the preferred section title where the screen is not a true FAQ.

Support email in the current design exploration:

```text
liltreat@email.com
```

If this appears in a component, keep it configurable.

Suggested config:

```ts
export const support = {
  email: 'liltreat@email.com',
  vendorAppLabel: 'vendor app',
};
```

---

## 18. Component Directory Maintenance

Every implementation task must leave `component_directory.md` accurate.

Before creating a component, read the directory.

After creating or modifying a component, update the directory.

Example entry:

```md
## HelpTopicCard

**Location:** `src/components/HelpTopicCard/HelpTopicCard.tsx`

**Purpose:** Renders a single help topic with a title, short body text, and optional action link.

**Used by:** HelpScreen

**Key props:**
- `title`: The topic heading.
- `children`: The topic body.
- `actionLabel`: Optional call-to-action label.
- `onAction`: Optional click handler.

**Notes:** Designed to keep help topics visually distinct without relying heavily on icons.
```

If a component is retired or replaced, mark it clearly or remove it if the project policy allows.

---

## 19. Screen-Specific Prompt Expectations

A later prompt will provide the name of a specific screen to implement.

When receiving that prompt, the agent should:

1. Locate the matching `.png` and `.svg` in `export_for_build/screens`.
2. Identify required icons and assets.
3. Inspect `component_directory.md`.
4. Deconstruct the screen into components.
5. Reuse or generalize existing components.
6. Implement the screen.
7. Add mock data if needed.
8. Add or update routes if needed.
9. Add fallback behavior for bad direct URL access.
10. Update `component_directory.md`.
11. Report any missing assets, unclear naming, or unresolved implementation issues.

---

## 20. Definition of Done

A screen implementation is complete when:

- The screen is implemented as React components.
- The layout closely matches the PNG export.
- The SVG export has been used to validate names, icons, and grouping where helpful.
- All icons and assets come from `icons-pack` or `assets`.
- Missing assets have been raised as issues.
- Styling is primarily in CSS modules.
- Shared colors have been extracted or reused.
- The screen renders inside the enforced mobile viewport and does not expand into a desktop layout.
- App name and treat unit text use shared parameters.
- The screen uses mock data instead of backend calls.
- The route is added where needed.
- Bad direct URL access redirects safely to Home.
- Invalid historical states are not reachable through back navigation.
- Reusable components are documented in `component_directory.md`.
- Existing components were reused or generalized where reasonable.
- Basic accessibility has been preserved.
- The implementation can be navigated locally without backend support.

---

## 21. Non-Goals for This Phase

Do not implement:

- Real authentication.
- Real Google sign-in.
- Backend API calls.
- Networking layer.
- Persistent user sessions.
- Real QR scanning backend behavior.
- Real redemption fulfillment.
- Push notifications.
- Analytics.
- Payment flows.
- Vendor app integration.
- Production-grade error handling for backend failures.

Use local mock behavior only.

---

## 22. Agent Operating Principles

When implementing LilTreat screens:

- Favor reusable components over one-off screen code.
- Favor clear props over duplicated variants.
- Favor semantic tokens over hardcoded colors.
- Favor safe route fallbacks over broken direct URL states.
- Favor local mock data over temporary backend assumptions.
- Favor the PNG for visual fidelity and the SVG for structural clues.
- Favor raising explicit issues over silently guessing missing assets.
- Keep the project easy to refactor when the networking layer is added later.