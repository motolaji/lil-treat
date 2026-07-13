You are implementing one screen for the LilTreat React application.

Before starting, read and follow `GUIDE.md` completely. The guide is the source of truth for design artifact usage, component reuse, routing behavior, styling, mock data, naming parameters, mobile-only viewport behavior, and implementation standards.

## Screen to Implement

Implement the following screen:

```text
treatjar
```

The screen design exports are located in:

```text
export_for_build/screens
```

Each screen should have both a `.png` and `.svg` export. Use both:

* Use the `.png` to match the final visual layout.
* Use the `.svg` tactically to inspect object names, class names, grouped elements, text, and referenced icons/assets.

Do not directly embed the full screen SVG as the implementation.

## Screen-Specific Notes

Apply the following notes while implementing this screen:

```text
A few things to note about this screen:
1. The cards on this screen are the same as the treatcards already created just with some colour differences.
Don't create a new card. Instead reuse that card from treat card but make those colours configurable. 

2. The treat jar art at the bottom of the page is jar-art.svg. Note, the jar is positioned at the bottom
so the cards appear to be coming from the jar. Achieve this effect by having the cards a z-index above the jar.
Let the cards sit in a scroll view (don't show the scrollbar obviously since it is a mobile app). And let the end
of the scroll view be in the middle of the jar opening so the cards appear to dissappear once they enter the jar.
Put enough sample cards on the page so I can test this scrolling feature.

3. Ensure the back button sends me back to the home page. Also the candy icon at the top right should always send
me to the homepage when tapped from any screen

4. Link both the treat jar icon on the homepage and in the sidebar so they send me to the treat jar screen
```

If there are no screen-specific notes, proceed using only the design exports and `GUIDE.md`.

## Required Workflow

1. Locate the matching `.png` and `.svg` files for `<SCREEN_NAME>`.
2. Review the PNG for layout, spacing, hierarchy, colors, and visual treatment.
3. Inspect the SVG tactically for:

    * Text labels.
    * Layer or class names.
    * Icon references.
    * Asset references.
    * Grouped UI structures.
4. Identify all icons and assets needed by the screen.
5. Search for matching icons in:

```text
export_for_build/icons-pack
```

6. Search for other assets in:

```text
export_for_build/assets
```

7. Raise an implementation issue if a referenced icon or asset cannot be found. Do not silently substitute unrelated assets.
8. Read `component_directory.md` before creating any new component.
9. Deconstruct the screen into reusable components.
10. Reuse existing components wherever possible.
11. If an existing component can reasonably be made more generic, update it instead of creating a duplicate component.
12. Create a new reusable component only when no existing component can reasonably fit.
13. Update `component_directory.md` for every new or modified reusable component.
14. Implement the screen using React components and CSS modules.
15. Use mock data only. Do not create backend calls.
16. Add or update route handling as needed.
17. Add bad-state fallback behavior for direct URL access.
18. Ensure invalid historical states are not reachable through back navigation where applicable.
19. Normalize all app-name and treat-unit copy through the shared brand parameters.
20. Extract or reuse shared color tokens where design colors recur.
21. Verify the implementation against the PNG export.
22. Preserve basic accessibility.
23. Verify that the screen works inside the enforced mobile viewport shell.

## Mobile-Only Requirement

LilTreat is strictly a mobile application.

The UI must always render as a mobile app, even when opened from a desktop browser.

When implementing this screen:

* Treat the exported design as a mobile viewport design.
* Do not create a responsive desktop layout.
* Do not stretch screen content to fill desktop width.
* Ensure the screen renders correctly within the app’s constrained mobile viewport.
* On desktop, the app should appear inside a centered mobile-sized frame or constrained mobile-width container, as defined by the app shell or global layout.
* Keep screen-level layouts mobile-first and mobile-only.
* Avoid desktop breakpoints unless they are only used to preserve the mobile viewport container on larger screens.
* Do not introduce desktop-specific navigation, desktop sidebars, multi-column layouts, or widened content areas unless explicitly requested.

The screen should be tested at common mobile widths and should not overflow horizontally.

Suggested validation widths:

```text
320px
375px
390px
414px
430px
```

For desktop browser widths, confirm that the app still displays as a constrained mobile viewport rather than a desktop-expanded layout.

## Implementation Constraints

Do not implement backend calls.

Do not wire this screen to a real API.

Do not hardcode `LilTreat`, `SmallTreat`, or `little treats` directly inside reusable components.

Use the shared brand configuration:

* Use the app-name parameter for references to the application.
* Use the treat-unit parameter for references to collected points or rewards.

Use CSS modules for styling.

Keep reusable components backend-agnostic.

Keep mock data isolated in the mock data area of the project.

Use route guards or screen-level validation for pages that require valid route params, selected data, or flow state.

If the screen cannot render safely because required data is missing or invalid, redirect to the home page using history replacement.

## Output Expected From You

After implementing the screen, provide a concise implementation summary that includes:

1. Files created.
2. Files modified.
3. Components reused.
4. Components created or generalized.
5. Mock data added or updated.
6. Routes added or updated.
7. Mobile viewport behavior confirmed.
8. Any missing assets or implementation issues raised.
9. Any assumptions made.

## Definition of Done

This screen is complete only when:

* The screen is implemented as React components.
* The visual result closely matches the PNG design.
* The SVG has been used to validate structure, text, and assets where useful.
* Styling is primarily in CSS modules.
* Shared colors are reused or extracted.
* App name and treat unit copy are parameterized.
* The screen uses mock data only.
* Navigation works through the app router.
* Bad direct URL access safely redirects to Home.
* Back navigation does not expose invalid stale states.
* The screen renders correctly within the enforced mobile viewport.
* Desktop access does not expand the UI into a desktop layout.
* `component_directory.md` is updated.
* Missing assets or ambiguous design details are reported clearly.
* Basic accessibility is preserved.
