#!/bin/bash
set -e

git submodule update --init --recursive
yarn hardhat:install --frozen-lockfile
yarn hardhat:compile

if [ -z "$VERCEL" ]; then
  yarn hardhat:dev > /dev/null 2>&1 &

  while [ ! $(lsof -t -i:"8545") ]; do
    sleep 1
  done

  yarn --cwd ./hardhat hardhat deploy --network localhost
  yarn hardhat:codegen
fi
yarn hardhat:build

if [ -z "$VERCEL" ]; then
  kill $(lsof -t -i:"8545")
fi

cd hardhat
yarn link
cd ..
yarn link @coordinape/hardhat

