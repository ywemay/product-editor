#!/usr/bin/env python3
"""Products Desktop Editor — Single-file .prod editor.

Opens one .prod file at a time. No gallery, no sidebar, no company/deals.
"""

import sys
import os
import json
import threading
import webview

# Conditional platform import
try:
    import bottle
    from bottle import route, request, response, static_file
except ImportError:
    bottle = None

_this_dir = os.path.dirname(os.path.abspath(__file__))

# Ensure prodlib is importable
sys.path.insert(0, _this_dir)
from prodlib import store

# ---------------------------------------------------------------------------
# Bottle HTTP server
# ---------------------------------------------------------------------------

if bottle is not None:
    bottle_app = bottle.Bottle()

    def json_ok(data):
        response.content_type = "application/json"
        return json.dumps({"ok": True, "data": data})

    def json_err(msg):
        response.content_type = "application/json"
        response.status = 400
        return json.dumps({"ok": False, "error": msg})


    @bottle_app.post("/api/open")
    def api_open():
        """Open a .prod file and return its data."""
        body = request.json or {}
        path = body.get("path", "")
        if not path:
            return json_err("path is required")
        if not os.path.isfile(path):
            return json_err(f"File not found: {path}")
        try:
            result = store.open_product(path)
            result["filepath"] = path
            return json_ok(result)
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/save")
    def api_save():
        """Save product fields (title, code, description, variation_groups)."""
        body = request.json or {}
        path = body.get("path", "")
        if not path:
            return json_err("path is required")
        try:
            result = store.save_product(path, body.get("product", {}))
            result["filepath"] = path
            return json_ok(result)
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/price/add")
    def api_price_add():
        body = request.json or {}
        path = body.get("path", "")
        if not path:
            return json_err("path is required")
        try:
            store.add_price(path, body.get("currency", "USD"),
                          body.get("variation", ""), float(body.get("price", 0)))
            return json_ok(store.get_price_history(path))
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/price/history")
    def api_price_history():
        body = request.json or {}
        path = body.get("path", "")
        if not path:
            return json_err("path is required")
        try:
            return json_ok(store.get_price_history(path))
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/photo/add")
    def api_photo_add():
        body = request.json or {}
        path = body.get("path", "")
        photo_path = body.get("photoPath", "")
        if not path or not photo_path:
            return json_err("path and photoPath are required")
        try:
            store.add_photo(path, photo_path)
            return json_ok(store.open_product(path))
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/photo/remove")
    def api_photo_remove():
        body = request.json or {}
        path = body.get("path", "")
        index = body.get("index", -1)
        if not path or index < 0:
            return json_err("path and index are required")
        try:
            store.remove_photo(path, index)
            return json_ok(store.open_product(path))
        except Exception as e:
            return json_err(str(e))


    @bottle_app.get("/api/launch-file")
    def api_launch_file():
        """Return the file path from launch argv (if any), then clear it."""
        info_path = os.path.join(_this_dir, "data", "launch_file.json")
        path = ""
        if os.path.isfile(info_path):
            try:
                with open(info_path) as f:
                    data = json.load(f)
                    path = data.get("path", "")
                os.remove(info_path)
            except Exception:
                pass
        return json_ok({"path": path})


    @bottle_app.get("/api/health")
    def api_health():
        return json_ok({"status": "ok", "version": "1.0.0"})


    # Try to use new FileDialog API to avoid deprecation warnings
    try:
        from webview import FileDialog
        open_dialog = FileDialog.OPEN
        save_dialog = FileDialog.SAVE
    except ImportError:
        import webview
        open_dialog = webview.OPEN_DIALOG
        save_dialog = webview.SAVE_DIALOG


    @bottle_app.get("/api/open-file")
    def api_open_file():
        """Return a file path selected via native file dialog."""
        try:
            import webview
            file_types = ("Product files (*.prod)",)
            result = webview.windows[0].create_file_dialog(
                open_dialog, allow_multiple=False,
                file_types=file_types
            )
            path = result[0] if result else ""
            return json_ok({"path": path})
        except Exception as e:
            return json_err(str(e))


    @bottle_app.get("/api/save-file-as")
    def api_save_file_as():
        """Return a file path for Save As via native file dialog."""
        try:
            file_types = ("Product files (*.prod)",)
            result = webview.windows[0].create_file_dialog(
                save_dialog, allow_multiple=False,
                file_types=file_types, save_filename="product.prod"
            )
            return json_ok({"path": result if result else ""})
        except Exception as e:
            return json_err(str(e))


    @bottle_app.get("/api/settings")
    def api_get_settings():
        try:
            return json_ok(store.get_settings())
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/settings")
    def api_save_settings():
        body = request.json or {}
        try:
            store.save_settings(body)
            return json_ok({"saved": True})
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/price/edit")
    def api_price_edit():
        body = request.json or {}
        path = body.get("path", "")
        index = body.get("index", -1)
        if not path or index < 0:
            return json_err("path and index are required")
        try:
            store.edit_price(path, index, body.get("price", None), body.get("currency", None))
            return json_ok(store.get_price_history(path))
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/price/delete")
    def api_price_delete():
        body = request.json or {}
        path = body.get("path", "")
        index = body.get("index", -1)
        if not path or index < 0:
            return json_err("path and index are required")
        try:
            store.delete_price(path, index)
            return json_ok(store.get_price_history(path))
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/photo/export")
    def api_photo_export():
        body = request.json or {}
        path = body.get("path", "")
        index = body.get("index", -1)
        if not path or index < 0:
            return json_err("path and index are required")
        try:
            result = store.export_photo(path, index)
            return json_ok(result)
        except Exception as e:
            return json_err(str(e))


    @bottle_app.get("/api/open-url")
    def api_open_url():
        """Open a URL in the default OS browser/mail client."""
        url = request.query.get("url", "")
        if not url:
            return json_err("url is required")
        try:
            import webbrowser
            webbrowser.open(url)
            return json_ok({"opened": True})
        except Exception as e:
            return json_err(str(e))


    @bottle_app.post("/api/photo/move")
    def api_photo_move():
        body = request.json or {}
        path = body.get("path", "")
        index = body.get("index", -1)
        direction = body.get("direction", 0)  # -1 for left, 1 for right
        if not path or index < 0 or direction == 0:
            return json_err("path, index, and direction are required")
        try:
            store.move_photo(path, index, direction)
            return json_ok(store.open_product(path))
        except Exception as e:
            return json_err(str(e))


    # ── CORS ──
    @bottle_app.hook("after_request")
    def enable_cors():
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"


    # ── Static files (frontend) ──
    @bottle_app.route("/")
    def index():
        return static_file("index.html", root=os.path.join(_this_dir, "frontend"))

    @bottle_app.route("/src/<filename>")
    def static_src(filename):
        return static_file(filename, root=os.path.join(_this_dir, "frontend", "src"))

    @bottle_app.route("/<filename>")
    def static_root(filename):
        return static_file(filename, root=os.path.join(_this_dir, "frontend"))

else:
    bottle_app = None


# ---------------------------------------------------------------------------
# PyWebView window
# ---------------------------------------------------------------------------

def start_server():
    if bottle_app:
        bottle_app.run(host="127.0.0.1", port=18091, quiet=True)


def main():
    # Accept file path from command line argument (file association)
    file_to_open = ""
    if len(sys.argv) > 1:
        arg_path = sys.argv[1].strip()
        if arg_path.endswith(".prod") and os.path.isfile(arg_path):
            file_to_open = os.path.realpath(arg_path)

    # Start Bottle in a background thread
    t = threading.Thread(target=start_server, daemon=True)
    t.start()

    # Open pywebview window
    webview.create_window(
        "Products Editor",
        "http://127.0.0.1:18091",
        width=1100,
        height=780,
        resizable=True,
        min_size=(800, 600),
        text_select=True,
    )

    # Store the initial file to open in a shared location the frontend can read
    if file_to_open:
        info_path = os.path.join(_this_dir, "data", "launch_file.json")
        os.makedirs(os.path.dirname(info_path), exist_ok=True)
        with open(info_path, "w") as f:
            json.dump({"path": file_to_open}, f)

    webview.start(debug=False)


if __name__ == "__main__":
    main()
