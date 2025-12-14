# Factories

Esta pasta contém as factories para criar dados de teste usando `fishery` e `faker`.

## Exemplo de uso

```typescript
import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import { Example } from "@db/collections/example.schema";

export const ExampleFactory = Factory.define<Example>(({ params }) => ({
  _id: faker.string.uuid(),
  name: faker.person.fullName(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...params,
}));
```

## Como usar

```typescript
// Criar um único exemplo
const example = ExampleFactory.build();

// Criar múltiplos exemplos
const examples = ExampleFactory.buildList(5);

// Criar com parâmetros customizados
const customExample = ExampleFactory.build({ name: "Custom Name" });
```
