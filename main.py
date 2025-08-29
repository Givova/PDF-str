import pdfplumber
import json
import math
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import io
import os

# Изменяем путь на ваш шаблон
document_path = './data/Shablon.pdf'
annotations_path = './data/0b3106da-a713-47b7-90c6-e665bdae74f3.json'
output_path = './out/filled_shablon.pdf'

# Загружаем данные
document = pdfplumber.open(document_path)
with open(annotations_path) as f:
    annotations = json.load(f)

def get_page(coordinate):
    return math.floor(coordinate)

def get_position(coordinate):
    return coordinate - get_page(coordinate)

def insert_specific_text():
    """Вставляет конкретный текст в поле 9 (NAME AND ADDRESS) с поддержкой кириллицы"""
    
    # Читаем исходный PDF
    reader = PdfReader(document_path)
    writer = PdfWriter()
    
    # Находим аннотацию для поля 9 (большая область в средней части страницы)
    field_9_candidates = []
    for annotation in annotations:
        page_1_vertices = [v for v in annotation["vertices"] if get_page(v["x"]) == 1]
        
        if page_1_vertices and annotation["label"] == "PARAGRAPH":
            # Вычисляем границы области
            xs = [get_position(v["x"]) for v in page_1_vertices]
            ys = [get_position(v["y"]) for v in page_1_vertices]
            
            min_x = min(xs)
            max_x = max(xs)
            min_y = min(ys)
            max_y = max(ys)
            
            # Вычисляем размер области
            width = max_x - min_x
            height = max_y - min_y
            area = width * height
            
            # Поле 9 должно быть в средней части страницы (0.4 < y < 0.9) и иметь большую площадь
            if 0.4 < min_y < 0.9 and area > 0.1:
                field_9_candidates.append({
                    'annotation': annotation,
                    'min_y': min_y,
                    'max_y': max_y,
                    'center_y': (min_y + max_y) / 2,
                    'area': area,
                    'width': width,
                    'height': height
                })
    
    # Сортируем по площади области (самая большая область - это поле 9)
    field_9_candidates.sort(key=lambda x: x['area'], reverse=True)
    
    if field_9_candidates:
        target_annotation = field_9_candidates[0]['annotation']
        print(f"Найдена аннотация для поля 9:")
        print(f"  Координаты: y({field_9_candidates[0]['min_y']:.4f}-{field_9_candidates[0]['max_y']:.4f})")
        print(f"  Размер: {field_9_candidates[0]['width']:.4f} x {field_9_candidates[0]['height']:.4f}")
        print(f"  Площадь: {field_9_candidates[0]['area']:.4f}")
    else:
        print("Не найдена подходящая аннотация для поля 9")
        # Fallback на первую PARAGRAPH аннотацию
        target_annotation = None
        for annotation in annotations:
            if (annotation["label"] == "PARAGRAPH" and 
                any(get_page(vertex["x"]) == 1 for vertex in annotation["vertices"])):
                target_annotation = annotation
                break
    
    if target_annotation:
        # Получаем размеры страницы
        page = document.pages[0]
        page_width = page.width
        page_height = page.height
        
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
        
        # Вычисляем координаты для вставки
        xs = list(map(lambda vertex: vertex["x"], target_annotation["vertices"]))
        ys = list(map(lambda vertex: vertex["y"], target_annotation["vertices"]))
        
        min_x = get_position(min(xs)) * page_width
        max_x = get_position(max(xs)) * page_width
        min_y = get_position(min(ys)) * page_height
        max_y = get_position(max(ys)) * page_height
        
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
    else:
        print("Не найдена подходящая аннотация для вставки текста")
        # Копируем все страницы без изменений
        for page in reader.pages:
            writer.add_page(page)
    
    # Сохраняем результат
    os.makedirs('./out', exist_ok=True)
    with open(output_path, 'wb') as output_file:
        writer.write(output_file)
    
    print(f'\nЗаполненный шаблон сохранен в: {output_path}')

def draw_page_with_text(page_number):
    """Альтернативный метод - создает изображения с текстом"""
    page = document.pages[page_number - 1]
    page_annotations = filter(
        lambda annotation: any(
            map(lambda vertex: get_page(vertex["x"]) == page_number, annotation["vertices"])
        ), 
        annotations
    )
    image = page.to_image(resolution=100)
    
    print(f'page_number: {page_number}, width: {page.width}, height: {page.height}')
    
    for annotation in page_annotations:
        xs = list(map(lambda vertex: vertex["x"], annotation["vertices"]))
        ys = list(map(lambda vertex: vertex["y"], annotation["vertices"]))
        
        min_x = get_position(min(xs)) * page.width
        max_x = get_position(max(xs)) * page.width
        min_y = get_position(min(ys)) * page.height
        max_y = get_position(max(ys)) * page.height
        
        # Рисуем прямоугольник
        image.draw_rect([min_x, min_y, max_x, max_y], stroke="red", stroke_width=2)
        
        # Добавляем текст
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Определяем текст для отображения
        if annotation["label"] == "PARAGRAPH" and page_number == 1:
            text = "Пупкин Василий Олегович"
        else:
            text = annotation["label"]
        
        image.draw_text(
            [center_x, center_y], 
            text, 
            font_size=12, 
            color="red"
        )
        
        print(f'label: {annotation["label"]}, text: "{text}", pos: ({center_x:.1f}, {center_y:.1f})')
    
    image.save(f'out/page-{page_number}-with-text.png')

# Основная функция
if __name__ == "__main__":
    print("Выберите режим работы:")
    print("1. Вставить ФИО в поле 9 (правильная позиция)")
    print("2. Создать изображения с текстом")
    
    choice = input("Введите 1 или 2: ").strip()
    
    if choice == "1":
        print("\nВставка ФИО в поле 9...")
        insert_specific_text()
    elif choice == "2":
        print("\nСоздание изображений с текстом...")
        for page_number in range(1, len(document.pages) + 1):
            draw_page_with_text(page_number)
    else:
        print("Неверный выбор. Запускаю режим 1 по умолчанию.")
        insert_specific_text()
