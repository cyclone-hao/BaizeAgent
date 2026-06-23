import sys
import os
import traceback

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ".")

print("Step 1: Importing configs...", flush=True)
try:
    from configs import dify_config
    print(f"  WEB_SEARCH_API_KEY set: {bool(dify_config.WEB_SEARCH_API_KEY)}", flush=True)
except Exception as e:
    print(f"  FAILED: {e}", flush=True)
    traceback.print_exc()

print("Step 2: Importing web_search module...", flush=True)
try:
    from controllers.console.web_search import WebSearchApi
    print(f"  OK: {WebSearchApi}", flush=True)
except Exception as e:
    print(f"  FAILED: {e}", flush=True)
    traceback.print_exc()

print("Step 3: Creating Flask app...", flush=True)
try:
    from app_factory import create_app
    app = create_app()
    print("  App created!", flush=True)
except Exception as e:
    print(f"  FAILED: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

print("Step 4: Checking routes...", flush=True)
rules = [str(r) for r in app.url_map.iter_rules() if "web-search" in str(r)]
print(f"  web-search routes: {rules}", flush=True)

print("Step 5: Starting server on port 5001...", flush=True)
app.run(host="0.0.0.0", port=5001, debug=False)
