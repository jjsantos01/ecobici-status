# Ecobici Status - CDMX

Consulta la página en: http://gh.jjsantoso.com/ecobici-status/

Monitorea en tiempo real el estado de las estaciones de Ecobici en la Ciudad de México.
Este proyecto consume el sistema de datos abiertos de Ecobici para mostrar:
- **Bicicletas reportadas** (num_bikes_disabled)
- **Bicicletas disponibles** (num_bikes_available)
- **Porcentaje de bicicletas reportadas**
- **Viajes en curso** (estimado)
- Listado de datos por alcaldía y por colonia

Además, se enriquece la información con un archivo CSV que contiene información extra (alcaldía y colonia) para cada estación Ecobici.

## Archivos Principales

1. **index.html**
   Interfaz principal y estructura básica de la aplicación.

2. **styles.css**
   Hoja de estilo principal para la UI, incluyendo la paleta de colores y la disposición de tarjetas/tablas.

3. **app.js**
   Lógica de la aplicación en JavaScript:
   - Descarga y parseo de datos desde las APIs de Ecobici y el archivo CSV.
   - Cálculo de estadísticas generales y agrupadas.
   - Renderizado de la interfaz (tarjetas y tablas).

4. **cicloestaciones_ecobici_YYYYMMDD.csv**
   Archivo CSV que contiene información adicional de las estaciones (alcaldía, colonia), con la columna `num_cicloe` que se usa para enlazar datos con la API.

## Requisitos

- **Conexión a Internet**. La aplicación consulta las APIs de Ecobici para traer datos en tiempo real.
- **Archivo CSV**. Debe estar en la misma carpeta de la aplicación y con **codificación UTF-8** (importante para evitar caracteres extraños en nombres de colonias, etc.).
- **Servidor local** (recomendado). Aunque puedes abrir `index.html` directamente en el navegador, algunos navegadores podrían bloquear ciertas peticiones de archivos locales.

## Cómo Ejecutar

1. **Clona o descarga** este repositorio.
2. Ubica todos los archivos (index.html, app.js, styles.css y el CSV) en la misma carpeta.
3. **Abre una terminal** en la carpeta donde están estos archivos.
4. **Inicia el servidor local, por ejemplo, usando Python**:
     ```
     python -m http.server 8000
     ```
    Esto inicia un servidor en el puerto 8000.
5. **Abre** tu navegador y entra a `http://localhost:8000/`.
La aplicación cargará y mostrará las estadísticas.
- Presiona “Actualizar” para forzar una recarga manual.
- Espera 2 minutos para la recarga automática.

## Licencia

  Este proyecto se ofrece como libre uso para fines educativos y de consulta. Los datos consumidos provienen directamente de Ecobici.

## Sitio renderizado
![](/images/ecobici-estatus.png)
