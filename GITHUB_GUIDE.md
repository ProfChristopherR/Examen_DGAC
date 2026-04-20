# Guía para Subir el Proyecto a GitHub Pages

Este proyecto de Next.js ha sido refactorizado y configurado para exportarse de manera **completamente estática** (Single Page Application sin backend) para que sea compatible con GitHub Pages.

## Pasos para Publicarlo en Internet

Sigue estos pasos cuidadosamente:

### 1. Preparar EmailJS (Para el envío de correos)
Como GitHub Pages no tiene servidor, el envío del correo se hace desde el navegador usando el servicio externo **EmailJS**.
1. Crea una cuenta gratuita en [EmailJS](https://www.emailjs.com/)
2. Ve a **Email Services** y entra a `Add New Service` (puedes usar Gmail o cualquier otro proveedor).
3. Copia el **Service ID**.
4. Ve a **Email Templates** y crea uno nuevo. Asegúrate de que el template tenga las variables `{{user_name}}`, `{{user_email}}`, `{{grade}}` y de forma muy importante `{{{message}}}` (con tres llaves para que respete los saltos de línea).
5. Copia el **Template ID**.
6. Ve a tu cuenta (`Account`) y copia el **Public Key**.
7. **Modifica tu código:** Abre el archivo `app/quiz/evaluation/page.tsx` en la **línea 149** y pon tus propios IDs reemplazando los placeholders (`YOUR_SERVICE_ID`, `YOUR_TEMPLATE_ID`, `YOUR_PUBLIC_KEY`).

### 2. Subir a GitHub
1. Abre tu terminal o línea de comandos dentro del directorio del proyecto (`Examen DGAC/nextjs_space`).
2. Ejecuta los siguientes comandos si aún no has inicializado git:
```bash
git init
git add .
git commit -m "Initial commit for RPAS exam"
```
3. Ve a GitHub y crea un **Nuevo Repositorio** (completamente vacío, sin README u otras cosas).
4. Copia las líneas que te da GitHub bajo el título *"...or push an existing repository from the command line"* y pégalas en tu consola (serán algo así como `git remote add origin ...` y `git push -u origin main`).

### 3. Configurar GitHub Actions y Pages
El proyecto tiene un archivo de configuración listo (`.github/workflows/nextjs.yml`) que hará que todo se compile mágicamente.

1. En tu repositorio dentro de GitHub, ve a la pestaña **Settings**.
2. En la barra lateral izquierda, baja hasta la sección **Pages**.
3. En la sección *Build and deployment*, donde dice **Source**, selecciona **GitHub Actions**.
4. ¡Y listo! Al hacer esto, GitHub Actions empezará a construir tu sitio de Next.js en la pestaña **Actions**. Cuando termine (toma un par de minutos), te dará el link verde donde la página ya estará montada y pública para tus estudiantes.
