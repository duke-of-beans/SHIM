#!/usr/bin/env node

/**
 * SHIM CLI - Global Command Line Interface
 * 
 * Usage from ANY directory:
 *   shim analyze ./src
 *   shim analyze D:\GREGORE\src
 */

const path = require('path');
const { runSelfEvolution } = require('../dist/activate');

const args = process.argv.slice(2);
const command = args[0] || 'analyze';
const targetDir = args[1] || process.cwd();

async function main() {
  console.log('🚀 SHIM - Session Handling & Intelligent Management\n');

  if (command === 'analyze' || command === 'evolve') {
    const resolvedPath = path.resolve(targetDir);
    await runSelfEvolution(resolvedPath);
  } else {
    console.log('Usage:');
    console.log('  shim analyze <directory>');
    console.log('  shim evolve <directory>');
  }
}

main().catch(console.error);
