import pdfplumber
import json
import math
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import io
import os

def test_font():
    # Открываем PDF
    document = pdfplumber.open('./data/Shablon.pdf')
    page = document.pages[0]
    page_width = page.width
    page_height = page.height
    
    print(f"Размеры страницы: {page_width} x {page_height}")
    
    # Создаем слой с текстом
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Настройка шрифта с поддержкой кириллицы
    try:
        pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
        font_name = 'STSong-Light'
        print("Использован шрифт STSong-Light (поддержка кириллицы)")
    except:
        try:
            pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
            font_name = 'HeiseiMin-W3'
            print("Использован шрифт HeiseiMin-W3 (поддержка кириллицы)")
        except:
            font_name = 'Helvetica'
            print("Использован стандартный шрифт Helvetica (без поддержки кириллицы)")
    
    # Настройки текста
    can.setFont(font_name, 8)
    can.setFillColorRGB(0, 0, 0)
    
    # Вставляем текст в центр страницы
    text = "Пупкин Василий Олегович"
    text_width = can.stringWidth(text, font_name, 8)
    text_x = (page_width - text_width) / 2
    text_y = page_height / 2
    
    can.drawString(text_x, text_y, text)
    print(f"Вставлен текст: '{text}'")
    print(f"Позиция: ({text_x:.1f}, {text_y:.1f})")
    
    can.save()
    packet.seek(0)
    text_pdf = PdfReader(packet)
    
    # Объединяем с исходным PDF
    reader = PdfReader('./data/Shablon.pdf')
    writer = PdfWriter()
    
    page_obj = reader.pages[0]
    page_obj.merge_page(text_pdf.pages[0])
    
    writer.add_page(page_obj)
    
    # Сохраняем результат
    output_path = './out/test_font.pdf'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as output_file:
        writer.write(output_file)
    
    print(f"\nГотово! Файл сохранен: {output_path}")

if __name__ == "__main__":
    test_font()
