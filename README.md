# Golden Raspberry Awards API

API for managing Golden Raspberry Awards (Razzie Awards) data.

## How to run the application

### Prerequisites

- Node.js (version 18 or higher)
- pnpm (package manager)

### Installation

```bash
# Install dependencies
pnpm install
```

### Run in development mode

```bash
# Start application in watch mode
pnpm start:dev
```

The application will be available at `http://localhost:3000`

**Note:** On application startup, the API automatically imports initial data from `src/assets/seeder.csv` into the database. This ensures the database is populated with initial movie data when the application starts.

### Run in production mode

```bash
# Build the application
pnpm build

# Run the application
pnpm start:prod
```

## API Documentation (Swagger)

Interactive API documentation is available through Swagger UI:

**URL:** `http://localhost:3000/api`

In Swagger UI you can:

- View all available endpoints
- See request and response examples
- Test endpoints directly through the interface
- View DTO schemas

## Tests

### Unit Tests

Run unit tests with:

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

Unit tests are located in `src/**/*.spec.ts` and test:

- `AppService` - Business logic
- `AppRepository` - Database operations
- `CsvValidationPipe` - CSV validation and transformation

### End-to-End (E2E) Tests

Run E2E tests with:

```bash
pnpm test:e2e
```

E2E tests are located in `test/**/*.e2e-spec.ts` and test:

- CSV file upload via `/populate`
- Producer interval calculation via `/list-producer-winners`

## Application testing flow

### 1. Run the application

```bash
pnpm start:dev
```

**Note:** The database is automatically populated with initial data from `seeder.csv` when the application starts. You can skip step 2 if you want to use the initial data, or proceed to add additional data.

### 2. Populate database with CSV file (Optional)

Make a POST request to `/populate` with a CSV file:

**Example using curl:**

```bash
curl -X POST http://localhost:3000/populate \
  -F "file=@movies.csv"
```

**Example CSV file (`movies.csv`):**

```csv
year;title;studios;producers;winner
1980;Can't Stop the Music;Associated Film Distribution;Allan Carr;yes
1980;Cruising;Lorimar Productions;Jerry Weintraub;no
1980;The Formula;MGM;Steve Shagan;no
1981;Mommy Dearest;Paramount Pictures;Frank Yablans;yes
```

**CSV Format:**

- Delimiter: `;` (semicolon)
- Required columns: `year`, `title`, `studios`, `producers`, `winner`
- `winner`: `yes` for winner, `no` or empty for non-winner
- `year`: number (e.g., 1980)
- `title`, `studios`, `producers`: strings

**Expected response:**

```json
{
  "message": "Data processed successfully",
  "count": 4
}
```

### 3. Query producer intervals

After populating the database, make a GET request to `/list-producer-winners`:

**Example using curl:**

```bash
curl http://localhost:3000/list-producer-winners
```

**Expected response:**

```json
{
  "min": [
    {
      "producer": "Allan Carr",
      "interval": 1,
      "previousWin": 1980,
      "followingWin": 1981
    }
  ],
  "max": [
    {
      "producer": "Producer Name",
      "interval": 10,
      "previousWin": 1990,
      "followingWin": 2000
    }
  ]
}
```

**Where:**

- `min`: Array with producers who have the minimum interval between consecutive wins
- `max`: Array with producers who have the maximum interval between consecutive wins
- Each item contains: `producer`, `interval` (in years), `previousWin` and `followingWin`

### 4. Test via Swagger UI

1. Access `http://localhost:3000/api`
2. Use the `POST /populate` endpoint to upload the CSV file
3. Use the `GET /list-producer-winners` endpoint to query the results

## Project Structure

```
.
├── db/                    # Database module
│   ├── collections/       # Collection schemas
│   ├── factories/         # Test factories
│   └── database.service.ts # MongoDB connection service
├── src/
│   ├── assets/            # Initial data files (seeder.csv)
│   ├── dto/               # Swagger DTOs
│   ├── pipes/             # Validation pipes
│   ├── seeds/             # Database seeding service
│   ├── app.controller.ts   # Main controller
│   ├── app.service.ts      # Main service
│   └── app.repository.ts   # Database operations repository
└── test/                   # E2E tests
```

## Technologies

- **NestJS** - Node.js framework
- **MongoDB Memory Server** - In-memory database for tests
- **Swagger** - API documentation
- **Jest** - Testing framework
- **Biome** - Linter and formatter
