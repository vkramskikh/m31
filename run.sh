#!/bin/sh
test -d data || mkdir data
docker run --rm -it               \
  -p 0.0.0.0:12345:8888 \
  -v `pwd`/data:/app/data         \
  metacoma/m31:latest
