#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y postgresql postgresql-contrib postgis
service postgresql start

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'fleetpulse'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE fleetpulse;"
sudo -u postgres psql -d fleetpulse -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql -d fleetpulse -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Configure pg_hba.conf and postgresql.conf to allow localhost connections with password
CONF_DIR=$(sudo -u postgres psql -t -P format=unaligned -c 'show config_file;' | xargs dirname)
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" $CONF_DIR/postgresql.conf
echo "host all all 0.0.0.0/0 md5" >> $CONF_DIR/pg_hba.conf
echo "host all all ::/0 md5" >> $CONF_DIR/pg_hba.conf
service postgresql restart

echo "POSTGRES_READY"
