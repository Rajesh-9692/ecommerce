import os
import ssl
from pathlib import Path
from wsgiref.simple_server import WSGIRequestHandler, make_server


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecommerce.settings")

from django.contrib.staticfiles.handlers import StaticFilesHandler
from django.core.wsgi import get_wsgi_application


CERT_DIR = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "MyShop" / "dev-certs"
CERT_FILE = CERT_DIR / "localhost.crt"
KEY_FILE = CERT_DIR / "localhost.key"
HOST = "127.0.0.1"
PORT = 8443


class HTTPSRequestHandler(WSGIRequestHandler):
    def get_environ(self):
        environ = super().get_environ()
        environ["wsgi.url_scheme"] = "https"
        return environ


def main():
    if not CERT_FILE.is_file() or not KEY_FILE.is_file():
        raise SystemExit(
            f"Local HTTPS certificate not found. Expected {CERT_FILE} and {KEY_FILE}."
        )

    application = StaticFilesHandler(get_wsgi_application())
    server = make_server(HOST, PORT, application, handler_class=HTTPSRequestHandler)
    tls_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    tls_context.load_cert_chain(CERT_FILE, KEY_FILE)
    server.socket = tls_context.wrap_socket(server.socket, server_side=True)

    print(f"Serving MyShop over HTTPS at https://{HOST}:{PORT}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()