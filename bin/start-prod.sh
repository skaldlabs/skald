#!/bin/bash

set -e

gunicorn --workers=2 --bind 0.0.0.0:8000 skald.wsgi --log-level debug --timeout 45
