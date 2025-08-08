# Clean Bracket Visualization Component

A professional, clean bracket visualization component inspired by VLR.gg with SVG connectors and comprehensive tournament format support.

## Features

- **Clean Design**: Minimalist, professional esports-style appearance
- **SVG Connectors**: Visual lines connecting winning teams to next rounds
- **Multiple Formats**: Support for single elimination, double elimination, and Swiss system
- **Responsive**: Mobile-friendly with touch gestures and proper scaling
- **Zoom Controls**: Built-in zoom functionality with keyboard shortcuts
- **Live Indicators**: Real-time match status with visual indicators
- **Admin Controls**: Score editing and match management for administrators
- **Dark Mode**: Full dark mode support with proper contrast
- **Accessibility**: High contrast mode and screen reader support

## Components

### BracketVisualizationClean

Main bracket visualization component that automatically handles different tournament formats.

```jsx
import BracketVisualizationClean from './components/BracketVisualizationClean';

<BracketVisualizationClean
  bracket={bracketData}
  event={{ id: eventId, name: eventName }}
  navigateTo={navigateFunction}
  isAdmin={userIsAdmin}
  onMatchUpdate={handleMatchUpdate}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `bracket` | Object | Yes | Bracket data with matches and structure |
| `event` | Object | Yes | Event information with id and name |
| `navigateTo` | Function | No | Navigation handler for links |
| `isAdmin` | Boolean | No | Enable admin controls for match editing |
| `onMatchUpdate` | Function | No | Handler for match score updates |

## Bracket Data Format

### Single Elimination

```json
{
  "format": "single_elimination",
  "event_name": "Tournament Name",
  "bracket": [
    {
      "name": "Quarter-Finals",
      "matches": [
        {
          "id": 1,
          "match_number": 1,
          "team1": {
            "id": 1,
            "name": "Team Name",
            "logo": "/path/to/logo.png"
          },
          "team2": {
            "id": 2,
            "name": "Team Name 2",
            "logo": "/path/to/logo2.png"
          },
          "team1_score": 2,
          "team2_score": 1,
          "status": "completed",
          "format": "BO3",
          "scheduled_at": "2025-01-15T18:00:00Z"
        }
      ]
    }
  ]
}
```

### Double Elimination

```json
{
  "format": "double_elimination",
  "event_name": "Tournament Name",
  "upper_bracket": [...],
  "lower_bracket": [...],
  "grand_final": {
    "id": 5,
    "team1": null,
    "team2": null,
    "status": "upcoming",
    "format": "BO7"
  }
}
```

### Swiss System

```json
{
  "format": "swiss",
  "event_name": "Tournament Name",
  "standings": [
    {
      "team_id": 1,
      "team_name": "Team Name",
      "team_logo": "/path/to/logo.png",
      "wins": 3,
      "losses": 0,
      "points": 9
    }
  ],
  "rounds": {
    "1": [...matches],
    "2": [...matches]
  }
}
```

## Match Statuses

- `upcoming`: Match not yet started
- `live`: Match currently in progress
- `completed`: Match finished with scores

## Styling

The component comes with comprehensive CSS styles in `bracket-clean.css`:

- **Responsive**: Mobile-first design with tablet and desktop layouts
- **Dark Mode**: Automatic dark mode support
- **High Contrast**: Accessibility features for better visibility
- **Print Styles**: Optimized for printing brackets

## Keyboard Shortcuts

- `+` or `=`: Zoom in
- `-`: Zoom out  
- `0`: Reset zoom to 100%
- `f`: Toggle fullscreen (if supported)

## Admin Features

When `isAdmin={true}`:

- **Score Editing**: Click "Update Score" to edit match results
- **Real-time Updates**: Changes sync immediately with backend
- **Validation**: Prevents tied scores and invalid inputs

## Mobile Support

- **Touch Gestures**: Swipe to navigate, pinch to zoom
- **Responsive Layout**: Optimized for small screens
- **Performance**: Efficient rendering for mobile devices

## Integration with SimpleBracket

The component integrates seamlessly with the existing SimpleBracket component:

```jsx
// SimpleBracket.js automatically uses BracketVisualizationClean
// for desktop and tablet views while keeping mobile-specific components
```

## Customization

### Colors and Theming

Modify CSS custom properties to match your theme:

```css
:root {
  --bracket-border-color: #e5e7eb;
  --bracket-bg-color: #ffffff;
  --bracket-text-color: #374151;
  --bracket-winner-color: #10b981;
  --bracket-live-color: #ef4444;
}
```

### Match Spacing

Adjust match spacing in the component:

```jsx
const matchSpacing = 80 * Math.pow(2, Math.max(0, roundIndex - 1));
```

### Connector Lines

SVG connectors are automatically generated but can be customized:

```jsx
// Modify BracketConnectors component for custom line styles
```

## Performance

- **Lazy Loading**: Only renders visible matches
- **Efficient Updates**: Uses React state optimization
- **SVG Optimization**: Minimal DOM elements for connectors
- **Memory Management**: Proper cleanup of event handlers

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

Use the `BracketDemo` component to test different formats and features:

```jsx
import BracketDemo from './components/BracketDemo';

// Renders interactive demo with all bracket formats
<BracketDemo />
```

## API Integration

The component expects match updates through the `onMatchUpdate` callback:

```jsx
const handleMatchUpdate = async (matchId, updates) => {
  try {
    await api.put(`/matches/${matchId}`, updates);
    // Component will re-render with new data
  } catch (error) {
    console.error('Failed to update match:', error);
  }
};
```

## Troubleshooting

### Common Issues

1. **Missing Connectors**: Ensure bracket data has proper round structure
2. **Mobile Performance**: Check for large team logos or excessive matches
3. **Dark Mode**: Verify CSS variables are properly defined
4. **Admin Controls**: Confirm user permissions and API endpoints

### Debug Mode

Enable debug logging:

```jsx
<BracketVisualizationClean
  bracket={bracket}
  debug={true} // Enables console logging
  // ... other props
/>
```

## Contributing

When contributing to the bracket visualization:

1. Test all three format types
2. Verify mobile responsiveness
3. Check dark mode appearance
4. Validate accessibility features
5. Test admin functionality

## Dependencies

- React 16.8+ (hooks support)
- Tailwind CSS (for styling)
- Modern browser with SVG support