#!/bin/bash

set -e

# Run migrations
python manage.py migrate

gunicorn -k gevent \
  --workers=2 \
  --bind 0.0.0.0:8000 \
  --forwarded-allow-ips='*' \
  --access-logfile - \
  --log-level info \
  --timeout 45 \
  skald.wsgi

