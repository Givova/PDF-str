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

class CorrectPositionInserter:
    def __init__(self, template_path, annotations_path):
        self.template_path = template_path
        self.annotations_path = annotations_path
        self.document = pdfplumber.open(template_path)
        
        with open(annotations_path) as f:
            self.annotations = json.load(f)
    
    def get_page(self, coordinate):
        return math.floor(coordinate)
    
    def get_position(self, coordinate):
        return coordinate - self.get_page(coordinate)
    
    def find_field_9_annotation(self):
        """Находит аннотацию для поля 9 (NAME AND ADDRESS)"""
        # Ищем аннотации на первой странице с координатами в нижней части
        field_9_candidates = []
        
        for i, annotation in enumerate(self.annotations):
            page_1_vertices = [v for v in annotation["vertices"] if self.get_page(v["x"]) == 1]
            
            if page_1_vertices and annotation["label"] == "PARAGRAPH":
                # Вычисляем границы области
                xs = [self.get_position(v["x"]) for v in page_1_vertices]
                ys = [self.get_position(v["y"]) for v in page_1_vertices]
                
                min_y = min(ys)
                max_y = max(ys)
                
                # Поле 9 должно быть в нижней части страницы (y > 0.7)
                if min_y > 0.7:
                    field_9_candidates.append({
                        'index': i,
                        'annotation': annotation,
                        'min_y': min_y,
                        'max_y': max_y,
                        'center_y': (min_y + max_y) / 2
                    })
        
        # Сортируем по координате y (самая нижняя область - это поле 9)
        field_9_candidates.sort(key=lambda x: x['center_y'], reverse=True)
        
        if field_9_candidates:
            print(f"Найдены кандидаты для поля 9:")
            for i, candidate in enumerate(field_9_candidates[:3]):
                print(f"  {i+1}. Аннотация {candidate['index']}: y({candidate['min_y']:.4f}-{candidate['max_y']:.4f}), центр: {candidate['center_y']:.4f}")
            
            return field_9_candidates[0]['annotation']
        
        return None
    
    def insert_text_in_field_9(self, text, output_path):
        """Вставляет текст в поле 9 (NAME AND ADDRESS)"""
        
        # Находим аннотацию для поля 9
        field_9_annotation = self.find_field_9_annotation()
        
        if not field_9_annotation:
            print("Не найдена аннотация для поля 9!")
            return
        
        # Читаем исходный PDF
        reader = PdfReader(self.template_path)
        writer = PdfWriter()
        
        # Получаем размеры страницы
        page = self.document.pages[0]
        page_width = page.width
        page_height = page.height
        
        # Создаем слой с текстом
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
        xs = list(map(lambda vertex: vertex["x"], field_9_annotation["vertices"]))
        ys = list(map(lambda vertex: vertex["y"], field_9_annotation["vertices"]))
        
        min_x = self.get_position(min(xs)) * page_width
        max_x = self.get_position(max(xs)) * page_width
        min_y = self.get_position(min(ys)) * page_height
        max_y = self.get_position(max(ys)) * page_height
        
        # Позиция для текста (центр области)
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Рисуем текст
        text_width = can.stringWidth(text, font_name, 12)
        can.drawString(center_x - text_width/2, center_y, text)
        
        print(f'Вставлен текст: "{text}" в позицию ({center_x:.1f}, {center_y:.1f})')
        print(f'Область поля 9: x({min_x:.1f}-{max_x:.1f}), y({min_y:.1f}-{max_y:.1f})')
        
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
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        print(f'\nЗаполненный шаблон сохранен в: {output_path}')

# Пример использования
if __name__ == "__main__":
    # Инициализация
    inserter = CorrectPositionInserter(
        template_path='./data/Shablon.pdf',
        annotations_path='./data/0b3106da-a713-47b7-90c6-e665bdae74f3.json'
    )
    
    # Вставляем текст в поле 9
    inserter.insert_text_in_field_9(
        text="Пупкин Василий Олегович",
        output_path='./out/correct_field_9_filled.pdf'
    )

