# Guía Maestra de Despliegue, GitHub y Venta — AMIGABLE

Este documento consolidado sirve como tu manual maestro para llevar AMIGABLE al mercado, subir actualizaciones a GitHub, gestionar licencias y respaldar tu operación hora por hora.

---

## 1. Subir tu Proyecto a GitHub (Paso a Paso)
Si quieres empaquetar todo para subirlo a un repositorio público o privado en GitHub:
1. Abre tu terminal en `C:\00 Projects\AMIGABLE`.
2. Inicializa git (si no está hecho):
   ```bash
   git init
   git add .
   git commit -m "feat: AMIGABLE v1.0 - Sistema Simon y PWA local-first"
   ```
3. Conéctate a tu repositorio remoto:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/amigable.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Cómo Ejecutar el Demo Localmente
Para probar la PWA tal como la verá un cliente potencial:
```bash
python -m http.server 8736 --directory docs
```
Luego abre en tu navegador: `http://localhost:8736`

---

## 3. Protocolo de Respaldo por Hora (Backups)
* Todos los archivos generados quedan respaldados localmente en `backups/` y en la memoria de AionUi (`memory/`).
* Para crear un nuevo snapshot de respaldo manual, simplemente guarda una copia de tus archivos modificados en la carpeta `backups/` con fecha y hora actual.
