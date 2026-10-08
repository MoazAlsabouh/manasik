import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // هذه الحيلة تسحب المفتاح بدون كلمة VITE وتمرره للتطبيق
    'import.meta.env.VITE_AI_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
  }
})
