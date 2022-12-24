#!/bin/bash
set -eu

BULKLOAD_BIN=./pg_bulkload/bin/pg_bulkload

if [ ! -f "$BULKLOAD_BIN" ]; then
    read -r -p "pg_bulkload has not been built, build it now? [y/n] " response
    response=${response,,}  # tolower
    if [[ $response =~ ^(y| ) ]] || [[ -z $response ]]; then
        set -x
        sudo bash docker/build_pg_bulkload.sh
        set +x
    else
        echo "Cannot proceed without pg_bulkload"
        exit 1
    fi
fi

"$BULKLOAD_BIN" \
    -h localhost \
    -U $DB_USER \
    -d reddit pg.ctl \
    --parse-badfile=/tmp/parse.bad \
    --duplicate-badfile=/tmp/duplicates.bad