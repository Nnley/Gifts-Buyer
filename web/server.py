import http.server
import socketserver
import json
import configparser
from pathlib import Path
import webbrowser
import threading

class ConfigWebServer:
    def __init__(self, port=8000):
        self.port = port
        self.config_path = Path(__file__).parent.parent / "config.ini"
        self.web_dir = Path(__file__).parent
        
    def read_config(self):
        parser = configparser.ConfigParser()
        if self.config_path.exists():
            parser.read(self.config_path, encoding='utf-8')
        
        config_data = {}
        for section_name in parser.sections():
            config_data[section_name] = dict(parser[section_name])
        
        return config_data
    
    def write_config(self, config_data):
        parser = configparser.ConfigParser()
        parser.optionxform = str

        for section_name, section_data in config_data.items():
            parser.add_section(section_name)
            for key, value in section_data.items():
                parser.set(section_name, key.upper(), str(value))
        
        with open(self.config_path, 'w', encoding='utf-8') as f:
            parser.write(f)
    
    def start_server(self):
        handler = ConfigRequestHandler
        handler.server_instance = self
        
        with socketserver.TCPServer(("", self.port), handler) as httpd:
            threading.Timer(1.0, lambda: webbrowser.open(f'http://localhost:{self.port}')).start()
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                pass


class ConfigRequestHandler(http.server.SimpleHTTPRequestHandler):
    server_instance = None
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)
    
    def do_GET(self):
        if self.path == '/':
            self.path = '/templates/config.html'
        elif self.path == '/api/config':
            self.send_config_data()
            return
        
        super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/config':
            self.save_config_data()
        else:
            self.send_error(404)
    
    def send_config_data(self):
        try:
            config_data = self.server_instance.read_config()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(config_data, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_error(500, f"Ошибка чтения конфига: {str(e)}")
    
    def save_config_data(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            config_data = json.loads(post_data.decode('utf-8'))
            
            self.server_instance.write_config(config_data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {"status": "success", "message": "Конфигурация сохранена успешно!"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Ошибка сохранения конфига: {str(e)}")


def main():
    server = ConfigWebServer()
    server.start_server()


if __name__ == "__main__":
    main() 