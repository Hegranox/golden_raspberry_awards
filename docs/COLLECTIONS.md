# Collections Schemas

Esta pasta contém os schemas/definições das collections do MongoDB (usando driver nativo).

## BaseCollection

Todas as collections devem estender de `BaseCollection`:

```typescript
import { BaseCollection } from "@db/collections/base-collection.schema";

export interface BaseCollection {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Exemplo de uso

```typescript
import { BaseCollection } from "@db/collections/base-collection.schema";

export interface Example extends BaseCollection {
  name: string;
}
```

## Como usar

```typescript
// Importar o schema
import { Example } from "@db/collections/example.schema";

// Usar com DatabaseService
const collection = databaseService.getCollection<Example>("examples");

// Inserir um documento
await collection.insertOne({
  _id: "123",
  name: "Example Name",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Buscar documentos
const examples = await collection.find({}).toArray();
```
