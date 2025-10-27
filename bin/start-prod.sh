#!/bin/bash

set -e

# TODO: make this configurable
gunicorn -k gthread --workers=2 --threads 8 --bind 0.0.0.0:8000 skald.wsgi --log-level debug --timeout 45
