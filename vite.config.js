
import react from '@vitejs/plugin-react'  
import { defineConfig } from 'vite'  
import base44 from '@base44/vite-plugin'      
export default defineConfig({  
  logLevel: 'error',  
  plugins: [  
    base44({  
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',  
      hmrNotifier: false,  
      navigationNotifier: false,  
      analyticsTracker: false,  
      visualEditAgent: false  
    }),  
    react(),  
  ]  
});  
