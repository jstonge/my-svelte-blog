# Scrolly Story 1: Side-by-Side Layout

A scrollytelling example with interactive chart transitions.

## Structure

```
scrolly-story-1/
├── components/
│   ├── Index.svelte      # Main story component with layout
│   └── ScrollyPlot.svelte # Responsive D3 chart with transitions
└── data/
    ├── copy.json         # Story text content
    └── boys-1980.json    # Chart data
```

## Features

### Layout
- **Desktop**: Text on left (max-width: 400px), sticky chart on right (40% width)
- **Mobile/Tablet**: Stacked layout, full-width chart
- Uses full viewport width via CSS calc trick

### Chart Interactions
- **Step 0**: Shuffled bar chart (deterministic)
- **Step 1**: Sorted bar chart
- **Step 2**: Sorted lollipop chart

### Technical Details
- Responsive chart using `bind:clientWidth`
- Smooth transitions with GPU acceleration (`translateZ(0)`)
- D3.js for scales and axes
- Svelte 5 runes: `$state`, `$derived`, `$props`

## Usage

Access at: `/scrolly-story-1`

Edit content in `data/copy.json`:
```json
{
  "title": "Story Title",
  "subtitle": "Subtitle",
  "steps": [
    { "type": "markdown", "value": "Step content..." }
  ],
  "conclusion": [
    { "type": "markdown", "value": "Conclusion..." }
  ]
}
```
