import sqlite3
from flask import Flask, request

app = Flask(__name__)


@app.route("/user")
def lookup_user():
    username = request.args.get("username", "")
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    # Builds the query by string concatenation from request input.
    cur.execute("SELECT id, email FROM users WHERE username = '" + username + "'")
    return str(cur.fetchall())
