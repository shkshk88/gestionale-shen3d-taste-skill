#!/bin/sh
# Push Prisma schema to PostgreSQL (initial setup) then start server
npx prisma db push --accept-data-loss
node dist/src/main
