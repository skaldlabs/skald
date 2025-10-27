#!/bin/bash

set -e

python manage.py migrate

# TODO: make the number of workers configurable based on the number of cores
gunicorn -k gthread \
  --workers=2 \
  --threads=8 \
  --bind 0.0.0.0:8000 \
  --forwarded-allow-ips='*' \
  --access-logfile - \
  --log-level info \
  --timeout 45 \
  skald.wsgi

