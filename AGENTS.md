# Site development rules

- Keep styling clean, adaptable, and CSS driven. Use CSS for layout, responsive behavior, colors, typography, and visual effects.
- Edit the existing component rules instead of appending overriding patches. Consolidate superseded declarations during each change.
- Keep styles in `dist/styles.css`, markup in `dist/index.html`, and interaction logic in `dist/app.js`.
- Use shared CSS custom properties for recurring colors, typography, radii, and glass effects. Scope selectors to components; avoid broad selectors that couple unrelated UI.
- Use JavaScript only for interaction state and behavior. Toggle classes, data attributes, or accessibility attributes; do not assign inline visual styles. For continuous pointer tracking and native-scroll progress only, JavaScript may supply coordinate custom properties; CSS must still own geometry, appearance, and transitions.
- Preserve desktop and mobile behavior, keyboard focus, and reduced-motion support when editing styles.
- Keep this buildless site simple; do not introduce a framework or styling dependency for ordinary UI changes.
- Current workflow is local preview with automatic reload at http://localhost:8765 via `preview.py`. Do not publish local iterations unless the user asks.

- Write all visible copy as finished product language. Never expose development labels such as "sample", "placeholder", "demo", or "pending" to visitors. Identify mock data in source comments instead. Describe unavailable features honestly; do not imply signups, tickets, or playback work before they are connected.

- Design 1.2 explicitly uses Three.js for the user-requested 3D bullet and curling paper tear. Keep that renderer isolated in dist/bullet.js, load it only for this variant, and keep page layout and UI transitions in CSS.
