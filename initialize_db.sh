#!/bin/bash
set -eux

# create reddit database
psql -h localhost -U "$DB_USER" -c 'create database reddit;'

# clear 'reddit' database
psql -h localhost -U "$DB_USER" -d reddit -c 'drop table if exists post'
echo "
    CREATE TABLE post (
    id VARCHAR(30) PRIMARY KEY,
    author TEXT,
    subreddit VARCHAR(300),
    url TEXT,
    title TEXT,
    score INT,
    created_utc INT,
    num_comments INT,
    ups INT,
    downs INT,
    over_18 BOOLEAN
)
" | psql -h localhost -U "$DB_USER" -d reddit

# install pg_bulkload
psql -h localhost -U "$DB_USER" -f pg_bulkload/lib/pg_bulkload.sql reddit

