#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Start Next.js development server without custom server
const nextDev = spawn('npx', ['next', 'dev', '--port', '3000'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
  process.exit(1);
});

nextDev.on('close', (code) => {
  console.log(`Next.js dev server exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
  process.exit(0);
});