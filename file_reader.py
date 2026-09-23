import os
from flask import Flask, request, send_file

app = Flask(__name__)


@app.route("/download")
def download():
    name = request.args.get("name", "")
    # Joins request input into a filesystem path without normalising it.
    return send_file(os.path.join("/srv/uploads", name))
