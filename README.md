# Fair Play Card Manager

A single-page web application for managing and assigning Fair Play household responsibility cards. This app helps couples or partners organize and track household responsibilities using the Fair Play method.

## Features

- **Card Management**: View and manage all Fair Play cards with definitions, planning, execution, and minimum standard of care information
- **Assignment Tracking**: Assign cards to Player 1, Player 2, or mark as Shared
- **Custom Player Names**: Personalize player names to match your household
- **Notes**: Add custom notes to any card for additional context
- **Trimmed Cards**: Mark cards as "trimmed" to remove them from your active deck
- **Search & Filter**: Search cards by name or content, filter by category or assignment status
- **Export/Import**: Export your data as JSON for backup or import to restore
- **Offline Support**: Works offline after initial load - all data stored locally
- **Mobile-First Design**: Responsive design optimized for mobile devices

## Technology Stack

- **Vue 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe JavaScript
- **Pinia**: State management for Vue
- **Vite**: Fast build tool and development server
- **IndexedDB**: Client-side database for card data (via `idb` library)
- **localStorage**: Client-side storage for player names and preferences

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager

## Setup Instructions

1. **Clone the repository** (or download the project):

   ```bash
   git clone <repository-url>
   cd fair-play
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173` (or the port shown in the terminal).

## Build Commands

- **Development**: `npm run dev` - Start development server with hot module replacement
- **Build**: `npm run build` - Build the production-ready static site to `dist/` directory
- **Preview**: `npm run preview` - Preview the built site locally

## Project Structure

```
fair-play/
├── dist/                 # Build output (generated)
├── src/
│   ├── components/       # Vue single-file components (.vue)
│   ├── composables/      # Vue composables for reusable logic
│   ├── stores/           # Pinia stores for state management
│   ├── data/            # Card definitions JSON
│   ├── styles/          # CSS stylesheets
│   ├── types/           # TypeScript type definitions
│   ├── utils/            # Utility functions (storage, database, data loading)
│   ├── App.vue          # Main application component
│   └── main.ts          # Application entry point
├── index.html           # HTML entry point
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── README.md           # This file
```

## Data Storage

All data is stored locally in your browser:

- **Player Names**: Stored in `localStorage`
- **Card Assignments, Notes, Trimmed Status**: Stored in `IndexedDB`

No data is sent to any server - everything remains private on your device.

## Deployment

### GitHub Pages Deployment

This project is designed to be deployed as a static site to GitHub Pages. Here's how:

#### Option 1: Manual Deployment

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Push the `dist/` directory to the `gh-pages` branch**:

   ```bash
   # Install gh-pages if needed
   npm install --save-dev gh-pages

   # Add deploy script to package.json
   # "deploy": "gh-pages -d dist"

   # Deploy
   npm run deploy
   ```

3. **Configure GitHub Pages**:
   - Go to your repository Settings → Pages
   - Select the `gh-pages` branch as the source
   - Save and wait for GitHub to build your site
   - Your site will be available at `https://<username>.github.io/<repository-name>/`

#### Option 2: Automated Deployment (Recommended)

See the [GitHub Actions Workflow](#github-actions-workflow) section below for automated deployment.

#### Important Notes for GitHub Pages

- **Base Path**: If your repository name is not the root URL, you may need to set a base path in `vite.config.ts`:

  ```typescript
  export default defineConfig({
    base: "/your-repo-name/",
    // ... rest of config
  });
  ```

- **404 Handling**: GitHub Pages doesn't support client-side routing by default. Since this is a single-page app, you may want to add a `404.html` that redirects to `index.html`:
  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Fair Play Card Manager</title>
      <script>
        sessionStorage.redirect = location.href;
        location.replace(
          location.pathname.split("/").slice(0, -1).join("/") + "/index.html"
        );
      </script>
    </head>
    <body></body>
  </html>
  ```

### Other Static Hosting Services

This project can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist/` folder or connect your Git repository
- **Vercel**: Connect your repository and deploy
- **Cloudflare Pages**: Connect your repository and deploy
- **Any web server**: Upload the contents of `dist/` to your web server

## Development

### TypeScript

The project uses TypeScript for type safety. Type definitions are in `src/types/index.ts`.

### Adding New Features

1. Create new Vue components in `src/components/` (use `.vue` single-file components)
2. Add types to `src/types/index.ts` if needed
3. Create composables in `src/composables/` for reusable logic
4. Add Pinia stores in `src/stores/` for state management
5. Integrate components into `src/App.vue`
6. Update styles in `src/styles/main.css`

### Data Structure

Card definitions are loaded from `src/data/definitions.json`. The structure includes:

- Card name
- Definition (categories)
- Planning section
- Execution section
- Minimum Standard of Care
- Minimum Standard of Care Question

## Browser Support

- Modern browsers with ES6+ support
- IndexedDB support required
- localStorage support required

Tested on:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Testing Checklist

Before deploying, verify the following:

### Build Verification

- [x] All assets (HTML, JS, CSS) are included in `dist/` directory
- [x] Build completes without errors
- [x] Preview server serves the built site correctly

### Offline Functionality (9.7)

- [ ] Load the app in a browser
- [ ] Open browser DevTools → Network tab → Check "Offline"
- [ ] Verify the app still functions (all assets are cached)
- [ ] Verify cards can be viewed and edited offline

### Storage Functionality (9.8)

- [ ] Verify player names are saved to localStorage
- [ ] Verify card assignments are saved to IndexedDB
- [ ] Verify card notes are saved to IndexedDB
- [ ] Verify trimmed card status is saved to IndexedDB
- [ ] Refresh the page and verify all data persists

### Export/Import (9.9)

- [ ] Export data and verify JSON file is downloaded
- [ ] Verify exported JSON contains all expected data
- [ ] Import the exported JSON file
- [ ] Verify all data is restored correctly
- [ ] Test importing invalid JSON (should show error)

### Mobile/Responsive Design (9.10)

- [ ] Test on mobile device or mobile emulator
- [ ] Verify touch targets are at least 44x44px
- [ ] Verify responsive layout works on different screen sizes
- [ ] Verify filters are collapsible on mobile
- [ ] Verify cards are readable and interactive on mobile

## License

MIT

## Contributing

This is a personal project, but suggestions and improvements are welcome!
