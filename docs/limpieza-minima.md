# Depuración mínima AGCID01-278

Se retiran dos trazas prescindibles del dibujo y se omite un binding que queda sin uso. Se conserva el flujo cartográfico, los filtros, la autenticación y los diagnósticos de error.

| Campo | Valor |
|---|---|
| Identificador | `REF-sheets-map-limpieza-minima` |
| Tipo | `referencia` |
| Componente | Motor compartido de los cuatro visores AGCID |
| Versión del estándar | `1.2.0` |
| Versión verificada | Base `main`, `ec00084c0d08c40e7d535de79a7721f309bae2db`, más diff de esta rama |
| Última verificación | `2026-10-23` |
| Audiencia | Desarrollo y revisión |
| Estado | `en-revision` |

## Cambios de alcance

| Componente / método | Retirada | Preservado |
|---|---|---|
| `PolygonDrafter.polygonBounds` | Log de clave y objeto del dibujo; binding `key` omitido | `Object.entries`, orden, coordenadas, filtros y eventos; otra `key` del cálculo de `order` intacta |

No se suprimen todos los `console.*`: permanecen los diagnósticos de tipos de capa/leyenda no soportados y fallas no abortadas del buscador. No hay cambios de versiones, dependencias, props, eventos, librerías o comando de pruebas.

## Verificación

Desde la raíz del paquete, con las dependencias existentes:

```powershell
npm run lint
node --test --test-reporter=spec
```

Resultado de la ejecución de esta unidad: ESLint correcto y 113 pruebas correctas. El comando habitual `npm run test` conserva su incompatibilidad conocida con el flag Node; corregirlo quedó fuera del alcance mínimo.

La comparación de AST contra la base debe permitir sólo dos llamadas retiradas y la omisión del binding. Esta verificación de fuentes no equivale a comprobar un bundle ya reconstruido en navegador. No se compilan assets ni se publica una versión del paquete en esta etapa.
