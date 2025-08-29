import pdfplumber
import json
import math
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
import os

class PDFTextInserter:
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
    
    def insert_text_at_coordinates(self, text_mappings, output_path):
        """
        Вставляет текст в PDF по заданным координатам
        
        text_mappings: список словарей с ключами:
        - 'page': номер страницы (начиная с 1)
        - 'label': тип аннотации для поиска
        - 'text': текст для вставки
        - 'font_size': размер шрифта (опционально, по умолчанию 12)
        - 'color': цвет текста (опционально, по умолчанию черный)
        """
        
        reader = PdfReader(self.template_path)
        writer = PdfWriter()
        
        # Группируем тексты по страницам
        page_texts = {}
        for mapping in text_mappings:
            page_num = mapping['page']
            if page_num not in page_texts:
                page_texts[page_num] = []
            page_texts[page_num].append(mapping)
        
        # Обрабатываем каждую страницу
        for page_number in range(1, len(reader.pages) + 1):
            page_obj = reader.pages[page_number - 1]
            
            if page_number in page_texts:
                # Получаем размеры страницы
                page = self.document.pages[page_number - 1]
                page_width = page.width
                page_height = page.height
                
                # Создаем слой с текстом
                packet = io.BytesIO()
                can = canvas.Canvas(packet, pagesize=(page_width, page_height))
                
                # Обрабатываем каждый текст для этой страницы
                for text_mapping in page_texts[page_number]:
                    self._insert_single_text(
                        can, text_mapping, page_number, page_width, page_height
                    )
                
                can.save()
                packet.seek(0)
                text_pdf = PdfReader(packet)
                
                # Объединяем с исходной страницей
                page_obj.merge_page(text_pdf.pages[0])
            
            writer.add_page(page_obj)
        
        # Сохраняем результат
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        print(f'Заполненный шаблон сохранен в: {output_path}')
    
    def _insert_single_text(self, canvas_obj, text_mapping, page_number, page_width, page_height):
        """Вставляет один текст на канвас"""
        
        # Настройки текста
        text = text_mapping['text']
        font_size = text_mapping.get('font_size', 12)
        color = text_mapping.get('color', (0, 0, 0))  # Черный по умолчанию
        label = text_mapping['label']
        
        # Находим подходящую аннотацию
        target_annotation = None
        for annotation in self.annotations:
            if (annotation["label"] == label and 
                any(self.get_page(vertex["x"]) == page_number for vertex in annotation["vertices"])):
                target_annotation = annotation
                break
        
        if target_annotation:
            # Вычисляем координаты
            xs = list(map(lambda vertex: vertex["x"], target_annotation["vertices"]))
            ys = list(map(lambda vertex: vertex["y"], target_annotation["vertices"]))
            
            min_x = self.get_position(min(xs)) * page_width
            max_x = self.get_position(max(xs)) * page_width
            min_y = self.get_position(min(ys)) * page_height
            max_y = self.get_position(max(ys)) * page_height
            
            # Позиция для текста (центр области)
            center_x = (min_x + max_x) / 2
            center_y = (min_y + max_y) / 2
            
            # Настройки шрифта
            canvas_obj.setFont("Helvetica", font_size)
            canvas_obj.setFillColorRGB(*color)
            
            # Рисуем текст
            text_width = canvas_obj.stringWidth(text, "Helvetica", font_size)
            canvas_obj.drawString(center_x - text_width/2, center_y, text)
            
            print(f'Вставлен текст: "{text}" в позицию ({center_x:.1f}, {center_y:.1f}) на странице {page_number}')
        else:
            print(f'Не найдена аннотация с типом "{label}" на странице {page_number}')
    
    def list_available_annotations(self):
        """Выводит список доступных аннотаций"""
        print("Доступные аннотации:")
        for annotation in self.annotations:
            page_num = self.get_page(annotation["vertices"][0]["x"])
            print(f"Страница {page_num}: {annotation['label']}")

# Пример использования
if __name__ == "__main__":
    # Инициализация
    inserter = PDFTextInserter(
        template_path='./data/Shablon.pdf',
        annotations_path='./data/0b3106da-a713-47b7-90c6-e665bdae74f3.json'
    )
    
    # Показываем доступные аннотации
    inserter.list_available_annotations()
    
    # Определяем тексты для вставки
    text_mappings = [
        {
            'page': 1,
            'label': 'PARAGRAPH',
            'text': 'ФИО: Пупкин Василий Олегович',
            'font_size': 14,
            'color': (0, 0, 0)  # Черный
        },
        # Можно добавить больше текстов для других аннотаций
        # {
        #     'page': 1,
        #     'label': 'TITLE',
        #     'text': 'Заголовок документа',
        #     'font_size': 16,
        #     'color': (1, 0, 0)  # Красный
        # }
    ]
    
    # Вставляем текст
    inserter.insert_text_at_coordinates(
        text_mappings=text_mappings,
        output_path='./out/custom_filled_shablon.pdf'
    )

