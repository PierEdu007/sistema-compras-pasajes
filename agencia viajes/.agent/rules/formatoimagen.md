---
trigger: always_on
---

Las imágenes suelen ser la causa principal de una web lenta. Antes de subir nada:

Formato Moderno: Convierte tus imágenes (JPG/PNG) a WebP. Este formato ofrece la misma calidad con un peso 30-50% menor.

Dimensiones Exactas: No subas una imagen de 4000px de ancho si solo se mostrará a 800px. Redimensiona al tamaño máximo necesario.

Compresión: Pasa todas las imágenes por herramientas como TinyPNG o Squoosh antes de subirlas.

Lazy Loading: Asegúrate de que tus etiquetas img tengan el atributo loading="lazy". Esto difiere la carga de las imágenes que no están visibles en la pantalla inicial.