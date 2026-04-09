# Advance Bionics - Hub de Fidelización (V2.1)

Esta es una aplicación web premium diseñada para pacientes de Advance Bionics, enfocada en el cuidado del dispositivo, el seguimiento de garantías y la asistencia inteligente.

## Características Principales

- **Melody AI Assistant**: Un asistente inteligente integrado con Google Gemini que conoce los flujos oficiales de RMA y Garantías de Advance Bionics.
- **Seguimiento de Garantía**: Visualización en tiempo real de los días restantes de cobertura.
- **Sistema de Beneficios Progresivos**: Niveles de fidelidad (Bronze, Gold, Platinum) con recompensas exclusivas.
- **Onboarding Personalizado**: Guía inicial para nuevos usuarios.
- **Sincronización Simulada**: Conectividad visual con Salesforce Health Cloud.

## Tecnologías Utilizadas

- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism), ES6 JavaScript.
- **AI**: Integración con Google Gemini 2.0 Flash API.
- **Icons**: Lucide Icons.

## Instalación y Uso

1. Clona este repositorio o descarga los archivos.
2. Abre el archivo `index.html` utilizando un servidor local (ej. Live Server en VS Code o `npx serve .`).
   - **Nota**: El uso de un servidor local es **obligatorio** para que la conexión con la API de Google Gemini no sea bloqueada por políticas de CORS.
3. Asegúrate de tener una conexión a internet activa para conectar con Melody.

## Estructura del Proyecto

- `index.html`: Estructura principal y navegación.
- `styles.css`: Sistema de diseño "Medical Care" y animaciones.
- `app.js`: Lógica de la aplicación, memoria del chat e integración de la API.

---
*Desarrollado para Advance Bionics.*
