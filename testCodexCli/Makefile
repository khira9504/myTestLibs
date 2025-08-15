SHELL := /bin/bash

.PHONY: setup build test lint format dev ci

setup:
	@echo "Installing dependencies and browsers..."
	npm ci
	npx playwright install --with-deps

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

format:
	npm run format

dev:
	npm run test:ui

ci:
	npm run type-check && npm run lint && npm run test

