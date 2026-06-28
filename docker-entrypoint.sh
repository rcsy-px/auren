#!/bin/sh
set -e

mkdir -p "$AUREN_DATA_DIR"
chown -R node:node "$AUREN_DATA_DIR" 2>/dev/null || true

exec su-exec node "$@"
