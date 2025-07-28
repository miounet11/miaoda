#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the user data directory
const userDataPath = process.env.APPDATA || 
  (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.local/share");
const pluginsPath = path.join(userDataPath, 'miaoda-chat', 'plugins');

// Ensure plugins directory exists
if (!fs.existsSync(pluginsPath)) {
  fs.mkdirSync(pluginsPath, { recursive: true });
}

// Copy example plugins
const examplePluginsPath = path.join(__dirname, '..', 'example-plugins');
const plugins = fs.readdirSync(examplePluginsPath);

for (const plugin of plugins) {
  const sourcePath = path.join(examplePluginsPath, plugin);
  const destPath = path.join(pluginsPath, plugin);
  
  if (fs.statSync(sourcePath).isDirectory()) {
    // Copy plugin directory
    copyDirectory(sourcePath, destPath);
    console.log(`Installed plugin: ${plugin}`);
  }
}

console.log(`\nPlugins installed to: ${pluginsPath}`);
console.log('Restart MiaoDa Chat to load the plugins.');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}