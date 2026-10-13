#!/bin/sh
set -eu

: "${CI_PRIMARY_REPOSITORY_PATH:?This script must run in Xcode Cloud.}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR/../../.."

# Capacitor 8 and Angular 21 both support Node 22.12 or later.
brew install node@22
export PATH="$(brew --prefix node@22)/bin:$PATH"

node --version
npm --version
npm ci --include=dev
npm run build
npx --no-install cap sync ios

for resource in capacitor.config.json config.xml public/index.html; do
  if [ ! -f "ios/App/App/$resource" ]; then
    echo "Missing iOS resource after Capacitor sync: $resource" >&2
    exit 1
  fi
done
