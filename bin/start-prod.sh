#!/bin/bash

set -e

gunicorn -k gevent --workers=2 --bind 0.0.0.0:8000 skald.wsgi --log-level debug --timeout 45
