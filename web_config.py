import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "web_config"))

from web.server import ConfigWebServer

def main():
    print("=" * 60)
    print("🎁 Gifts-Buyer - Веб-конфигуратор")
    print("=" * 60)
    print()
    print("Этот инструмент поможет вам настроить config.ini")
    print("через удобный веб-интерфейс без редактирования файлов.")
    print()
    print("После запуска автоматически откроется страница в браузере.")
    print("Если этого не произошло, откройте вручную: http://localhost:8000")
    print()
    print("Для остановки нажмите Ctrl+C")
    print("=" * 60)
    print()
    
    try:
        server = ConfigWebServer(port=8000)
        server.start_server()
    except KeyboardInterrupt:
        print("\nВеб-конфигуратор остановлен.")
    except OSError as e:
        if "Address already in use" in str(e):
            print("❌ Ошибка: Порт 8000 уже используется.")
            print("Возможно, веб-конфигуратор уже запущен или порт занят другим приложением.")
            print("Попробуйте закрыть другие программы или перезагрузить компьютер.")
        else:
            print(f"❌ Ошибка запуска сервера: {e}")
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")

if __name__ == "__main__":
    main() 