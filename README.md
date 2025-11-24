# ArchBridge - Enterprise Work Item Synchronization Platform

ArchBridge is a modular work item synchronization platform that connects enterprise systems like Ardoq and Azure DevOps. It provides a streamlined workflow for syncing hierarchical work items (Epics, Features, and User Stories) between different enterprise tools.

## Overview

ArchBridge enables organizations to synchronize work items across different enterprise platforms, maintaining data consistency and reducing manual effort. The platform currently supports:

- **Source System**: Ardoq (Enterprise Architecture Management)
- **Target System**: Azure DevOps (Work Item Management)

## Features

### 🔄 Workflow-Based Synchronization

- Step-by-step guided workflow for syncing work items
- Source and target system selection
- Connection testing and validation
- Hierarchical work item selection (Epics → Features → User Stories)

### 📊 Hierarchy Management

- Visual hierarchy viewer for Epics, Features, and User Stories
- Bulk selection with cascading deselection:
  - Deselecting an Epic automatically deselects all its Features and User Stories
  - Deselecting a Feature automatically deselects all its User Stories
- All items selected by default for easy bulk operations
- Expandable/collapsible tree view

### ⚙️ Configuration Management

- Multiple Ardoq configuration support
- Connection testing and validation
- Active configuration management
- Secure credential storage

### 🎨 Modern UI

- Built with shadcn-ui components
- Responsive design
- Dark mode support
- Intuitive user experience

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <YOUR_GIT_URL>
cd ArchBridge-SyncFlow
```

1. Install dependencies:

```bash
npm install
```

1. Start the development server:

```bash
npm run dev
```

1. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```text
src/
├── components/          # React components
│   ├── ardoq/          # Ardoq-specific components
│   ├── ui/             # shadcn-ui components
│   └── ...             # Other shared components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API clients
├── pages/              # Page components
└── types/              # TypeScript type definitions
```

## Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn-ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation

## Workflow Steps

1. **Select Source System**: Choose Ardoq as your source system
2. **Connect to Source**: Configure and test Ardoq connection
3. **Select Target System**: Choose Azure DevOps as your target
4. **Connect to Target**: Configure Azure DevOps connection
5. **Select Work Items**: Browse and select Epics, Features, and User Stories
6. **Sync**: Execute the synchronization process

## Configuration

### Ardoq Configuration

Before syncing, you need to configure your Ardoq connection:

1. Navigate to **Configurations** → **Ardoq Configuration**
2. Add a new configuration with:
   - Configuration name
   - API host
   - API token
   - Organization label
3. Test the connection
4. Activate the configuration

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Style

This project uses ESLint for code quality. Make sure to run `npm run lint` before committing changes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues, questions, or feature requests, please contact the development team.

---

**ArchBridge** © 2025 - Extensible Work Item Synchronization Platform
