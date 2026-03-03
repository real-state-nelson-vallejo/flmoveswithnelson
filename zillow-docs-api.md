# Investigación de viabilidad: Integración con Zillow API

Este documento detalla los hallazgos relativos a la viabilidad técnica y legal de integrar la API de Zillow (y Bridge Interactive) en la plataforma **flmoveswithnelson**, con el objetivo de importar propiedades, enriquecer datos y mostrar el inventario de propiedades.

## 1. Resumen Ejecutivo
**La integración directa para extraer un catálogo masivo de propiedades listadas para su almacenamiento en `flmoveswithnelson` NO es viable** bajo los términos de servicio actuales de Zillow. Zillow ya no provee una API pública abierta para listados de bienes raíces de forma indiscriminada. El acceso a los datos de listados de propiedades (MLS - Multiple Listing Service) se realiza ahora a través de **Bridge Interactive** (una compañía de Zillow Group), lo cual requiere membresía, acuerdos de licencia y aprobación directa por parte de las entidades MLS correspondientes.

Sin embargo, **sí es viable utilizar ciertas APIs de Zillow para "Data Enrichment"** (enriquecimiento de datos), como obtener estimaciones de valor (Zestimates), datos históricos o métricas del mercado para propiedades individuales, siempre y cuando estas llamadas se realicen dinámicamente y respetando los límites de uso.

## 2. Acceso a Datos y APIs (Bridge Interactive)

Zillow Group distribuye sus datos a través de la plataforma Bridge API. Los conjuntos de datos disponibles incluyen:

- **Public Records API:** Registros públicos de propiedades, evaluaciones de impuestos y datos de transacciones de ~148 millones de propiedades en EE. UU.
- **Zestimates API:** Estimaciones de valor de la propiedad y valor de alquiler actuales (Zestimate y Rent Zestimate).
- **Zillow Group Economic Data:** Métricas interactivas del mercado de la vivienda.

### Obtención de "Listings" (Propiedades en Venta/Alquiler)
Para acceder a listados activos de propiedades a través de Bridge API, no basta con crear una cuenta de desarrollador. **Es un requisito estricto tener la aprobación de una asociación MLS**. Los desarrolladores deben solicitar feeds de datos específicos de su MLS local a través de la plataforma Bridge Platform. Si tú o tu cliente no pertenecen a un MLS o no tienen un broker local que les apruebe el acceso a los datos del MLS, no podrán extraer listados de Zillow.

## 3. Limitaciones Técnicas y de Términos de Servicio (TOS)

Incluso en el caso de obtener acceso a través de Bridge API o tener un feed aprobado, existen fuertes restricciones legales y técnicas:

1. **Prohibición de Almacenamiento Local (Caching/Scraping):** 
   Los términos y condiciones de Zillow prohíben estrictamente almacenar (salvo cachés efímeras muy cortas), descargar o raspar los datos de Zillow. Su API está diseñada para **recuperar y mostrar contenido dinámicamente**. Escalar un sistema que guarde las propiedades de Zillow en la base de datos de tu plataforma viola sus términos.
   
2. **Límites de Visualización:**
   Normalmente, no se permite mostrar más de 20 propiedades individuales a la vez a cualquier usuario por página web.
   
3. **Límites de Peticiones (Rate Limits):**
   Para los conjuntos de datos como "Zestimates" o "Public Records", se otorga típicamente un máximo de **1,000 llamadas por día por conjunto de datos**, tras un proceso de revisión de la aplicación por parte del equipo de Zillow.

4. **Atribución Requerida:**
   Cualquier dato mostrado que provenga de la API de Zillow debe tener una atribución clara (ej. "Data Provided by Zillow Group"), enlaces directos a Zillow, e incluir los logos pertinentes.

## 4. Respuestas a los Objetivos Específicos

### Objetivo A: Mostrar las propiedades disponibles en la plataforma actual
**Viabilidad:** Alta, **Condicionada a un acuerdo MLS.**
Si se cuenta con credenciales aprobadas por un MLS local a través de Bridge Interactive, se pueden consumir los endpoints y mostrar los listados en la web dinámicamente. Sin embargo, no se pueden robar propiedades genéricas de Zillow de todo el país sin dichos acuerdos. 

### Objetivo B: Escalar el sistema de agregar propiedades / generar flujos por zonas
**Viabilidad:** Baja / Inviable según los TOS.
La idea de usar Zillow para poblar el inventario de la base de datos de la plataforma por zonas o ciudades está estrictamente prohibida. Zillow no permite crear "clones" o competir usando sus datos de listado centralizados, ni permite guardar sus datos en bases de datos de terceros.

### Objetivo C: Enrich Data (Enriquecimiento de datos)
**Viabilidad:** Media-Alta.
Esta es la ruta más viable. Si `flmoveswithnelson` tiene sus propias propiedades adquiridas legítimamente (o ingresadas manualmente por un agente), se puede utilizar la API de Zillow (Zestimates y Public Records) para consultar dinámicamente bajo demanda detalles adicionales, valor estimado actual, y registros de impuestos de esa propiedad mediante su dirección, enriqueciendo la vista de detalle de la propiedad para el usuario final. (Sujeto al límite de 1,000 llamadas diarias).

## 5. Recomendaciones de Siguientes Pasos

1. **Clarificar Licencias MLS:** Determinar si el cliente/agente inmobiliario de `flmoveswithnelson` es miembro de un MLS en Florida y tiene derecho a un feed IDX/RETS o Web API. Si es así, la integración debe hacerse gestionando el acceso con su MLS a través de la Bridge Platform, no "scrapeando" Zillow.
2. **Uso de APIs Alternativas:** Si el objetivo es poblar propiedades sin una conexión MLS formal, se debe evaluar el uso de agregadores de APIs de terceros en marketplaces como RapidAPI, aunque estos habitualmente también tienen problemas de escalabilidad y operan en zonas grises de scraping.
3. **Enfoque en "Enrichment":** Modificar el enfoque del proyecto para que la ingesta de propiedades sea propia del sistema (o vía importaciones controladas de CSVs/feeds autorizados), limitando el uso de Zillow API estrictamente para mostrar una pestaña de "Análisis de Mercado de Zillow" (Zestimate y evolución gráfica) de propiedades individuales al vuelo, sin guardar ese dato en la base de datos.
