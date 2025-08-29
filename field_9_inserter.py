import pdfplumber
import json
import math
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import io
import os

def insert_text_to_field_9(text, output_path, font_size=8):
    # Загружаем PDF и аннотации
    document = pdfplumber.open('./data/Shablon.pdf')
    with open('./data/field_9_annotations.json', 'r', encoding='utf-8') as f:
        annotations = json.load(f)
    
    # Получаем размеры страницы
    page = document.pages[0]
    page_width = page.width
    page_height = page.height
    
    # Находим аннотацию поля 9
    field_9_annotation = annotations[0]  # Используем первую аннотацию
    
    # Вычисляем координаты
    def get_position(coordinate):
        return coordinate - math.floor(coordinate)
    
    xs = [vertex["x"] for vertex in field_9_annotation["vertices"]]
    ys = [vertex["y"] for vertex in field_9_annotation["vertices"]]
    
    min_x = get_position(min(xs)) * page_width
    max_x = get_position(max(xs)) * page_width
    min_y = get_position(min(ys)) * page_height
    max_y = get_position(max(ys)) * page_height
    
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2 + 5  # Небольшое смещение
    
    # Создаем слой с текстом
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Настройка шрифта Times New Roman
    font_name = 'Times-Roman'
    print("Использован шрифт Times-Roman (Times New Roman)")
    
    # Вставляем текст с уменьшенным расстоянием между буквами в словах
    can.setFont(font_name, font_size)
    can.setFillColorRGB(0, 0, 0)
    
    # Разделяем текст на слова
    words = text.split(' ')
    letter_spacing = 0  # Обычный межбуквенный интервал
    
    # Вычисляем общую ширину текста с учетом межбуквенного интервала
    total_width = 0
    for i, word in enumerate(words):
        if i > 0:
            total_width += can.stringWidth(' ', font_name, font_size)  # Пробел между словами
        
        for j, char in enumerate(word):
            total_width += can.stringWidth(char, font_name, font_size)
            if j < len(word) - 1:  # Не добавляем интервал после последней буквы в слове
                total_width += letter_spacing
    
    # Начальная позиция (сдвинута влево на 40 пикселей)
    current_x = center_x - total_width / 2 - 86
    
    # Рисуем каждое слово с уменьшенным расстоянием между буквами
    for word_idx, word in enumerate(words):
        if word_idx > 0:
            # Добавляем обычный пробел между словами
            current_x += can.stringWidth(' ', font_name, font_size)
        
        # Рисуем буквы в слове с уменьшенным интервалом
        for char_idx, char in enumerate(word):
            char_width = can.stringWidth(char, font_name, font_size)
            
            # Рисуем символ один раз (обычная толщина)
            can.drawString(current_x, center_y, char)
            
            current_x += char_width
            if char_idx < len(word) - 1:  # Не добавляем интервал после последней буквы в слове
                current_x += letter_spacing
    
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
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as output_file:
        writer.write(output_file)
    
    print(f"Текст '{text}' вставлен в поле 9")
    print(f"Файл сохранен: {output_path}")

def insert_address_text(address_text, output_path, font_size=8):
    # Загружаем PDF и аннотации
    document = pdfplumber.open('./data/Shablon.pdf')
    with open('./data/field_9_annotations.json', 'r', encoding='utf-8') as f:
        annotations = json.load(f)
    
    # Получаем размеры страницы
    page = document.pages[0]
    page_width = page.width
    page_height = page.height
    
    # Находим аннотацию поля 9
    field_9_annotation = annotations[0]  # Используем первую аннотацию
    
    # Вычисляем координаты
    def get_position(coordinate):
        return coordinate - math.floor(coordinate)
    
    xs = [vertex["x"] for vertex in field_9_annotation["vertices"]]
    ys = [vertex["y"] for vertex in field_9_annotation["vertices"]]
    
    min_x = get_position(min(xs)) * page_width
    max_x = get_position(max(xs)) * page_width
    min_y = get_position(min(ys)) * page_height
    max_y = get_position(max(ys)) * page_height
    
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2 - 8  # Уменьшенное смещение вниз для адреса
    
    # Создаем слой с текстом
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Настройка шрифта Times New Roman
    font_name = 'Times-Roman'
    print("Использован шрифт Times-Roman (Times New Roman)")
    
    # Вставляем текст с уменьшенным расстоянием между буквами в словах
    can.setFont(font_name, font_size)
    can.setFillColorRGB(0, 0, 0)
    
    # Разделяем текст на слова
    words = address_text.split(' ')
    letter_spacing = 0  # Обычный межбуквенный интервал
    
    # Вычисляем общую ширину текста с учетом межбуквенного интервала
    total_width = 0
    for i, word in enumerate(words):
        if i > 0:
            total_width += can.stringWidth(' ', font_name, font_size)  # Пробел между словами
        
        for j, char in enumerate(word):
            total_width += can.stringWidth(char, font_name, font_size)
            if j < len(word) - 1:  # Не добавляем интервал после последней буквы в слове
                total_width += letter_spacing
    
    # Начальная позиция (сдвинута влево на 86 пикселей, как у ФИО)
    current_x = center_x - total_width / 2 - 86
    
    # Рисуем каждое слово с уменьшенным расстоянием между буквами
    for word_idx, word in enumerate(words):
        if word_idx > 0:
            # Добавляем обычный пробел между словами
            current_x += can.stringWidth(' ', font_name, font_size)
        
        # Рисуем буквы в слове с уменьшенным интервалом
        for char_idx, char in enumerate(word):
            char_width = can.stringWidth(char, font_name, font_size)
            
            # Рисуем символ один раз (обычная толщина)
            can.drawString(current_x, center_y, char)
            
            current_x += char_width
            if char_idx < len(word) - 1:  # Не добавляем интервал после последней буквы в слове
                current_x += letter_spacing
    
    can.save()
    packet.seek(0)
    text_pdf = PdfReader(packet)
    
    # Объединяем с существующим PDF (если он существует)
    if os.path.exists(output_path):
        reader = PdfReader(output_path)
    else:
        reader = PdfReader('./data/Shablon.pdf')
    
    writer = PdfWriter()
    
    page_obj = reader.pages[0]
    page_obj.merge_page(text_pdf.pages[0])
    writer.add_page(page_obj)
    
    # Сохраняем результат
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as output_file:
        writer.write(output_file)
    
    print(f"Адрес '{address_text}' вставлен под полем 9")
    print(f"Файл сохранен: {output_path}")

if __name__ == "__main__":
    insert_text_to_field_9(
        text="PUPKIN KIRILL VASILIVICH",
        output_path='./out/field_9_filled.pdf',
        font_size=8
    )
    insert_address_text(
        address_text="G SMOLENSK, UL PUSHKINA, D 7",
        output_path='./out/field_9_filled.pdf',
        font_size=8
    )
