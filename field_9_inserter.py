import pdfplumber
import json
import math
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import io
import os

def insert_text_to_field_9_with_address(text, address_text, output_path, font_size=8):
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
    
    # Жестко заданные координаты для позиционирования
    start_x = 45  # Начальная позиция по X (отступ слева)
    start_y_fio = 340  # Позиция ФИО по Y
    start_y_address = start_y_fio - 8  # Позиция адреса по Y (12 пикселей ниже ФИО)
    
    # Создаем один слой с текстом
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Настройка шрифта Times New Roman
    font_name = 'Times-Roman'
    print("Использован шрифт Times-Roman (Times New Roman)")
    
    # Функция для вставки текста
    def insert_text_at_position(text_to_insert, y_position):
        can.setFont(font_name, font_size)
        can.setFillColorRGB(0, 0, 0)
        
        # Разделяем текст на слова
        words = text_to_insert.split(' ')
        letter_spacing = 0  # Обычный межбуквенный интервал
        
        # Начальная позиция (жестко заданная)
        current_x = start_x
        
        # Рисуем каждое слово с уменьшенным расстоянием между буквами
        for word_idx, word in enumerate(words):
            if word_idx > 0:
                # Добавляем обычный пробел между словами
                current_x += can.stringWidth(' ', font_name, font_size)
            
            # Рисуем буквы в слове с уменьшенным интервалом
            for char_idx, char in enumerate(word):
                char_width = can.stringWidth(char, font_name, font_size)
                
                # Рисуем символ один раз (обычная толщина)
                can.drawString(current_x, y_position, char)
                
                current_x += char_width
                if char_idx < len(word) - 1:  # Не добавляем интервал после последней буквы в слове
                    current_x += letter_spacing
    
    # Вставляем ФИО
    insert_text_at_position(text, start_y_fio)
    
    # Вставляем адрес
    insert_text_at_position(address_text, start_y_address)
    
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
    
    print(f"ФИО '{text}' и адрес '{address_text}' вставлены в поле 9")
    print(f"Файл сохранен: {output_path}")

if __name__ == "__main__":
    insert_text_to_field_9_with_address(
        text="PUPKIN KIRILL VASILIVICH",
        address_text="G SMOLENSK, UL PUSHKINA, D 7",
        output_path='./out/field_9_filled.pdf',
        font_size=8
    )
