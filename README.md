# Sheets Map

## Project setup
---

```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build:lib
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

\
&nbsp;

## How to publish
---

1. Upgrade `"version"` in `package.json`.

2. Compile:
```
npm run build:lib
```

3. Publish:
```
npm publish
```

4. Update repo: `stage` changes, `commit` and `push`.

\
&nbsp;
## Configuración en Sheets
---
### Casos soportados por el "Mapa de claves" de Sheets Map :

1 - No mostrar nada

2 - Mostrar todos los nombres formateados para que sea legible por el usuario
Ejemplo:

```Text
*
```

3 - Mostrar solo los nombres definidos por el usuario
Ejemplo:

```JSON
{
    "CUT_REG":"Codigo región",
    "REGION":"Región",
    "SUPERFICIE":"Superficie total",
}
```

3.1 - Mostrar nombres definidos de todas las metricas:
Se usa "metric_data" seguido de un punto "." y un asterisco "*"

`{
    "metric_data.*":"Metrica"
}`

Ejemplo:
```JSON
{
    "CUT_REG":"Codigo región",
    "REGION":"Región",
    "SUPERFICIE":"Superficie total",
    "metric_data.*":"Metrica"
}
```

3.2 - Mostrar los nombres para cada metrica en concreto:
Se usa "metric_data" seguido de un punto "." y el nombre de columna de la métrica (Ejem. "migraciones").
*Si se agregan varias, solo se mostraría la métrica activa* y las otras no se verían


Ejemplo:
```JSON

{
    "CUT_REG":"Codigo región",
    "REGION":"Región",
    "SUPERFICIE":"Superficie total",
    "metric_data.nuevas_empresas":"Nuevas empresas",
    "metric_data.migraciones":"Total migraciones"
}
```

Notas:

1. *Respecto a `metric_data`* :
Siempre se debe usar `metric_data.` para mostrar el valor de una métrica, ya sea con asterisco o definiendo el nombre de columna.
1. *Uso de `"."`* : Si una propiedad de una métrica o una metadata es un objeto, se puede mostrar valores de ese objeto utilizando el recurso de puntos. Ejemplo:

    Si mi propiedad del objeto GEOJSON se ve así:

    ```JSON
    {
        "direccion":{
            "calle": "John Doe",
            "numero": "123"
        }
    }
    ```

    Puedo configurar mi mapa de claves de la siguiente manera para obtener la calle:

    ```JSON
    {
        "direccion.calle": "Calle"
    }
    ```
