#!/bin/bash
set -eux

apt update

# in docker container
apt install -y git build-essential libpam0g-dev libedit-dev libselinux1-dev openssl libssl-dev postgresql-server-dev-all zlib1g-dev libreadline6-dev libgssapi-krb5-2 liblz4-dev
ln -s "/usr/lib/x86_64-linux-gnu/libgssapi_krb5.so.2" "/usr/lib/x86_64-linux-gnu/libgssapi_krb5.so" || true

git clone https://github.com/ossc-db/pg_bulkload.git
pushd pg_bulkload
git checkout 300d058135e482106672aecec674bee2a52d5e2e
make -j"$(nproc)"
make install
