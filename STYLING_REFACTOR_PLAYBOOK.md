# Styling Refactor Playbook (Ventas)

Este documento resume el trabajo realizado en esta sesion y sirve como guia para proximos agentes que continuen la estandarizacion de estilos en frontend.

## Objetivo

Estandarizar estilos para evitar mezclar en el mismo `page.tsx`:

- HTML + `style={{ ... }}` largos
- clases globales para casos locales
- overrides de Antd dispersos sin criterio

## Regla de estilo adoptada

### `global.css`

Usar solo para:

- variables globales
- reset/base styles
- estilos globales de app
- overrides `.ant-*` que deben impactar en toda la app

### `*.module.css`

Usar para:

- layout de pagina
- wrappers
- headers
- grids
- bloques especificos de componente
- overrides de Antd encapsulados por componente/pagina con `:global(...)`

### `style={{}}`

Usar solo para:

- estilos dinamicos reales
- micro-ajustes puntuales

## Trabajo realizado en esta sesion

### Refactor funcional previo (ventas)

- Ventas y Anulaciones quedaron unificadas en tabs dentro de `frontend/src/pages/ventas/VentasPage.tsx`.
- Cada tab trae solo data de su estado (`emitida` / `anulada`).
- El detalle de comprobante se carga en lazy al expandir fila.

### Refactor de estilos aplicado

Se movieron estilos locales de inline/global a CSS Modules en:

- `frontend/src/pages/ventas/VentasPage.tsx`
- `frontend/src/components/ventas/ComprobanteVentaPreview.tsx`
- `frontend/src/components/ventas/VentasTable.tsx`
- `frontend/src/components/ventas/VentasTab.tsx`
- `frontend/src/components/ventas/AnulacionesTab.tsx`

Nuevos archivos:

- `frontend/src/pages/ventas/VentasPage.module.css`
- `frontend/src/components/ventas/ComprobanteVentaPreview.module.css`
- `frontend/src/components/ventas/VentasTable.module.css`
- `frontend/src/components/ventas/VentasTab.module.css`
- `frontend/src/components/ventas/AnulacionesTab.module.css`

## Patron a replicar en siguientes paginas/componentes

1. Crear `X.module.css` junto a `X.tsx`.
2. Mover bloques de estilos inline a clases locales.
3. Importar modulo con `import styles from './X.module.css'`.
4. Mantener `style={{}}` solo si es dinamico o minimo.
5. Si hay ajuste de Antd local, usar `:global(.ant-...)` dentro del modulo de ese componente.
6. Eliminar clases de `global.css` que sean exclusivas de una sola pagina (si no se usan en otro lado).

## Checklist de aceptacion

- [ ] El componente/pagina no contiene objetos inline largos de estilo.
- [ ] No se agregaron estilos de negocio local a `global.css`.
- [ ] Overrides de Antd estan encapsulados localmente cuando son de alcance de pagina/componente.
- [ ] `npm run build` en `frontend` compila sin errores.
- [ ] No cambia el comportamiento funcional de la pantalla.

## Siguiente objetivo recomendado

Aplicar este mismo patron a:

- `frontend/src/pages/ventas/PuntoVentaPage.tsx`

Razones:

- Es la pagina de ventas con mayor cantidad de `style={{ ... }}`.
- Es donde mas ganancia de mantenibilidad y limpieza visual se obtiene.

## Comando de validacion

```bash
npm run build
```

Ejecutar desde:

- `frontend`
