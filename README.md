# selfhosteddit

The pushshift reddit dumps are quite opaque to anything but full scans. selfhosteddit makes it easy to browse and sift through the dumps via a familiar looking frontend and a Postgres database. This project efficiently streams data from the zstd compressed reddit dumps into Postgres as fast as possible without requiring tons of RAM. Records are streamed from the compressed dumps into the database so the uncompressed dumps do not need to be stored on disk. See this [blog post](https://goatmobile.github.io/blog/posts/selfhosteddit) for more details.

## Installation

You must also install [Docker Compose](https://docs.docker.com/compose/install/) on your system.

```bash
# Get the code
git clone --depth=1 https://github.com/goatmobile/selfhosteddit
cd selfhosteddit

# Install zstd, postgres client, and GNU parallel
sudo apt install -y parallel postgresql-client zstd
psql --version
unzstd --version
parallel --version

# Install Python dependencies
python3 -m pip install requirements.txt

# Check that Docker Compose is installed
docker compose version
```

## Usage

1. Prepare the mount points on your filesystem for the database and start up Postgres

    ```bash
    # you can make this folder anywhere on your filesystem, but make sure to
    # edit docker-compose.yml where it references ./pgdata to match the new
    # location
    mkdir -p pgdata

    # set up a username and password
    export DB_USER=something
    export DB_PASSWORD=changethis
    sed "s/admin-user/$DB_USER/g" -i docker-compose.yml
    sed "s/admin-password/$DB_PASSWORD/g" -i docker-compose.yml

    # start the database
    docker compose up -d
    ```

2. Build [`pg_bulkload`](https://github.com/ossc-db/pg_bulkload)

    ```bash
    # Build pg_bulkload on the host
    sudo bash docker/build_pg_bulkload.sh
    ```

3. Download the reddit database dumps to a folder, for example `/data/reddit`

4. Start the script using one of these examples (time will vary based on how much data up to several hours)

    ```bash
    # set number of parallel processes
    export NPROC=$(expr $(nproc) / 3)

    # set up database
    bash initialize_db.sh

    # upload all reddit dumps after one whose name partially matches 'RS_2018'
    python insert.py -j$NPROC --data /data/reddit --start RS_2018 | ./upload.sh

    # upload all reddit dumps until one whose name partially matches 'RS_2018'
    python insert.py -j$NPROC --data /data/reddit --end RS_2018 | ./upload.sh

    # upload a specific reddit dump
    python insert.py -j$NPROC --one /data/reddit/RS_2010-01.zst | ./upload.sh
    ```

5. Create database indices to speed up queries (may take a while up to a few hours)

    ```bash
    r mkindex
    ```

6. Run the web interface and visit https://localhost:5000

    ```bash
    cd app
    npm install
    r
    ```
