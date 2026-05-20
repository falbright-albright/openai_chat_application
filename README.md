## Build

To install dependencies:

```sh
bun install
```

## Run

Run the docker container:

```
docker-compose -f docker_compose.yml up -d
```

Then run app:

```sh
bun run dev
```

To inspect database container:

```
docker exec -it chat_application-postgres-1 psql -U user -d db
```

open http://localhost:3000

## Helpful Commands

Access `postgres` database run in Docker:

```
dockerexec -it DOCKER_PG_CONTAINER_ID psql -U user db
```

Run `postgres` image with `docker-compose`

```
docker-compose -f docker_compose.yml down
```

Delete `postgres` volume

```
rm -r data/postgres
```
