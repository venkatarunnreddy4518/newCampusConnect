from flask import Blueprint, jsonify


api = Blueprint("api", __name__)


@api.get("/health")
def health():
    return jsonify({"status": "ok"})


@api.get("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask"})

