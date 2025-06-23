#!/bin/bash

npx pbjs -t static-module -o database.js database.proto
npx pbts -o database.d.ts database.js