import pdfplumber
import json
import math
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import io
import os

# Пути к файлам
document_path = './data/Shablon.pdf'
output_path = './out/test_field_9_filled.pdf'

def insert_text_in_field_9():
    """Вставляет текст в поле 9 (NAME AND ADDRESS) с поддержкой кириллицы"""
    
    # Читаем исходный PDF
    reader = PdfReader(document_path)
    writer = PdfWriter()
    
    # Получаем размеры страницы
    document = pdfplumber.open(document_path)
    page = document.pages[0]
    page_width = page.width
    page_height = page.height
    
    print(f"Размеры страницы: {page_width} x {page_height}")
    
    # Создаем слой только с нужным текстом
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Регистрируем шрифт с поддержкой кириллицы
    try:
        pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
        font_name = 'STSong-Light'
    except:
        font_name = 'Helvetica'
    
    # Настройки шрифта
    can.setFont(font_name, 12)
    can.setFillColorRGB(0, 0, 0)  # Черный цвет
    
    # Координаты для поля 9 (средняя часть страницы)
    # Примерные координаты для большой области в средней части
    min_x = 0.11 * page_width   # Левая граница
    max_x = 0.50 * page_width   # Правая граница  
    min_y = 0.52 * page_height  # Нижняя граница
    max_y = 0.86 * page_height  # Верхняя граница
    
    # Текст для вставки
    text = "Пупкин Василий Олегович"
    
    # Позиция (центр области)
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    
    # Рисуем текст
    text_width = can.stringWidth(text, font_name, 12)
    can.drawString(center_x - text_width/2, center_y, text)
    
    print(f'Вставлен текст: "{text}" в позицию ({center_x:.1f}, {center_y:.1f})')
    print(f'Область поля: x({min_x:.1f}-{max_x:.1f}), y({min_y:.1f}-{max_y:.1f})')
    
    can.save()
    packet.seek(0)
    text_pdf = PdfReader(packet)
    
    # Объединяем с первой страницей
    page_obj = reader.pages[0]
    page_obj.merge_page(text_pdf.pages[0])
    
    # Добавляем все страницы в результат
    for i, page in enumerate(reader.pages):
        if i == 0:
            writer.add_page(page_obj)  # Модифицированная первая страница
        else:
            writer.add_page(page)
    
    # Сохраняем результат
    os.makedirs('./out', exist_ok=True)
    with open(output_path, 'wb') as output_file:
        writer.write(output_file)
    
    print(f'\nЗаполненный шаблон сохранен в: {output_path}')

if __name__ == "__main__":
    insert_text_in_field_9()

