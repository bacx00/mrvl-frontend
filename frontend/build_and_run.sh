#!/bin/bash

# Build and run script for frontend
echo "Building React app..."
npm run build

echo "Build complete! Files are in the build/ directory"
echo "To serve the build locally, run: npx serve -s build"