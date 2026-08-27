# Sources API — contrato del backend (fase 2)

Referencia de los endpoints de administración de fuentes que expone `cuits-api`.
Escrito para la fase 3 (tab "Fuentes"), donde el código del backend no está a la vista.

Todos los endpoints van detrás del middleware de auth: `apiFetch` ya inyecta el
Bearer token, así que no hay nada especial que hacer para autenticarse.

---

## ⚠️ Lo primero: `category` viene en snake_case

El backend devuelve **`"known" | "to_know"`**, con guión bajo.

`FullBaseTable.tsx` usa hoy `type CategoryId = "known" | "toKnow"`, y su función
`classify()` hace `SOURCE_CATEGORY[source] ?? "known"`. Ese `?? "known"` es un
fallback silencioso: si le pasás `"to_know"` sin traducir, **no falla — clasifica
todo como Conocidos** y el bug pasa desapercibido.

Al sacar el `SOURCE_CATEGORY` hardcodeado hay que decidir una de dos:

- traducir en el borde (`category === "to_know" ? "toKnow" : "known"`), o
- cambiar `CategoryId` a la forma del backend y actualizar `CATEGORIES` y todos
  los comparadores.

El grafo internamente guarda `"toKnow"`, pero la API traduce al tipo del dominio
antes de responder. La forma que ve el frontend es siempre `to_know`.

---

## Endpoints

```
GET    /sources
PATCH  /sources/:name              renombrar
POST   /sources/merge              mergear
DELETE /sources/:name              borrar
POST   /nodes/:taxId/sources       agregar o mover la fuente de un nodo
```

### GET /sources

Sin body. Es el único no destructivo.

```json
{
  "sources": [
    { "name": "Bolsa", "category": "to_know", "nodeCount": 2916 },
    { "name": "Clientes CRM", "category": "known", "nodeCount": 467 }
  ]
}
```

Viene ordenado por nombre. `nodeCount` sale de las relaciones `[:HAS_SOURCE]`,
que son la fuente de verdad — no del array `sources` de cada CUIT.

Buen candidato para React Query con `staleTime` alto: cambia sólo cuando alguien
ejecuta una operación de admin.

### Las cuatro operaciones destructivas

| Endpoint | Body |
|---|---|
| `PATCH /sources/:name` | `{ newName, password }` |
| `POST /sources/merge` | `{ sourceToKeep, sourceToDrop, password }` |
| `DELETE /sources/:name` | `{ password }` |
| `POST /nodes/:taxId/sources` | `{ sourceName, mode: "add" \| "move", fromSource?, password }` |

En `mode: "move"`, `fromSource` es obligatorio; en `"add"` se ignora.

Las cuatro devuelven el mismo shape:

```ts
interface OperationSummary {
  operation: "rename" | "merge" | "delete" | "add-source" | "move-source"
  affectedNodeCount: number
  removedNodeCount: number      // nodos eliminados por quedar sin fuentes
  updatedNodeCount: number      // nodos que sólo se modificaron
  createdSourceName?: string
  removedSourceName?: string
  dryRun: boolean
  message: string               // ya viene redactado en español, es mostrable tal cual
}
```

---

## Dry run — para los modales de confirmación

Las cuatro aceptan `?dryRun=true`. Con eso:

- no escriben nada
- **no piden password**
- devuelven el mismo `OperationSummary` con los contadores reales

O sea que el modal de confirmación puede pedir el preview apenas se abre, mostrar
"esto afecta N nodos y elimina M", y recién pedir la password cuando el usuario
confirma. El `message` del preview ya viene redactado para mostrar.

En el `delete`, `removedNodeCount` del dry run es una estimación de cuántos CUITs
quedarían sin ninguna fuente y por lo tanto se eliminarían. Es el número que
conviene destacar en rojo.

---

## Password: step-up auth

El JWT no alcanza para las operaciones destructivas — va la password del usuario
en el body de cada request. No hay token intermedio ni sesión elevada: si el
usuario hace tres operaciones, la escribe tres veces.

- sin campo `password` → **400** `{ message: "Password requerida para esta operación" }`
- password incorrecta → **401** `{ message: "Password incorrecta" }`

Ojo con el 401: `apiFetch` llama a `clearAuth()` ante cualquier 401, así que una
password mal tipeada va a desloguear al usuario. **Hay que manejar ese caso
aparte** antes de que llegue al handler genérico, o el flujo se vuelve
insoportable.

---

## Errores

Todos llegan como `{ error, message }`. `apiFetch` ya levanta `message`, que está
en español y es mostrable.

| Status | `error` | Cuándo |
|---|---|---|
| 404 | `source_not_found` | la fuente no existe |
| 404 | `node_not_found` | el CUIT no existe |
| 409 | `name_conflict` | el nombre nuevo ya está en uso, o se intenta mergear una fuente consigo misma |
| 409 | `category_mismatch` | merge entre fuentes de distinta category |
| 400 | `invalid_move_params` | el nodo no pertenece a `fromSource` |

Reglas de negocio que conviene reflejar en la UI para no ofrecer acciones que van
a fallar:

- **Merge sólo entre fuentes de la misma category.** El selector de "fuente a
  absorber" debería filtrar por la category de la que se conserva.
- **Rename rechaza un nombre existente** en vez de mergear implícitamente.
- **Borrar una fuente elimina los CUITs que quedan sin ninguna fuente.** Por eso
  el dry run importa: es destructivo sobre nodos, no sólo sobre la fuente.

---

## Forma sugerida del service

Siguiendo la convención de `GraphService` en `src/services/api.ts`:

```ts
export const SourcesService = {
  list: () => apiFetch<{ sources: SourceInfo[] }>(`${API_BASE_URL}/sources`),

  rename: (name: string, newName: string, password: string, dryRun = false) =>
    apiFetch<OperationSummary>(
      `${API_BASE_URL}/sources/${encodeURIComponent(name)}?dryRun=${dryRun}`,
      { method: "PATCH", body: JSON.stringify({ newName, password }) }
    ),
  // ...
}
```

`encodeURIComponent` no es opcional: hay fuentes con espacios ("Clientes CRM",
"Deudores por financiera") y una con guión ("conocidos-luchi").

---

## Estado del backend

Fases 1 y 2 completas en la branch `development` de `cuits-api`. La migración que
creó los nodos `(:Source)` ya corrió sobre Aura, así que los endpoints operan
sobre datos reales — las 11 fuentes existen con su category y su conteo.
