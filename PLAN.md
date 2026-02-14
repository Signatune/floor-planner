# Floor Planner Web App — Implementation Plan

## Overview

A browser-based floor plan editor where users can:

- Draw rectangular rooms and snap/join them together
- Create custom furniture pieces, save them to a library, and place copies on the plan
- Save and load entire floor plans (localStorage to start)

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React 18 + TypeScript** | Component model fits UI panels + canvas well |
| Canvas | **HTML5 Canvas via custom hooks** | Direct pixel control for drawing/dragging; no heavy lib needed at this scale |
| State | **Zustand** | Lightweight, works naturally with canvas render loops |
| Build | **Vite** | Fast dev server, zero-config for React + TS |
| Styling | **CSS Modules** | Scoped styles, no extra runtime |
| Persistence | **localStorage** (JSON serialization) | No backend needed for MVP |
| Testing | **Vitest + React Testing Library** | Vitest integrates seamlessly with Vite |

## Data Model

```ts
// Core types

interface Point { x: number; y: number }

interface Room {
  id: string
  label: string
  x: number          // top-left, in world coords (px)
  y: number
  width: number
  height: number
  color: string       // fill color / floor material color
}

interface FurnitureTemplate {
  id: string
  name: string
  width: number
  height: number
  color: string
  shape: 'rect'       // extensible later to 'circle' | 'L-shape' etc.
}

interface PlacedFurniture {
  id: string
  templateId: string
  x: number
  y: number
  rotation: number    // degrees, 0/90/180/270 for MVP
}

interface FloorPlan {
  id: string
  name: string
  rooms: Room[]
  furnitureLibrary: FurnitureTemplate[]
  placedFurniture: PlacedFurniture[]
  gridSize: number    // snap grid in px (default 20)
}
```

## Architecture / Component Tree

```
<App>
├── <Toolbar>                 # Top bar: file ops (New / Save / Load), plan name
├── <Sidebar>                 # Left panel, mode-dependent
│   ├── <RoomPanel>           # When "Rooms" tab active — list rooms, add room btn
│   └── <FurniturePanel>      # When "Furniture" tab active
│       ├── library list      #   saved templates
│       └── "Create new" btn  #   opens FurnitureEditor modal
├── <Canvas>                  # Center — the main floor plan canvas
│   ├── grid drawing
│   ├── room rendering
│   ├── furniture rendering
│   └── interaction layer     #   select, drag, resize, rotate
├── <PropertiesPanel>         # Right panel — edit selected item's props
└── <FurnitureEditorModal>    # Modal to create/edit a furniture template
```

## Implementation Phases

### Phase 1 — Project Scaffolding

- [ ] `npm create vite@latest` with React + TypeScript template
- [ ] Install dependencies: `zustand`
- [ ] Set up folder structure:
  ```
  src/
    components/      # React components
    hooks/           # Custom hooks (useCanvas, useDrag, etc.)
    store/           # Zustand store slices
    types/           # TypeScript type definitions
    utils/           # Geometry helpers, id generation, serialization
    styles/          # Global styles + CSS modules
  ```
- [ ] Basic `<App>` shell with placeholder panels
- [ ] Vitest config + one smoke test

### Phase 2 — Canvas & Grid

- [ ] `<Canvas>` component wrapping an HTML5 `<canvas>` element
- [ ] `useCanvas` hook — manages canvas ref, context, resize observer, DPR scaling
- [ ] Render a configurable snap grid (default 20 px)
- [ ] Pan (middle-click drag or Space+drag) and zoom (scroll wheel)
- [ ] World-to-screen / screen-to-world coordinate transforms

### Phase 3 — Rooms

- [ ] Zustand `roomSlice`: CRUD for rooms
- [ ] "Add Room" button → enters draw mode
- [ ] Click-and-drag on canvas to draw a rectangle, snapped to grid
- [ ] Render rooms with fill color, border, and label
- [ ] Select a room (click) → show selection handles
- [ ] Drag to move, drag handles to resize (all snapped)
- [ ] Snap/join: when a room edge is within threshold of another room's edge, snap flush (shared wall)
- [ ] Properties panel: edit label, dimensions (numeric input), color picker
- [ ] Delete room (keyboard Delete or button)

### Phase 4 — Furniture Library & Templates

- [ ] Zustand `furnitureSlice`: CRUD for templates + placed instances
- [ ] `<FurnitureEditorModal>`: form to set name, width, height, color
- [ ] Save template → appears in sidebar library list
- [ ] Edit / delete template from library

### Phase 5 — Placing & Manipulating Furniture

- [ ] Drag a template from sidebar onto canvas → creates a `PlacedFurniture`
- [ ] Render placed furniture on canvas (on top of rooms)
- [ ] Select → drag to move (snapped to grid)
- [ ] Rotate: R key or button cycles 0°/90°/180°/270°
- [ ] Properties panel for placed furniture: position, rotation, which template
- [ ] Delete placed furniture
- [ ] Containment hint: highlight red if furniture is outside all rooms

### Phase 6 — Save / Load

- [ ] Serialize `FloorPlan` state to JSON
- [ ] Save to `localStorage` under a plan name/id
- [ ] Load plan list, load selected plan, "New Plan" action
- [ ] Auto-save on changes (debounced)
- [ ] Export plan as PNG (canvas `toDataURL`)

### Phase 7 — Polish & UX

- [ ] Undo/Redo (zustand-middleware or manual history stack)
- [ ] Keyboard shortcuts legend (? key)
- [ ] Tooltips on toolbar buttons
- [ ] Responsive layout (collapse sidebar on narrow screens)
- [ ] Empty state illustrations / onboarding hints
- [ ] Accessibility: focus management, aria labels on panels

## Key Interaction Details

### Snap-to-grid
All positions and sizes round to the nearest `gridSize`. Helper:
```ts
const snap = (value: number, grid: number) => Math.round(value / grid) * grid
```

### Room joining
When moving/resizing a room, check proximity of each edge to edges of other rooms. If within `gridSize / 2`, snap the edge flush. Visually, shared walls render as a single line (no double border).

### Canvas rendering order
1. Grid
2. Rooms (filled rectangles + borders + labels)
3. Placed furniture
4. Selection handles / guides
5. In-progress drawing ghost (while creating a room or placing furniture)

### Coordinate system
- **World coordinates**: origin at (0,0), 1 unit = 1 px at zoom 1.0
- **Screen coordinates**: offset by pan and scaled by zoom
- All model values stored in world coords

## Future Extensions (Out of Scope for MVP)

- Non-rectangular rooms (L-shapes, polygons)
- Walls as independent line segments with thickness
- Doors and windows
- Measurement labels / dimension lines
- Multi-floor support
- Cloud save (backend API)
- Collaboration (WebSocket)
- Import reference image (blueprint scan)
