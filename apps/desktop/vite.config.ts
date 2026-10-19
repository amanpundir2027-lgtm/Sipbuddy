import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({plugins:[react(),tailwindcss()],base:'./',publicDir:fileURLToPath(new URL('../../assets',import.meta.url)),server:{port:5174,strictPort:true},build:{outDir:'dist'}});
