# Fair Play Card Manager

A single-page web application for managing and assigning Fair Play household responsibility cards. This app helps couples or partners organize and track household responsibilities using the Fair Play method.

> **Note**: This application is automatically deployed to GitHub Pages via GitHub Actions on every push to the `main` branch.

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

- **Node.js**: v16 or higher (v20 recommended)
- **npm**: Comes with Node.js, or use yarn/pnpm

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fair-play
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including Vue 3, Pinia, Vite, and TypeScript.

### 3. Start the Development Server

```bash
npm run dev
```

The development server will start and the app will be available at `http://localhost:5173` (or the port shown in the terminal output).

The dev server includes:
- **Hot Module Replacement (HMR)**: Changes to your code will automatically reload in the browser
- **TypeScript compilation**: Type checking and compilation on the fly
- **Fast refresh**: Vue components update without losing state

### 4. Build for Production

To create a production build:

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle and minify assets
- Output everything to the `dist/` directory
- Copy `public/` files (like `robots.txt`) to the output

### 5. Preview Production Build

To test the production build locally:

```bash
npm run preview
```

This serves the `dist/` directory locally so you can verify the production build works correctly.

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

### GitHub Pages (Automated)

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

#### Initial Setup

1. **Enable GitHub Pages** in your repository:
   - Go to your repository on GitHub
   - Navigate to **Settings → Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

The workflow (`.github/workflows/deploy.yml`) will:
- Automatically build the project
- Detect the correct base path (user/organization pages vs project pages)
- Deploy to GitHub Pages
- Run on every push to `main` branch

Your site will be available at:
- **User/Organization pages**: `https://<username>.github.io/`
- **Project pages**: `https://<username>.github.io/<repository-name>/`

#### Manual Deployment (Alternative)

If you prefer to deploy manually:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` directory** to your hosting service of choice

### Other Static Hosting Services

This project can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist/` folder or connect your Git repository
- **Vercel**: Connect your repository and deploy
- **Cloudflare Pages**: Connect your repository and deploy
- **Any web server**: Upload the contents of `dist/` to your web server

**Note**: For project pages on GitHub Pages or other services that use subdirectories, the base path is automatically configured in the GitHub Actions workflow. For manual deployments, you may need to set the `GITHUB_PAGES_BASE` environment variable or update `vite.config.ts` directly.

## Development

### Development Workflow

1. **Make changes** to files in `src/`
2. **See changes instantly** in the browser (HMR will reload automatically)
3. **Check the terminal** for TypeScript errors or build warnings
4. **Test your changes** in the browser

### TypeScript

The project uses TypeScript for type safety. Type definitions are in `src/types/index.ts`.

- Type errors will show in the terminal and browser console
- Use `tsconfig.json` to configure TypeScript settings
- All `.ts` and `.vue` files are type-checked

### Project Structure

- **Components** (`src/components/`): Vue single-file components (`.vue`)
- **Composables** (`src/composables/`): Reusable Vue composition functions
- **Stores** (`src/stores/`): Pinia stores for global state management
- **Utils** (`src/utils/`): Utility functions (database, storage, etc.)
- **Types** (`src/types/`): TypeScript type definitions
- **Styles** (`src/styles/`): Global CSS styles
- **Data** (`src/data/`): Static data files (card definitions)

### Adding New Features

1. Create new Vue components in `src/components/` (use `.vue` single-file components)
2. Add types to `src/types/index.ts` if needed
3. Create composables in `src/composables/` for reusable logic
4. Add Pinia stores in `src/stores/` for state management
5. Integrate components into `src/App.vue`
6. Update styles in `src/styles/main.css`

### Code Style

- Use TypeScript for all new files
- Follow Vue 3 Composition API patterns
- Use Pinia for state management
- Keep components focused and reusable
- Add types for all function parameters and return values

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

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

This is a personal project, but suggestions and improvements are welcome!
