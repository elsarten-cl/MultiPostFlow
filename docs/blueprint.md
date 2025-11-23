# **App Name**: MultiPostFlow

## Core Features:

- Draft Creation and Media Upload: Carga de texto, Selección de plataformas: Facebook, Instagram, WordPress, Subida de imágenes o videos a Firebase Storage, Previsualización de borradores
- AI-Powered Content Generation: La IA adapta el estilo según la plataforma: Facebook → narrativo, emocional, storytelling, Instagram → corto, visual, directo, WordPress → largo, editorializado y estructurado
- Cross-Platform Scheduling: Programación para Facebook, Instagram y WordPress. Integración con Make.com mediante Watch Documents y Firestore Sync
- Firestore Integration: Firestore almacena en tiempo real: Usuarios, Borradores, Estados, URLs procesadas, Logs de automatización
- Automated Post Processing (Make.com): Mejora visual de imágenes con Nanobanana, Subida de media mejorada a Storage, Cambio automático de estados: borrador → aprobado → publicado, Registro detallado en Google Sheets, Publicación final en redes sociales conectadas
- Webhook-Based Status Updates: Firebase Cloud Functions recibe desde Make: Estado final: publicado, pendiente o error, URLs publicadas, Mensajes de error (si corresponde) La app refleja el estado real en su panel en tiempo real.

## Style Guidelines:

- Azul corporativo: #4D7ACB (encabezados, botones principales, íconos activos, enlaces)
- Negro: #000000 (textos, títulos, íconos sólidos)
- Blanco: #FFFFFF (fondos, tarjetas, inputs)
- Naranja: #F86B00 (acciones críticas, confirmaciones, estados clave, alertas positivas)
- Fuente Principal: Inter Headers: Inter Bold / Semibold, Párrafos: Inter Regular, Botones: Inter Medium
- Fuente de Código: Source Code Pro Configuración Firebase, Bloques API (Make, Meta, WordPress)
- Contenedores: fondo blanco, bordes suaves, sombra ligera, espaciado amplio
- Fondo general del Dashboard: #F4F6FA
- Iconografía: estilo minimalista geométrico, uso en negro o blanco según fondo, plataformas en monocromo con acento azul
- Primario (CTA) Fondo: #4D7ACB, Texto: blanco, Hover: #3C69B5, Focus: borde #F86B00
- Secundario Fondo blanco, Borde azul, Texto azul
- Crítico (publicar, aprobar, actualizar) Fondo: #F86B00, Texto: blanco, Hover: #D65F00
- Fondo: blanco, Borde: gris suave #E0E0E0, Focus: borde azul #4D7ACB
- Animaciones suaves de 150–250ms Aplicadas a hovers, dropdowns, tabs, loaders
- Pendiente → #4D7ACB
- En proceso → #A1C0F5
- Enviado a Make → #F86B00
- Publicado → #29C76F
- Error → #DA2C38