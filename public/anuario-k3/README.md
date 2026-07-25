# Assets del Anuario K3 (carga manual)

Coloca aquí las fotos y audios reales. La plantilla ya apunta a estas rutas.

## Estructura recomendada

```
public/anuario-k3/
├── hero/
│   ├── portada.jpg          # Portada / sello postal
│   └── fondo-nubes.jpg      # Opcional
├── carta/
│   └── narracion.mp3        # Audio de la carta del Comando Estelar
├── maestras/
│   ├── miss-vale.jpg
│   └── miss-paty.jpg
├── generacion/
│   └── foto-grupal.jpg
└── alumnos/
    └── amaia/
        ├── primer-dia.jpg
        ├── dia-final.jpg
        ├── avatar.jpg
        └── frase.mp3
```

## Cómo conectar una foto

1. Copia el archivo en la carpeta correspondiente.
2. En `app/anuariok3asbaje/experiencia/data.ts`, revisa que la ruta coincida
   (ej. `/anuario-k3/alumnos/amaia/primer-dia.jpg`).
3. Recarga la página. Si el archivo no existe, se muestra un placeholder ilustrado.

## Consejos

- Usa JPG/WebP, idealmente ≤ 1600px de lado.
- Audios en MP3 o AAC.
- Nombres de carpeta = `slug` del alumno (minúsculas, sin acentos).
