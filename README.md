# Trimind V-Next

[![CI Status](https://github.com/USERNAME/trimind-v-next/workflows/CI%20-%20Trimind%20V-Next/badge.svg)](https://github.com/USERNAME/trimind-v-next/actions)

Enterprise-grade Next.js application built with TypeScript, enforcing a "Zero Errors" policy through automated CI/CD.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4
- **Code Quality:** ESLint + Prettier
- **CI/CD:** GitHub Actions

## Quality Standards

This project enforces Google-level quality standards:

- ✅ **Zero Errors Policy** - All code must pass linting, formatting, and type checks
- ✅ **Strict TypeScript** - No `any` types, all variables must be typed
- ✅ **Consistent Formatting** - Prettier enforces code style automatically
- ✅ **Security First** - Automated security audits on every commit
- ✅ **Build Validation** - Every push must build successfully

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Create optimized production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted correctly
npm run type-check   # Run TypeScript type checking

# Testing
npm run test         # Run test suite
```

## Project Structure

```
trimind-v-next/
├── app/                 # Next.js App Router pages and layouts
├── .github/
│   └── workflows/
│       └── ci.yml      # CI/CD pipeline configuration
├── public/             # Static assets
├── .eslintrc.mjs       # ESLint configuration
├── .prettierrc         # Prettier configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies and scripts
```

## CI/CD Pipeline

The GitHub Actions pipeline runs on every push and pull request:

1. **Install Dependencies** - `npm ci` for reproducible builds
2. **Linting** - ESLint with strict rules
3. **Format Check** - Prettier validation
4. **Type Check** - TypeScript compilation without emit
5. **Security Audit** - Check for critical vulnerabilities
6. **Build** - Production build verification
7. **Tests** - Full test suite execution

All steps must pass for the pipeline to succeed.

## Development Guidelines

### Before Committing

Always run the quality checks locally:

```bash
npm run lint
npm run format:check
npm run type-check
npm run build
```

### Code Style

- Use functional components with TypeScript
- Follow naming conventions: PascalCase for components, camelCase for functions
- Add JSDoc comments for complex functions
- Avoid `console.log` in production code (use `console.warn` or `console.error` when necessary)

## License

Private project - All rights reserved
