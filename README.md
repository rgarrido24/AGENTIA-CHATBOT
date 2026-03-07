# Agentia - Demo Barber (copia en E:)

Proyecto recuperado en **E:\AGENTIA-CHATBOT-LIMPIO**. Incluye la demo de barberías con glassmorphism, animaciones y checkout seguro.

## Cómo arrancar

1. Abre esta carpeta en Cursor (o en terminal):
   ```
   E:\AGENTIA-CHATBOT-LIMPIO
   ```

2. Crea el archivo de variables de entorno:
   - Copia `.env.local.example` a `.env.local`
   - Pon tu API key de Gemini (obtén una en https://aistudio.google.com/apikey):
   ```
   GEMINI_API_KEY=tu_api_key_aqui
   ```

3. Instala y ejecuta:
   ```bash
   npm install
   npx next dev -p 3010
   ```

4. Abre en el navegador: **http://localhost:3010/demo-barber**

## Contenido

- **Demo barber:** chat tipo WhatsApp + calendario, estilo iPhone 16 Pro, Dynamic Island, checkout seguro.
- **API:** `/api/chat-demo` usa Gemini para agendar citas.
- **Ruta principal:** `/` enlaza a la demo.

Si tenías el proyecto en GitHub/GitLab, puedes clonar de nuevo desde ahí para tener también el dashboard y el resto de rutas.
