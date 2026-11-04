#!/bin/sh
# Generates the PNG icons from public/icon.svg. Needs rsvg-convert (librsvg).
set -eu
cd "$(dirname "$0")/.."

rsvg-convert -w 192 -h 192 public/icon.svg -o public/icon-192.png
rsvg-convert -w 512 -h 512 public/icon.svg -o public/icon-512.png

# iOS paints transparent corners black and rounds the icon itself, so this one
# is opaque and fills the square: cropped to the tile's outline, on ink.
sed 's/viewBox="0 0 64 64"/viewBox="2 2 60 60"/' public/icon.svg \
  | rsvg-convert -w 180 -h 180 -b '#15161a' -o public/apple-touch-icon.png
