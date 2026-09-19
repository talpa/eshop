#!/bin/sh
echo "[STARTUP] DATABASE_URL prefix: $(echo $DATABASE_URL | cut -c1-30)"

i=0
until npx prisma migrate deploy 2>&1; do
  i=$((i+1))
  if [ $i -ge 15 ]; then
    echo "[STARTUP] prisma migrate deploy failed after 15 attempts, starting anyway"
    break
  fi
  echo "[STARTUP] prisma migrate deploy attempt $i failed, retrying in 5s..."
  sleep 5
done

exec "$@"
