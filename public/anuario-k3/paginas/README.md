# Láminas del anuario (PDF Canva → JPG)

- Fuente: PDF Canva 792×612 (55 páginas)
- Convertidas con Poppler a JPG (~96 DPI, quality 80)
- Mapeo: `app/anuariok3asbaje/experiencia/pdfManifest.ts`

Cada niño tiene láminas `bitacora` / `recuerdos` / `comando` enlazadas por `slug`.
Las secciones compartidas viven en `#laminas` de `/anuariok3asbaje/experiencia`.

Para regenerar:

```powershell
# requiere pdftoppm (Poppler)
pdftoppm -jpeg -r 96 -jpegopt "quality=80" "Anuario.pdf" pagina
```
