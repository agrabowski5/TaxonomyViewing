# Two-Pane Taxonomy Comparison Interface

## Summary of Changes

Successfully redesigned the Taxonomy Explorer to feature **two switchable panes** instead of the previous 2x2 grid layout. Users can now independently select which taxonomy to display in each pane for detailed comparison and cross-referencing.

---

## Key Features Implemented

### 1. **Switchable Panes (Left & Right)**
- Each pane has a dropdown selector to choose from 4 taxonomies:
  - **HS** - Harmonized System 2022
  - **CN** - Combined Nomenclature (EU) 2022
  - **NAICS** - North American Industry Classification 2022
  - **CPC** - Central Product Classification Ver. 2.1

### 2. **Independent Taxonomy Selection**
- Left pane defaults to **HS**
- Right pane defaults to **CPC**
- Users can swap any taxonomy into either pane
- Each pane maintains its own tree state and scroll position

### 3. **Pane-Specific Information**
Each pane displays:
- **Taxonomy selector dropdown** - switch between taxonomies instantly
- **Full taxonomy name** - e.g., "Harmonized System 2022"
- **Hierarchical legend** - explains the structure (Sections → Chapters → Headings, etc.)
- **Expandable tree view** - with color-coded sections
- **Search functionality** - searches across both panes simultaneously

### 4. **Cross-Taxonomy Comparison Panel**
- **Sticky panel** at the bottom of the screen
- Shows selected codes from both panes side-by-side
- Displays when you select a node in either pane
- Includes:
  - Taxonomy label and code for each selected item
  - Full description text
  - Color-coded indicators

### 5. **Color Coding Preserved**
- Section-based color scheme carried over from previous design
- 22 distinct vibrant colors for visual hierarchy
- All children inherit parent section colors
- Helps users understand category relationships

### 6. **Responsive Design**
- **Desktop (>1200px)**: Two columns side-by-side (full width)
- **Tablet (768-1200px)**: Stacked vertically
- **Mobile (<768px)**: Full-width single-pane view with stacking

---

## Technical Implementation

### Updated Files

**[App.tsx](app/src/App.tsx)** - Major refactor:
- Replaced 4 separate tree refs with a pane-based state system
- Added `TaxonomyType` type for taxonomy selection
- `TAXONOMY_INFO` object maintaining config for each taxonomy
- Helper functions: `getTreeRef()`, `getTreeData()`, `getLookup()`, `getColorMap()`
- New handlers: `handlePaneSelect()`, `handleNodeSelect()`
- Two `<TaxonomyTree>` components inside `.pane-wrapper` containers
- Comparison panel showing selected codes from both panes

**[App.css](app/src/App.css)** - Complete layout overhaul:
- Changed from `.main-content` (2x2 grid) to `.main-content.two-pane` (2 columns)
- `.pane-wrapper` styling for left and right panes
- `.pane-header` with dropdown selectors
- `.pane-info` section showing taxonomy details
- `.taxonomy-selector` dropdown styling
- `.comparison-panel` at bottom with selected code display
- Responsive breakpoints for different screen sizes

**[DetailPanel.tsx](app/src/DetailPanel.tsx)** - JSX structure fix:
- Fixed fragment closing: removed mismatched `</>` tags
- Proper nesting of conditional concordance mappings

---

## How to Use

### Select Taxonomies
1. Click the **dropdown in each pane header** (left and right)
2. Choose from HS, CN, NAICS, or CPC
3. Trees update instantly

### Compare Codes
1. Click a code in the **left pane** (e.g., HS section)
2. Click a code in the **right pane** (e.g., CPC section)
3. View both selected codes in the **comparison panel** at the bottom

### Search
- Use the **search bar** at the top to search across both panes simultaneously
- Results highlight in both trees
- Search term applies to whichever taxonomies are currently displayed

### Navigate  
- **Click section names** to expand/collapse branches
- **Breadcrumb navigation** shows position in hierarchy
- **Color coding** helps identify which section a code belongs to

---

## Layout Examples

### Desktop View
```
┌─────────────────────────────────────────────────────────┐
│ Taxonomy Explorer | Search Bar                          │
├──────────────────┬──────────────────────────────────────┤
│ LEFT PANE        │ RIGHT PANE                           │
│ Dropdown: HS     │ Dropdown: CPC                        │
│ HS Full Name     │ CPC Full Name                        │
│ Legend: Sec...   │ Legend: Sec...                       │
│                  │                                      │
│ [Tree View]      │ [Tree View]                          │
│                  │                                      │
│                  │                                      │
├──────────────────┴──────────────────────────────────────┤
│ Comparison Panel (bottom):                             │
│ [HS Code] ↔ [CPC Code]                                 │
└──────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌────────────────────────────────┐
│ Taxonomy Explorer              │
├────────────────────────────────┤
│ LEFT PANE (Dropdown: HS)        │
│ [Tree View]                    │
├────────────────────────────────┤
│ RIGHT PANE (Dropdown: CPC)      │
│ [Tree View]                    │
├────────────────────────────────┤
│ Comparison Panel               │
│ HS Code ↔ CPC Code            │
└────────────────────────────────┘
```

---

## Developer Notes

### State Management
- Pane state uses React hooks: `useState` for left/right pane JSON
- Each pane tracks: `taxonomy` (current type), `selectedNode` (selected code)
- Tree refs maintained separately per taxonomy for proper state preservation

### Performance Optimizations
- `useMemo` hooks for color map generation (recalculate only when data/taxonomy changes)
- Lazy loading of tree nodes via react-arborist
- Efficient search matching across both panes

### Future Enhancement Possibilities
1. **Export comparison** - Download selected codes as CSV/JSON
2. **Bookmarks** - Save favorite code pairs
3. **Full concordance mapping** - Show all HS↔CPC relationships live
4. **History** - Recently viewed code pairs
5. **Custom splitter** - Drag to resize panes
6. **Keyboard navigation** - Arrow keys to navigate trees

---

## Testing Notes

✅ **Two-pane layout** renders correctly on desktop and mobile  
✅ **Dropdown selectors** change taxonomies instantly  
✅ **Tree rendering** works with all 4 taxonomies  
✅ **Color coding** applies consistently  
✅ **Search** highlights in both panes  
✅ **Comparison panel** shows selected codes  
✅ **Responsive design** adapts to screen size  
✅ **No TypeScript errors**  
✅ **Clean development console output**  

---

**Live:** http://localhost:5173/TaxonomyViewing/  
**Status:** ✅ Ready for use and deployment
