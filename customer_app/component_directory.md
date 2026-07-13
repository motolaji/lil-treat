## AppShell

**Location:** `src/components/AppShell/AppShell.tsx`

**Purpose:** Wraps routed screens in the constrained mobile viewport shell used across the app.

**Used by:** `src/routes/AppRoutes.tsx`

**Key props:**
- `children`: Route content rendered inside the shell.

**Notes:** Wraps the app in a constrained mobile frame on desktop while allowing full-width mobile rendering on phones.

## TextField

**Location:** `src/components/TextField/TextField.tsx`

**Purpose:** Renders a reusable labelled text input with optional hidden label and optional validation message.

**Used by:** `src/components/MyTreatsPane/MyTreatsPane.tsx`, `src/components/SearchFilterRow/SearchFilterRow.tsx`, `src/screens/LoginScreen/LoginScreen.tsx`, `src/screens/SignUpScreen/SignUpScreen.tsx`

**Key props:**
- `id`: Connects the label, input, and optional validation message.
- `value`: Controlled input value.
- `onChange`: Receives the next string value on input change.
- `label`: Optional visible or screen-reader-only field label.
- `hideLabel`: Hides the label visually while keeping it accessible.
- `placeholder`: Optional placeholder copy.
- `type`: Input type such as text, email, password, or search.
- `errorMessage`: Optional validation copy rendered below the field.
- `required`: Marks the input as required when needed.
- `autoFocus`: Allows screens to focus the field on first render when appropriate.
- `variant`: Switches between the default light field and an inverted dark-surface field.
- `fieldClassName`: Allows consumers to preserve screen-specific shell styling.
- `inputClassName`: Allows consumers to preserve screen-specific text styling.
**Notes:** Extracted from the Treat Jar search field so shared input styling, active-focus treatment, validation behavior, and inverted dark-surface search treatment can be reused across form and search screens.

## FilterButton

**Location:** `src/components/FilterButton/FilterButton.tsx`

**Purpose:** Renders the reusable filled filter action button with the shared exported filter icon baked into the component.

**Used by:** `src/components/SearchFilterRow/SearchFilterRow.tsx`

**Key props:**
- `ariaLabel`: Accessible name for the button.
- `onClick`: Optional handler for opening filter controls.
- `className`: Allows screen-specific sizing and surface styling overrides.
- `iconClassName`: Allows screen-specific icon sizing overrides.

**Notes:** Keeps the filter icon asset choice centralized so repeated search/filter rows do not have to pass the icon source manually.

## MyTreatsPane

**Location:** `src/components/MyTreatsPane/MyTreatsPane.tsx`

**Purpose:** Renders the Home screen’s collapsible My Treats bottom sheet, including the handle, header, optional inverted search field, and scrollable treat-card list.

**Used by:** `src/screens/HomeScreen/HomeScreen.tsx`

**Key props:**
- `treatsSheetMode`: Controls whether the pane is collapsed, expanded, or in search mode.
- `visibleTreatCards`: Filtered treat-card dataset to render in the pane.
- `treatCardLogos`: Lookup map for resolving vendor logo assets by logo key.
- `treatUnitCollectedLabel`: Shared progress label passed down to each treat card.
- `searchValue`: Controlled value for the optional search field.
- `cardViewportRef`: Ref to the internal scroll container used for collapse-at-top behavior.
- `onSearchChange`: Receives the next search string.
- `onSearchOpen`: Opens the pane’s search mode.
- `onToggle`: Expands or collapses the pane via the drag handle.
- `onWheel`: Handles wheel-based expand/collapse gestures.
- `onTouchStart`: Captures gesture start for swipe handling.
- `onTouchEnd`: Completes swipe-based expand/collapse handling.
- `onCardViewportScroll`: Keeps the internal scroll viewport behavior bounded.
- `onCardAction`: Handles per-card navigation when a treat card is pressed.

**Notes:** Extracted from `HomeScreen` so the stateful bottom-sheet UI is isolated from the screen’s brand header and route/navigation wiring while preserving the existing expand, search, and scroll behaviors.

## SearchFilterRow

**Location:** `src/components/SearchFilterRow/SearchFilterRow.tsx`

**Purpose:** Renders a reusable search-input and filter-button pair for screens that use the Treat Jar-style search control.

**Used by:** `src/components/VendorRedeemContent/VendorRedeemContent.tsx`, `src/components/VendorCollectTreatContent/VendorCollectTreatContent.tsx`, `src/screens/TreatJarScreen/TreatJarScreen.tsx`, `src/screens/ReceiptsListScreen/ReceiptsListScreen.tsx`

**Key props:**
- `inputId`: Accessible input identifier.
- `value`: Controlled search value.
- `onChange`: Receives the next input string.
- `label`: Accessible label for the text field.
- `placeholder`: Optional search placeholder text.
- `filterAriaLabel`: Accessible name for the filter button.
- `fieldClassName`: Allows screen-specific input-shell styling to be preserved.
- `filterButtonClassName`: Allows screen-specific filter button sizing and shadow treatment.
- `isFilterActive`: Applies the shared active-state treatment when any non-default sort or filter is currently selected.

**Notes:** Wraps `TextField` so repeated search-and-filter controls can stay visually consistent without duplicating markup. The paired filter button shows a green outline whenever a screen reports an active selection.

## SortFilterModal

**Location:** `src/components/SortFilterModal/SortFilterModal.tsx`

**Purpose:** Renders the shared dark-overlay sort-and-filter modal used by screens that pair a search field with a filter action.

**Used by:** `src/screens/TreatJarScreen/TreatJarScreen.tsx`, `src/screens/ReceiptsListScreen/ReceiptsListScreen.tsx`, `src/components/VendorRedeemContent/VendorRedeemContent.tsx`, `src/components/VendorCollectTreatContent/VendorCollectTreatContent.tsx`

**Key props:**
- `config`: JSON-like modal definition containing available sort options and one or more filter dropdown groups.
- `initialSelection`: Optional currently applied sort and filter state used to prefill the modal controls.
- `onApply`: Receives the normalized selected sort key plus keyed filter selections when the user confirms.
- `onClose`: Dismisses the modal without applying additional changes.
- `title`: Optional modal heading text.
- `sortLabel`: Optional label for the sort select.
- `primaryActionLabel`: Optional label for the primary confirmation button.
- `secondaryActionLabel`: Optional label for the dismiss button.

**Notes:** Keeps the exported filter overlay treatment reusable across screens while letting each caller provide its own option config and local filtering logic. Any selected sort or filter field receives the same green active outline as the trigger button so active choices remain visible. The clear action now sits at the top of the modal body as a prominent pill button for faster reset discovery. The primary apply action stays disabled until the draft differs from the currently applied sort/filter state, including after using Clear All.

## VendorHeroSection

**Location:** `src/components/VendorHeroSection/VendorHeroSection.tsx`

**Purpose:** Renders the vendor detail hero/header area, including navigation actions, vendor branding, distance metadata, collected-treat summary, and expiry guidance.

**Used by:** `src/screens/VendorScreen/VendorScreen.tsx`

**Key props:**
- `vendor`: Vendor record supplying display name and hero metadata.
- `vendorLogoSrc`: Resolved vendor logo image source.
- `vendorLogoAlt`: Accessible alternative text for the vendor logo.
- `appName`: App name used in the home-button accessible label.
- `treatUnitPlural`: Shared treat-unit label used in the summary and expiry copy.
- `onBack`: Callback fired when the back button is pressed.
- `onHome`: Callback fired when the home button is pressed.

**Notes:** Keeps the vendor hero presentation separate from route and tab concerns so `VendorScreen` can stay focused on data lookup and navigation wiring.

## VendorTabBar

**Location:** `src/components/VendorTabBar/VendorTabBar.tsx`

**Purpose:** Renders the vendor detail screen tab selector and delegates tab-change behavior back to the screen.

**Used by:** `src/screens/VendorScreen/VendorScreen.tsx`

**Key props:**
- `activeTab`: Current vendor detail tab state.
- `collectLabel`: Uppercase label appended to the collect tab.
- `onTabChange`: Called when the user selects a different vendor tab.

**Notes:** Keeps the vendor tab UI presentation-focused while `VendorScreen` owns route-driven tab state and navigation.

## VendorRedeemContent

**Location:** `src/components/VendorRedeemContent/VendorRedeemContent.tsx`

**Purpose:** Renders the redeem-tab description, search controls, filtered reward list, and empty state for the vendor detail screen.

**Used by:** `src/screens/VendorScreen/VendorScreen.tsx`

**Key props:**
- `description`: Supporting copy shown above the search controls.
- `rewards`: Vendor reward dataset used for filtering and card rendering.
- `treatUnitLabel`: Shared progress label passed into each vendor reward card.
- `onRewardAction`: Optional callback fired when a redeemable reward CTA is pressed.

**Notes:** Owns redeem-tab-local search, sort, and filter-modal state so the parent screen stays focused on route, vendor lookup, header wiring, and modal navigation.

## VendorCollectTreatContent

**Location:** `src/components/VendorCollectTreatContent/VendorCollectTreatContent.tsx`

**Purpose:** Renders the collect-tab description, search row, filter modal, category rail, filtered collect-item list, and empty state for the vendor detail screen.

**Used by:** `src/screens/VendorScreen/VendorScreen.tsx`

**Key props:**
- `description`: Supporting copy shown above the collect controls.
- `collectHeadingLabel`: Accessible label fragment used for the collect section heading.
- `collectPanelSubtitle`: Supporting subtitle shown in the black collect-panel header.
- `categories`: Available collect categories rendered as horizontally scrollable chips.
- `items`: Vendor collect-item dataset filtered by category and search text.

**Notes:** Encapsulates collect-tab-local category, search, and sort/filter modal behavior while preserving the exported panel layout and horizontal category scrolling treatment.

## VendorCardLayout

**Location:** `src/components/VendorCardLayout/VendorCardLayout.tsx`

**Purpose:** Provides the shared branded vendor-card shell used by treat and receipt cards, including the logo pane, diagonal cut, outer frame, full-card tap target, and CTA button.

**Used by:** `src/components/TreatCard/TreatCard.tsx`, `src/components/ReceiptSummaryCard/ReceiptSummaryCard.tsx`

**Key props:**
- `title`: Vendor title rendered in the card header.
- `logoSrc`: Vendor logo source rendered in the shared logo pane.
- `logoAlt`: Accessible alternative text for the logo.
- `actionLabel`: Primary CTA text shown in the shared footer button.
- `onAction`: Shared card interaction handler; both the full-card tap target and CTA button trigger this same action.
- `background`: Controls whether the shell renders on a black or white card surface.
- `progressPercent`: Optional progress percentage used to derive the border, shadow, and CTA accent color.
- `headerAdornment`: Optional right-aligned header content such as the TreatCard chevron.
- `children`: Dedicated card-body content supplied by treat or receipt content components.
- `className`: Optional shell-level styling overrides.

**Notes:** Centralizes frame styling and theme token derivation through `src/components/VendorCardLayout/cardTheme.ts`, so screens no longer duplicate the shared vendor-card silhouette across separate card implementations.

## TreatCardContent

**Location:** `src/components/TreatCardContent/TreatCardContent.tsx`

**Purpose:** Renders the treat-specific body content for vendor cards, including optional location metadata, shared progress UI, and optional expiry text.

**Used by:** `src/components/TreatCard/TreatCard.tsx`

**Key props:**
- `collectedCount`: Current collected treat count.
- `requiredCount`: Total count needed for the reward.
- `treatUnitLabel`: Label shown beside the progress metric.
- `background`: Card background surface used by the shared progress component.
- `progressPercent`: Optional precomputed progress value passed into `TreatProgress`.
- `expiryText`: Optional expiry warning copy.
- `locationText`: Optional distance/location copy.
- `locationIconSrc`: Optional icon displayed with the location row.
- `progressAriaLabel`: Accessible name for the progress bar.

**Notes:** Keeps treat-specific semantics separate from the shared `VendorCardLayout` frame.

## ReceiptCardContent

**Location:** `src/components/ReceiptCardContent/ReceiptCardContent.tsx`

**Purpose:** Renders the receipt-specific detail rows displayed inside the shared vendor-card shell.

**Used by:** `src/components/ReceiptSummaryCard/ReceiptSummaryCard.tsx`

**Key props:**
- `purchaseDate`: Receipt purchase date shown in the first row.
- `collectedCount`: Number of collected treat units associated with the purchase.
- `amountSpent`: Purchase total shown in the final row.
- `treatUnitLabel`: Shared treat-unit label used for the collected row.

**Notes:** Pairs with `VendorCardLayout` so the receipts flow can reuse the shared shell without inheriting treat-progress-specific UI.

## TreatProgress

**Location:** `src/components/TreatProgress/TreatProgress.tsx`

**Purpose:** Renders the shared treat-progress metric and progress bar used across treat and reward cards on both dark and light surfaces.

**Used by:** `src/components/TreatCardContent/TreatCardContent.tsx`, `src/components/VendorRewardCard/VendorRewardCard.tsx`

**Key props:**
- `currentCount`: Current collected progress amount.
- `requiredCount`: Maximum amount needed to complete the reward.
- `label`: Shared metric label shown beside the count.
- `background`: Switches between dark-surface and light-surface palettes.
- `progressPercent`: Optional explicit percentage used for shared color derivation and fill width.
- `ariaLabel`: Accessible name for the progress bar.
- `className`: Optional wrapper override for layout control.
- `metricsClassName`: Optional metric text override.
- `trackClassName`: Optional track sizing override.

**Notes:** Uses the shared card theme utility from `src/components/VendorCardLayout/cardTheme.ts` so progress colors stay aligned with the generic vendor-card layout.

## TreatCard

**Location:** `src/components/TreatCard/TreatCard.tsx`

**Purpose:** Renders the reusable vendor treat card for Home and Treat Jar by combining the shared vendor-card shell with treat-specific body content.

**Used by:** `src/components/MyTreatsPane/MyTreatsPane.tsx`, `src/screens/TreatJarScreen/TreatJarScreen.tsx`

**Key props:**
- `vendorName`: Display name for the vendor shown on the card.
- `logoSrc`: Image source for the vendor logo.
- `logoAlt`: Accessible alternative text for the vendor logo.
- `collectedCount`: Current collected treat count.
- `requiredCount`: Total treats required for completion.
- `treatUnitLabel`: Label shown beside the progress count.
- `expiryText`: Optional supporting expiry copy.
- `actionLabel`: Primary action button text.
- `background`: Switches between dark and light card surfaces.
- `locationText`: Optional vendor distance copy.
- `locationIconSrc`: Optional icon asset displayed beside the distance copy.
- `onAction`: Optional shared card action; when provided, tapping the card body or CTA pill performs the same behavior.

**Notes:** Uses `VendorCardLayout` for the shared shell and `TreatCardContent` for the treat-specific body. Card border, shadow, and CTA colors are derived centrally from progress plus background instead of being passed from screens.

## ReceiptSummaryCard

**Location:** `src/components/ReceiptSummaryCard/ReceiptSummaryCard.tsx`

**Purpose:** Renders the reusable receipt summary card used in the receipts list flow by combining the shared vendor-card shell with receipt-specific body content.

**Used by:** `src/screens/ReceiptsListScreen/ReceiptsListScreen.tsx`

**Key props:**
- `vendorName`: Vendor title shown at the top of the card.
- `logoSrc`: Image source for the vendor logo.
- `logoAlt`: Accessible alternative text for the vendor logo.
- `purchaseDate`: Receipt date shown in the detail list.
- `collectedCount`: Number of collected treat units shown in the detail list.
- `amountSpent`: Purchase total shown in the detail list.
- `treatUnitLabel`: Shared treat-unit label used for the collected metric.
- `actionLabel`: CTA text shown in the footer button.
- `onAction`: Optional shared card action; when provided, tapping the card body or CTA pill performs the same behavior.

**Notes:** Uses `VendorCardLayout` for the shared shell and `ReceiptCardContent` for the receipt-specific details, avoiding duplicated vendor-card frame styling between treat and receipt flows.

## ActionModal

**Location:** `src/components/ActionModal/ActionModal.tsx`

**Purpose:** Provides a reusable modal shell with shared dismiss behavior, semantic dialog wiring, and configurable primary and secondary action buttons.

**Used by:** `src/components/ReceiptDetailModal/ReceiptDetailModal.tsx`, `src/components/RedeemTreatModal/RedeemTreatModal.tsx`

**Key props:**
- `title`: Accessible modal heading rendered in the shared header area.
- `children`: Modal body content rendered between the header and actions.
- `onClose`: Shared dismissal callback used by the backdrop, Escape key, and post-action close behavior.
- `primaryActionLabel`: Label shown on the primary action button.
- `onPrimaryAction`: Optional callback invoked before the modal closes from the primary action.
- `secondaryActionLabel`: Optional label shown on the secondary action button.
- `onSecondaryAction`: Optional callback invoked before the modal closes from the secondary action.
- `overlayClassName`, `cardClassName`, `headerClassName`, `titleClassName`, `bodyClassName`, `actionsClassName`: Styling hooks for modal-specific layout treatments.
- `primaryButtonClassName`, `secondaryButtonClassName`: Styling hooks for modal-specific button treatments.
- `primaryButtonVariant`, `secondaryButtonVariant`: Surface variants for the shared action buttons.
- `autoFocusPrimary`, `autoFocusSecondary`: Optional focus targets for the shared actions.

**Notes:** Centralizes dialog semantics, Escape handling, click-outside dismissal, and shared action wiring so receipt and redeem flows do not duplicate modal shell logic.

## ReceiptDetailModal

**Location:** `src/components/ReceiptDetailModal/ReceiptDetailModal.tsx`

**Purpose:** Renders the receipt-detail overlay used within the receipts list flow, including dismiss behavior, vendor metadata, and the semantic receipt items table.

**Used by:** `src/screens/ReceiptsListScreen/ReceiptsListScreen.tsx`

**Key props:**
- `receipt`: Selected receipt record displayed in the modal.
- `treatUnitColumnLabel`: Column header label for the treat-count column.
- `onClose`: Shared dismissal handler used by the backdrop, Escape key, and close button.

**Notes:** Uses `ActionModal` for the shared dialog shell plus a semantic `<table>` for the receipt line items, so the overlay keeps mobile modal behavior without duplicating shell logic.

## RedeemTreatModal

**Location:** `src/components/RedeemTreatModal/RedeemTreatModal.tsx`

**Purpose:** Renders the vendor reward redemption modal, including the instructional copy, placeholder QR treatment, and shared exit and done actions.

**Used by:** `src/screens/VendorScreen/VendorScreen.tsx`

**Key props:**
- `vendorName`: Vendor name interpolated into the redemption instructions.
- `rewardName`: Reward name shown in the instructional copy.
- `treatCost`: Required treat amount shown in the instructional copy.
- `treatUnitPlural`: Shared treat-unit label used in the cost sentence.
- `onClose`: Shared dismissal handler used by the backdrop and both action buttons.
- `onDone`: Optional callback invoked before dismissing through the done action.
- `onExit`: Optional callback invoked before dismissing through the exit action.

**Notes:** Uses `ActionModal` for the shared dialog shell, keeps the QR treatment backend-agnostic with a dummy code, and supports route-driven modal presentation from the vendor redeem flow.

## VendorRewardCard

**Location:** `src/components/VendorRewardCard/VendorRewardCard.tsx`

**Purpose:** Renders the vendor-detail redeem card shown on the white vendor screen for big-treat rewards.

**Used by:** `src/components/VendorRedeemContent/VendorRedeemContent.tsx`

**Key props:**
- `title`: Reward title shown in the colored header.
- `description`: Supporting reward description copy.
- `collectedCount`: Current collected progress amount.
- `requiredCount`: Total amount needed to redeem.
- `treatUnitLabel`: Shared progress label beside the count.
- `actionLabel`: Optional CTA label for redeemable rewards.
- `onAction`: Optional handler for the redeem CTA and full-card tap target when the reward is interactive.

**Notes:** Purpose-built for the vendor redeem tab while reusing `TreatProgress` plus the shared card theme utility from `src/components/VendorCardLayout/cardTheme.ts` for consistent color derivation. Redeemable rewards expose a full-card tap target so the visual CTA and card surface trigger the same modal flow.

## HelpTopicCard

**Location:** `src/components/HelpTopicCard/HelpTopicCard.tsx`

**Purpose:** Renders a reusable help topic block with a bullet marker, heading, supporting copy, optional detail content, and optional action row.

**Used by:** `src/screens/HelpSupportScreen/HelpSupportScreen.tsx`, `src/screens/InstallScreen/InstallScreen.tsx`

**Key props:**
- `title`: Topic heading shown beside the bullet marker.
- `description`: Supporting summary copy shown under the heading.
- `children`: Optional nested detail content such as ordered instructional steps.
- `action`: Optional action row content such as a CTA button or email link.

**Notes:** Keeps help-topic spacing and typography consistent while allowing each topic to supply its own detailed content and action treatment.

## OnPagePromptCard

**Location:** `src/components/OnPagePromptCard/OnPagePromptCard.tsx`

**Purpose:** Renders the reusable on-page prompt card shell used for post-scan warning and install-prompt flows, including the dark header bar, body content, and CTA row.

**Used by:** `src/screens/QrCodeScanPromptLoginScreen/QrCodeScanPromptLoginScreen.tsx`, `src/screens/QrCodeScanPromptInstallScreen/QrCodeScanPromptInstallScreen.tsx`

**Key props:**
- `title`: Prompt heading shown in the black header bar.
- `titleId`: Optional heading id used to connect the card section to its accessible label.
- `headerIconSrc`: Optional icon shown beside the heading.
- `headerIconAlt`: Optional accessible text for the header icon when it is not decorative.
- `children`: Prompt body copy or custom body content.
- `primaryActionLabel`: Label for the filled CTA button.
- `onPrimaryAction`: Optional handler for the filled CTA button.
- `secondaryActionLabel`: Optional label for the outline CTA button.
- `onSecondaryAction`: Optional handler for the outline CTA button.
- `cardClassName`: Optional class override for the outer card shell.
- `headerClassName`: Optional class override for the card header row.
- `iconClassName`: Optional class override for the header icon.
- `titleClassName`: Optional class override for the heading.
- `bodyClassName`: Optional class override for the body section.
- `actionsClassName`: Optional class override for the CTA row.
- `primaryButtonClassName`: Optional class override for the filled CTA button.
- `secondaryButtonClassName`: Optional class override for the outline CTA button.

**Notes:** Keeps the pseudo-modal prompt treatment synchronized across multiple screens without coupling the shared shell to any QR-specific copy or navigation logic, keeps the title centered, aligns the CTA buttons to the card edges, adds roomier body spacing, and allows the header icon to inherit the same color as the prompt heading when needed.

## QrCodeScanSuccessContent

**Location:** `src/components/QrCodeScanSuccessContent/QrCodeScanSuccessContent.tsx`

**Purpose:** Renders the shared post-scan success artwork, collected-count summary, and vendor attribution used across QR follow-up flows.

**Used by:** `src/screens/QrCodeScanPromptLoginScreen/QrCodeScanPromptLoginScreen.tsx`, `src/screens/QrCodeScanPromptInstallScreen/QrCodeScanPromptInstallScreen.tsx`

**Key props:**
- `collectedCount`: Treat amount collected from the scan.
- `vendorName`: Vendor name interpolated into the summary text.
- `countId`: Optional id applied to the count element for section labelling.
- `className`: Optional class override for the outer wrapper.
- `iconClassName`: Optional class override for the candy artwork.
- `countClassName`: Optional class override for the collected-count text.
- `summaryClassName`: Optional class override for the vendor summary copy.

**Notes:** Centralizes the treat-collected visual block so multiple QR result screens stay in sync and continue using shared brand copy.

## GreyDivider

**Location:** `src/components/GreyDivider/GreyDivider.tsx`

**Purpose:** Renders the shared flat grey divider line used between stacked content rows across collect and profile flows.

**Used by:** `src/components/VendorCollectTreatContent/VendorCollectTreatContent.tsx`, `src/screens/ProfileEmailLoginScreen/ProfileEmailLoginScreen.tsx`

**Key props:**
- `className`: Optional extra class name for width or spacing adjustments where the divider is placed.

**Notes:** Keeps the simple grey separator consistent anywhere the app needs the collect-treats style row divider without duplicating inline span markup or color tokens.

## ProfileIdentitySummary

**Location:** `src/components/ProfileIdentitySummary/ProfileIdentitySummary.tsx`

**Purpose:** Renders the reusable profile identity header used above editable profile-field screens and the email-auth profile overview.

**Used by:** `src/screens/ProfileDetailScreen/ProfileDetailScreen.tsx`, `src/screens/ProfileNicknameEditScreen/ProfileNicknameEditScreen.tsx`, `src/screens/ProfileEmailEditScreen/ProfileEmailEditScreen.tsx`, `src/screens/ProfilePasswordEditScreen/ProfilePasswordEditScreen.tsx`

**Key props:**
- `titleId`: Optional id applied to the rendered heading for section labelling.
- `name`: Profile nickname shown under the icon.
- `email`: Profile email shown under the nickname.
- `footerText`: Optional muted summary line shown above the divider.
- `badgeText`: Optional filled badge shown below the identity copy.
- `className`: Optional wrapper class name for layout overrides.

**Notes:** Keeps the profile icon, identity copy, optional provider badge, and faded divider treatment aligned across the main profile screens and editable profile-field screens.

## SidebarDrawer

**Location:** `src/components/SidebarDrawer/SidebarDrawer.tsx`

**Purpose:** Renders the home-screen navigation drawer overlay with brand header, profile summary, navigation items, and logout action.

**Used by:** `src/screens/HomeScreen/HomeScreen.tsx`

**Key props:**
- `appName`: Shared app-name copy shown in the drawer header.
- `brandIconSrc`: Brand mark shown at the top of the drawer.
- `userNickname`: Primary profile name shown in the profile row.
- `userEmail`: Secondary profile email shown in the profile row.
- `userIconSrc`: User avatar/icon asset for the profile row.
- `closeIconSrc`: Close icon asset for dismissing the drawer.
- `chevronIconSrc`: Chevron icon asset used in profile and menu rows.
- `logoutIconSrc`: Logout icon asset used in the footer action.
- `items`: Drawer navigation items with icon and label data.
- `onClose`: Handler used for the close button, scrim, and Escape key.
- `onItemSelect`: Optional callback fired when a profile or menu item is pressed.
- `onLogout`: Optional callback fired when the logout action is pressed.

**Notes:** Keeps the sidebar reusable and presentation-focused while the screen owns open/close state and mock navigation data.

## InstallScreen

**Location:** `src/screens/InstallScreen/InstallScreen.tsx`

**Purpose:** Renders the install guidance flow using the Help & Support visual language, including device-aware instructions and an optional automatic install action when the browser supports it.

**Used by:** `src/routes/AppRoutes.tsx`

**Key props:**
- None. The screen derives device state, install availability, and routed navigation internally.

**Notes:** Reuses `HelpTopicCard` for content blocks, detects Android vs iOS from browser/device heuristics, listens for browser install prompt availability through shared install utilities, and can auto-attempt the browser prompt when routed from the QR install follow-up flow. The top-level help cards now use ordered numeric markers to better reflect the intended install sequence.

## ProfileDetailScreen

**Location:** `src/screens/ProfileEmailLoginScreen/ProfileEmailLoginScreen.tsx`

**Purpose:** Renders the shared logged-in profile details screen for users authenticated through either email or Google sign-in, while showing the extra editable rows only for email-auth users.

**Used by:** `src/routes/AppRoutes.tsx`, `src/screens/HomeScreen/HomeScreen.tsx`

**Key props:**
- None. The screen derives the mock session, provider-specific detail rows, profile metrics, and optional return path from shared route and mock helpers.

**Notes:** Redirects home with history replacement when the user is logged out or authenticated through an unsupported provider, reuses shared brand copy for the header home action, swaps the former gradient row separators for the same shared flat grey divider used in collect-treat lists, always shows the joined-date summary, conditionally shows the Google sign-in badge and nickname-only details state for Google-auth users, routes email-auth users into the nickname, password, and email edit screens, and clears the mock session when the logout action is pressed.

## ProfileNicknameEditScreen

**Location:** `src/screens/ProfileNicknameEditScreen/ProfileNicknameEditScreen.tsx`

**Purpose:** Renders the shared profile nickname editing screen, including the shared identity summary, editable nickname field, and save action.

**Used by:** `src/routes/AppRoutes.tsx`, `src/screens/ProfileDetailScreen/ProfileDetailScreen.tsx`

**Key props:**
- None. The screen derives the mock session, current nickname, and return path from shared route and mock helpers.

**Notes:** Redirects home with history replacement when the user is logged out or authenticated through an unsupported provider, saves the new nickname into the shared mock profile store, supports returning to either the email-profile or Google-profile route, and returns to the active shared profile screen with history replacement so stale edit history is not preserved.

## ProfileEmailEditScreen

**Location:** `src/screens/ProfileEmailEditScreen/ProfileEmailEditScreen.tsx`

**Purpose:** Renders the email-auth profile email editing screen with current identity context, new-email confirmation, and save validation.

**Used by:** `src/routes/AppRoutes.tsx`, `src/screens/ProfileDetailScreen/ProfileDetailScreen.tsx`

**Key props:**
- None. The screen derives the mock session, current email, and return path from shared route and mock helpers.

**Notes:** Redirects home with history replacement when the user is logged out or authenticated through a non-email provider, requires the user to confirm the updated email address, saves into the shared mock profile store, and returns to the email-profile screen with history replacement after a successful save.

## ProfilePasswordEditScreen

**Location:** `src/screens/ProfilePasswordEditScreen/ProfilePasswordEditScreen.tsx`

**Purpose:** Renders the email-auth profile password editing screen with current-password verification, new-password confirmation, and save validation.

**Used by:** `src/routes/AppRoutes.tsx`, `src/screens/ProfileDetailScreen/ProfileDetailScreen.tsx`

**Key props:**
- None. The screen derives the mock session and return path from shared route and mock helpers.

**Notes:** Redirects home with history replacement when the user is logged out or authenticated through a non-email provider, validates the current password before allowing the change, confirms the new password, saves into the shared mock password store, and returns to the email-profile screen with history replacement after a successful save.

## QrCodeScanPromptLoginScreen

**Location:** `src/screens/QrCodeScanPromptLoginScreen/QrCodeScanPromptLoginScreen.tsx`

**Purpose:** Renders the treat-collected confirmation screen shown after the home claim flow, including the inline login-preservation prompt for logged-out users.

**Used by:** `src/routes/AppRoutes.tsx`

**Key props:**
- None. The screen derives scan-result, vendor, and mock-auth state from shared route and mock helpers.

**Notes:** Redirects home with history replacement when required scan state is missing, reuses shared brand copy, branches logged-in but not-yet-installed users into the install-prompt follow-up screen, and preserves the claim-flow context by forwarding login and sign-up redirects back into the same QR flow.

## QrCodeScanPromptInstallScreen

**Location:** `src/screens/QrCodeScanPromptInstallScreen/QrCodeScanPromptInstallScreen.tsx`

**Purpose:** Renders the treat-collected follow-up screen that encourages app installation after QR collection while reusing the shared success content and on-page prompt shell.

**Used by:** `src/routes/AppRoutes.tsx`, `src/screens/QrCodeScanPromptLoginScreen/QrCodeScanPromptLoginScreen.tsx`

**Key props:**
- None. The screen derives scan-result, vendor, auth state, install state, and device-specific guidance from shared route, mock, and utility helpers.

**Notes:** Redirects home with history replacement when required scan state is missing or the app is already installed, and uses the shared success block plus a shortened install-now prompt that routes into the full install screen where auto-install can be attempted.

## Mock user session helpers

**Location:** `src/mocks/user.ts`

**Purpose:** Stores mock sidebar profile data plus the prototype login-session, auth-provider, email-verification, and install-state flags used to toggle auth-dependent UI states across the app.

**Used by:** `src/main.tsx`, `src/screens/HomeScreen/HomeScreen.tsx`, `src/screens/InstallScreen/InstallScreen.tsx`, `src/screens/LoginScreen/LoginScreen.tsx`, `src/screens/ProfileDetailScreen/ProfileDetailScreen.tsx`, `src/screens/ProfileNicknameEditScreen/ProfileNicknameEditScreen.tsx`, `src/screens/ProfileEmailEditScreen/ProfileEmailEditScreen.tsx`, `src/screens/ProfilePasswordEditScreen/ProfilePasswordEditScreen.tsx`, `src/screens/SignUpScreen/SignUpScreen.tsx`, `src/screens/QrCodeScanPromptLoginScreen/QrCodeScanPromptLoginScreen.tsx`, `src/screens/QrCodeScanPromptInstallScreen/QrCodeScanPromptInstallScreen.tsx`, `src/utils/appInstallState.ts`

**Key exports:**
- `mockSidebarUser`: Shared mock profile copy displayed in the sidebar.
- `isMockUserLoggedIn()`: Returns whether the current prototype session is logged in.
- `getMockUserAuthProvider()`: Returns whether the prototype session authenticated by email, Google, or is logged out.
- `isMockUserEmailVerified()`: Returns whether the current mock account should be treated as email-verified.
- `isMockUserAppInstalled()`: Returns whether the prototype user has marked the app as installed.
- `setMockUserNickname()`: Updates the shared mock nickname used by profile-related screens.
- `setMockUserEmail()`: Updates the shared mock email used by profile-related screens.
- `doesMockUserPasswordMatch()`: Checks the supplied password against the current mock password.
- `setMockUserPassword()`: Updates the shared mock password used by the email-auth profile flows.
- `setMockUserAppInstalled()`: Updates the prototype installed-app flag.
- `logInMockUser(authProvider?)`: Marks the prototype session as logged in, records the selected auth provider, and auto-confirms Google-auth emails while leaving email-auth users pending verification.
- `logOutMockUser()`: Clears the prototype logged-in and email-verification state.

**Notes:** Keeps auth-style, verification-state, and install-state behavior inside the mock layer so screen-level login, profile, and verification variations can be reused without backend integration, including provider-specific profile routing from the sidebar.

## App install state utility

**Location:** `src/utils/appInstallState.ts`

**Purpose:** Centralizes the prototype app-installation check by combining standalone display-mode detection with the mock user install flag.

**Used by:** `src/screens/InstallScreen/InstallScreen.tsx`, `src/screens/QrCodeScanPromptLoginScreen/QrCodeScanPromptLoginScreen.tsx`, `src/screens/QrCodeScanPromptInstallScreen/QrCodeScanPromptInstallScreen.tsx`

**Key exports:**
- `isAppInstalledForCurrentUser()`: Returns whether the app should currently be treated as installed for this user and device.

**Notes:** Prevents install-flow branching logic from duplicating the same device-plus-mock-session checks across multiple screens.

## Device detection utility

**Location:** `src/utils/device.ts`

**Purpose:** Detects whether the current device is Android, iOS, or unknown and whether the app is already running in standalone installed mode.

**Used by:** `src/screens/InstallScreen/InstallScreen.tsx`

**Key exports:**
- `getDevicePlatform()`: Returns `'android'`, `'ios'`, or `'other'`.
- `isStandaloneApp()`: Returns whether the app is already opened as an installed standalone experience.

**Notes:** Uses `navigator.userAgentData` when available, falls back to user-agent heuristics, and includes the iPadOS Mac-touch fallback.

## Install prompt utility

**Location:** `src/utils/installPrompt.ts`

**Purpose:** Captures the deferred browser install prompt, exposes availability subscription, and triggers the prompt on demand.

**Used by:** `src/main.tsx`, `src/screens/InstallScreen/InstallScreen.tsx`

**Key exports:**
- `initializeInstallPromptCapture()`: Registers global install prompt listeners once.
- `subscribeInstallPromptAvailability()`: Notifies consumers when an automatic install prompt becomes available or disappears.
- `promptForInstall()`: Opens the deferred install prompt when supported and reports the user outcome.

**Notes:** Centralizes `beforeinstallprompt` and `appinstalled` handling so install-related behavior stays out of screen components.
