# developteca-web

Frontend de **Developteca**, un blog de desarrollo de software. SPA en Angular 21 que consume la [API en Spring Boot](../../api/developteca-api).

## Stack

- **Angular 21** — componentes *standalone*, sin NgModules
- **Signals** para el estado, en lugar de `BehaviorSubject`
- **Zoneless change detection** (`provideZonelessChangeDetection`) — sin `zone.js`
- **Lazy loading** de rutas con `loadComponent`
- **SCSS** con *design tokens* como custom properties de CSS
- **marked + highlight.js** para renderizar Markdown con resaltado de sintaxis

## Funcionalidades

**Público**
- Listado de artículos paginado, con búsqueda con *debounce* y filtro por categoría
- Detalle del artículo con Markdown renderizado y resaltado de código
- Comentarios anidados de profundidad arbitraria
- Calificación de 1 a 5 estrellas

**Administración** (protegido con guard por rol)
- Panel con métricas
- Gestión de artículos: listado con todos los estados, crear, editar, eliminar
- Gestión de imágenes por artículo, con imagen destacada
- Moderación de comentarios en línea (ocultar y restaurar)

## Ejecución con Docker (recomendado)

El `docker-compose.yml` que levanta todo el proyecto (este frontend, la API, PostgreSQL y Mailpit) vive en el [repositorio de la API](https://github.com/shomou/developteca-api), y construye este repo como hermano. La estructura esperada es:

```
developteca/
├── api/developteca-api    <- github.com/shomou/developteca-api (contiene el compose)
└── web/developteca-web    <- este repositorio
```

```bash
mkdir -p developteca/api developteca/web && cd developteca
git clone https://github.com/shomou/developteca-api.git api/developteca-api
git clone https://github.com/shomou/developteca-web.git web/developteca-web
cd api/developteca-api && cp .env.example .env    # edita los valores
docker compose up -d --build
```

Disponible en http://localhost:4200. No necesitas Node instalado.

La imagen es *multi-stage*: Node y `node_modules` se usan solo para compilar; la imagen final es nginx sirviendo los estáticos (~95 MB frente a ~400 MB). La configuración de nginx incluye `try_files ... /index.html`, necesario para que el enrutamiento del lado del cliente sobreviva a una recarga en rutas profundas.

## Desarrollo local

Requiere Node 20+ y la API corriendo en `http://localhost:8080`.

```bash
npm install
npm start
```

Disponible en http://localhost:4200 con recarga en caliente.

```bash
npm run build     # compila a dist/developteca-web/browser
npm test          # pruebas unitarias
```

## Estructura

```
src/app/
├── core/          servicios, guards, interceptores y modelos
├── shared/        componentes reutilizables y el pipe de Markdown
└── features/
    ├── public/    home, listado y detalle de artículos
    ├── auth/      login
    └── admin/     dashboard, gestión de artículos e imágenes
```

## Notas de implementación

**Design tokens.** Toda la paleta, radios y sombras son custom properties de CSS en `src/styles.scss`, no variables SCSS: se heredan por el DOM, así que están disponibles en cualquier componente sin importar nada, y permitirían un modo oscuro redefiniéndolas.

**Resaltado de código.** Solo se registran los lenguajes que el blog usa, en lugar de importar highlight.js completo (~1 MB). Incluye una **gramática propia de PeopleCode**, que highlight.js no trae.

**Nomenclatura.** Angular 21 ya no añade el sufijo `.component`: `home.ts` con la clase `Home`.

## Configuración por entorno

La URL de la API no está fija en el código. `src/environments/environment.ts` (producción) y `environment.development.ts` se intercambian en tiempo de compilación mediante `fileReplacements`.

| | `serverUrl` | Cuándo |
|---|---|---|
| Producción | `''` → API en `/api/v1` (ruta relativa) | Build del contenedor, detrás de nginx |
| Desarrollo | `http://localhost:8080` | `ng serve`, sin proxy delante |

Con la ruta relativa el bundle no contiene ningún dominio: la misma imagen se despliega en cualquier host sin recompilar, y como el frontend y la API comparten origen, **CORS deja de intervenir**. En Docker, nginx reenvía `/api/` y `/uploads/` al contenedor del backend.
