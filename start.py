#!/usr/bin/env python3
"""
Скрипт для запуска полного приложения (backend + frontend)
"""

import subprocess
import sys
import os
import time
from threading import Thread

def run_backend():
    """Запуск Flask backend"""
    print("🚀 Запуск Backend (Flask API)...")
    try:
        # Устанавливаем зависимости если нужно
        subprocess.run([sys.executable, "-m", "pip", "install", "flask", "flask-cors"], 
                      check=False, capture_output=True)
        
        # Запускаем Flask приложение
        subprocess.run([sys.executable, "app.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка запуска backend: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Backend остановлен")

def run_frontend():
    """Запуск React frontend"""
    print("⚛️  Запуск Frontend (React)...")
    try:
        # Переходим в папку frontend
        os.chdir("frontend")
        
        # Проверяем наличие node_modules
        if not os.path.exists("node_modules"):
            print("📦 Установка зависимостей npm...")
            subprocess.run(["npm", "install"], check=True)
        
        # Запускаем React приложение
        subprocess.run(["npm", "start"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка запуска frontend: {e}")
        print("💡 Убедитесь, что Node.js и npm установлены")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Frontend остановлен")
    finally:
        # Возвращаемся в корневую папку
        os.chdir("..")

def main():
    """Главная функция"""
    print("🏗️  PDF Generator - Полный стек приложения")
    print("=" * 50)
    
    # Проверяем наличие необходимых файлов
    if not os.path.exists("data/Shablon.pdf"):
        print("❌ Файл data/Shablon.pdf не найден!")
        print("📁 Убедитесь, что шаблон PDF находится в папке data/")
        sys.exit(1)
    
    if not os.path.exists("frontend/package.json"):
        print("❌ Frontend не найден!")
        print("📁 Убедитесь, что папка frontend содержит React приложение")
        sys.exit(1)
    
    try:
        # Запускаем backend в отдельном потоке
        backend_thread = Thread(target=run_backend, daemon=True)
        backend_thread.start()
        
        # Даем backend время запуститься
        print("⏳ Ждем запуска backend...")
        time.sleep(3)
        
        # Запускаем frontend (в основном потоке)
        run_frontend()
        
    except KeyboardInterrupt:
        print("\n👋 Приложение остановлено")
        sys.exit(0)

if __name__ == "__main__":
    main()

