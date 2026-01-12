#!/usr/bin/env node

/**
 * esbuild configuration for SHIM MCP Server
 * 
 * Bundles TypeScript + all dependencies into single optimized file
 * Handles ESM/CommonJS interop, external dependencies, and module resolution
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node18',
  format: 'esm',
  sourcemap: true,
  
  // External dependencies (not bundled)
  external: [
    '@modelcontextprotocol/sdk',
    'zod',
  ],
  
  // Resolve paths
  absWorkingDir: __dirname,
  
  // Handle TypeScript
  loader: {
    '.ts': 'ts',
  },
  
  // Minification for production
  minify: false, // Keep readable for debugging
  
  // Tree shaking
  treeShaking: true,
  
  // Banner for ESM compatibility
  banner: {
    js: '// SHIM MCP Server - Bundled with esbuild',
  },
  
  logLevel: 'info',
};

if (isWatch) {
  // Watch mode
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('👁️  Watching for changes...');
} else {
  // One-time build
  try {
    await esbuild.build(config);
    console.log('✅ Build complete');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}
