.PHONY: dev dev-server build docker-up docker-down docker-build docker-logs clean

# --- Development ---

dev:
	npm run dev

dev-server:
	npm run dev:server

# --- Build ---

build:
	npm run build

build-server:
	npm run build:server

build-all:
	npm run build:all

# --- Docker ---

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-restart:
	docker compose down && docker compose up -d --build

docker-clean:
	docker compose down -v --rmi all

# --- Production ---

prod: docker-build docker-up
	@echo "FarmQuest is running at http://localhost"
	@echo "Admin dashboard at http://localhost/admin"
	@echo "Vendor portal at http://localhost/vendor"

# --- Cleanup ---

clean:
	rm -rf dist server/dist
