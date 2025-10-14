#!/bin/bash

set -e

gunicorn -k gevent --bind 0.0.0.0:8000 skald.wsgi --log-level debug --timeout 120
