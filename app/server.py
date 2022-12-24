from flask import Flask
import json
import psycopg2
import os
import logging
import sys
from flask import render_template
from flask import request
from datetime import datetime
from typing import List, Dict, Any


def init_logger() -> logging.Logger:
    """
    Create a logger instance for the current module
    """
    logger = logging.getLogger(__name__)

    # Log all messages
    logger.setLevel(getattr(logging, LOG_LEVEL))

    # Set up a handler to print to stderr
    handler = logging.StreamHandler()
    parts = []
    parts.append("%(asctime)s")
    parts.append("%(levelname)-1s")

    formatter = logging.Formatter(
        fmt=f"[{' '.join(parts)}] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # May be inefficient, but flush on every log call
    logger.handlers[0].flush = sys.stderr.flush
    return logger


DB_NAME = os.getenv("DB_NAME", "reddit")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "something")
DB_PASSWORD = os.getenv("DB_PASSWORD")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG = init_logger()
app = Flask(__name__)
app.logger.setLevel(LOG_LEVEL)

if DB_PASSWORD is None:
    print("DB_PASSWORD environment variable not set, cannot continue")
    exit(1)

FIELDS = [
    "id",
    "author",
    "url",
    "title",
    "created_utc",
    "score",
    "num_comments",
    "subreddit",
]


def db_query(query: str, params: List[str]):
    LOG.info(f"Querying DB with '{query}' and params {params}")
    connection = f"dbname={DB_NAME} user={DB_USER}"
    LOG.debug(f"Connection string: {connection}")
    sr_conn = psycopg2.connect(connection, host=DB_HOST)
    sr_cursor = sr_conn.cursor()
    if len(params) == 0:
        sr_cursor.execute(query)
    else:
        sr_cursor.execute(query, params)
    items = sr_cursor.fetchall()
    sr_cursor.close()
    sr_conn.close()
    return items


@app.route("/")
def index():
    return render_template("base.html")


def error(message):
    return json.dumps({"error": message}), 400


def to_dict(items: List[Any]) -> List[Dict[str, Any]]:
    dict_items = []
    for item in items:
        new_item = {}
        for i, f in enumerate(FIELDS):
            new_item[f] = item[i]

        dict_items.append(new_item)

    return dict_items


def time_range():
    params = []
    wheres = []
    if "dayfrom" in request.args and request.args["dayfrom"] != "null":
        dayfrom = datetime.strptime(request.args["dayfrom"], "%Y-%m-%d")
        params.append(int(dayfrom.timestamp()))
        wheres.append("created_utc > %s")
    if "dayto" in request.args and request.args["dayto"] != "null":
        dayto = datetime.strptime(request.args["dayto"], "%Y-%m-%d")
        params.append(int(dayto.timestamp()))
        wheres.append("created_utc < %s")

    return params, wheres


@app.route("/query")
def query():
    LOG.info(f"/query with {request.args}")
    if "query" not in request.args:
        return error("no query provided")
    query = f"select {', '.join(FIELDS)} from post where "

    wheres = [request.args["query"]]
    # params = []
    # if "dayfrom" in request.args and request.args["dayfrom"] != "null":
    #     dayfrom = datetime.strptime(request.args["dayfrom"], "%Y-%m-%d")
    #     params.append(int(dayfrom.timestamp()))
    #     wheres.append("created_utc > %s")
    # if "dayto" in request.args and request.args["dayto"] != "null":
    #     dayto = datetime.strptime(request.args["dayto"], "%Y-%m-%d")
    #     params.append(int(dayto.timestamp()))
    #     wheres.append("created_utc < %s")
    params, time_wheres = time_range()
    wheres.extend(time_wheres)

    query += " and ".join(wheres)
    query += " order by score desc, created_utc"
    query += " limit 100"

    # Send the query to Postgres
    items = db_query(query, params)
    return json.dumps(to_dict(items))


@app.route("/subreddit/<subreddit>")
def subreddit(subreddit):
    wheres = ["lower(subreddit)=lower(%s)"]
    params = [subreddit]
    query = f"select {', '.join(FIELDS)} from post where "

    time_params, time_wheres = time_range()
    params.extend(time_params)
    wheres.extend(time_wheres)

    query += " and ".join(wheres)
    query += " order by score desc, created_utc"
    n = 100
    query += f" limit {n}"

    items = db_query(query, params)
    return json.dumps(to_dict(items))


if __name__ == "__main__":
    pass
