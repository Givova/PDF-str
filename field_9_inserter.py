from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
import io
import os
from datetime import datetime

def validate_date(date_string):
    """
    Валидация даты в формате DD.MM.YYYY
    Возвращает True если дата корректная, иначе False
    """
    try:
        datetime.strptime(date_string, "%d.%m.%Y")
        return True
    except ValueError:
        return False

def parse_date(date_string):
    """
    Парсинг даты в формате DD.MM.YYYY
    Возвращает tuple (день, месяц, год) как строки
    """
    if not validate_date(date_string):
        raise ValueError(f"Некорректный формат даты: {date_string}. Ожидается DD.MM.YYYY")
    
    day, month, year = date_string.split('.')
    return day, month, year


def insert_policy_data(fio, address, date_start, date_end, reg_number, vehicle_type, brand_model, output_path, font_size=8):
    """
    Функция для вставки всех данных полиса: ФИО, адрес, даты и данные ТС
    
    Args:
        fio (str): ФИО страхователя
        address (str): Адрес страхователя  
        date_start (str): Дата начала полиса в формате DD.MM.YYYY
        date_end (str): Дата окончания полиса в формате DD.MM.YYYY
        reg_number (str): Регистрационный знак
        vehicle_type (str): Тип транспортного средства
        brand_model (str): Марка и модель
        output_path (str): Путь для сохранения файла
        font_size (int): Размер шрифта
    """
    
    # Валидируем даты
    try:
        day_start, month_start, year_start = parse_date(date_start)
        day_end, month_end, year_end = parse_date(date_end)
    except ValueError as e:
        print(f"Ошибка валидации даты: {e}")
        return
    
    # Получаем размеры страницы из PDF
    reader_temp = PdfReader('./data/Shablon.pdf')
    page_temp = reader_temp.pages[0]
    page_width = float(page_temp.mediabox.width)
    page_height = float(page_temp.mediabox.height)
    
    # Координаты для ФИО и адреса (как в предыдущей функции)
    start_x = 45  # Начальная позиция по X (отступ слева)
    start_y_fio = 340  # Позиция ФИО по Y
    start_y_address = start_y_fio - 8  # Позиция адреса по Y
    
    # Координаты для отдельных компонентов дат
    # Дата начала
    day_start_x = 56
    day_start_y = 615
    month_start_x = 100
    month_start_y = 615
    year_start_x = 141
    year_start_y = 615
    
    # Дата окончания
    day_end_x = 189
    day_end_y = 615
    month_end_x = 234
    month_end_y = 615
    year_end_x = 273
    year_end_y = 615
    
    # Координаты для данных транспортного средства
    # Регистрационный знак
    reg_number_x = 150
    reg_number_y = 535
    
    # Тип транспортного средства
    vehicle_type_x = 355
    vehicle_type_y = 535
    
    # Марка и модель (будет рассчитываться автоматически для центрирования)
    brand_model_y = 535
    brand_model_start_x = 430  # Начало области
    brand_model_end_x = 540    # Конец области
    
    # Создаем один слой с текстом
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Настройка шрифта Times New Roman
    font_name = 'Times-Roman'
    print("Использован шрифт Times-Roman (Times New Roman)")
    
    # Функция для вставки текста в заданную позицию
    def insert_text_at_position(text_to_insert, x_position, y_position):
        can.setFont(font_name, font_size)
        can.setFillColorRGB(0, 0, 0)
        
        # Разделяем текст на слова
        words = text_to_insert.split(' ')
        letter_spacing = 0  # Обычный межбуквенный интервал
        
        # Начальная позиция
        current_x = x_position
        
        # Рисуем каждое слово с уменьшенным расстоянием между буквами
        for word_idx, word in enumerate(words):
            if word_idx > 0:
                # Добавляем обычный пробел между словами
                current_x += can.stringWidth(' ', font_name, font_size)
            
            # Рисуем буквы в слове с уменьшенным интервалом
            for char_idx, char in enumerate(word):
                char_width = can.stringWidth(char, font_name, font_size)
                
                # Рисуем символ
                can.drawString(current_x, y_position, char)
                
                current_x += char_width
                if char_idx < len(word) - 1:  # Не добавляем интервал после последней буквы в слове
                    current_x += letter_spacing
    
    # Функция для вставки отдельного компонента даты
    def insert_date_component(component, x_position, y_position):
        can.setFont(font_name, font_size)
        can.setFillColorRGB(0, 0, 0)
        can.drawString(x_position, y_position, component)
    
    # Функция для центрирования текста в заданном диапазоне
    def insert_centered_text(text_to_center, start_x, end_x, y_position):
        can.setFont(font_name, font_size)
        can.setFillColorRGB(0, 0, 0)
        
        # Рассчитываем ширину текста
        text_width = can.stringWidth(text_to_center, font_name, font_size)
        
        # Рассчитываем ширину доступной области
        available_width = end_x - start_x
        
        # Рассчитываем x-координату для центрирования
        center_x = start_x + (available_width - text_width) / 2
        
        # Вставляем текст
        can.drawString(center_x, y_position, text_to_center)
        
        print(f"Текст '{text_to_center}' центрирован:")
        print(f"  Область: {start_x}-{end_x} (ширина: {available_width})")
        print(f"  Ширина текста: {text_width}")
        print(f"  Позиция: x={center_x:.1f}, y={y_position}")
    
    # Вставляем ФИО
    insert_text_at_position(fio, start_x, start_y_fio)
    
    # Вставляем адрес
    insert_text_at_position(address, start_x, start_y_address)
    
    # Вставляем отдельные компоненты дат
    # Дата начала
    insert_date_component(day_start, day_start_x, day_start_y)
    insert_date_component(month_start, month_start_x, month_start_y)
    insert_date_component(year_start, year_start_x, year_start_y)
    
    # Дата окончания
    insert_date_component(day_end, day_end_x, day_end_y)
    insert_date_component(month_end, month_end_x, month_end_y)
    insert_date_component(year_end, year_end_x, year_end_y)
    
    # Вставляем данные транспортного средства
    # Регистрационный знак
    insert_text_at_position(reg_number, reg_number_x, reg_number_y)
    
    # Тип транспортного средства
    insert_text_at_position(vehicle_type, vehicle_type_x, vehicle_type_y)
    
    # Марка и модель (центрированная)
    insert_centered_text(brand_model, brand_model_start_x, brand_model_end_x, brand_model_y)
    
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
    
    print(f"Данные полиса вставлены:")
    print(f"  ФИО: {fio}")
    print(f"  Адрес: {address}")
    print(f"  Период: {date_start} - {date_end}")
    print(f"  Регистрационный знак: {reg_number}")
    print(f"  Тип ТС: {vehicle_type}")
    print(f"  Марка и модель: {brand_model}")
    print(f"Файл сохранен: {output_path}")

if __name__ == "__main__":
    # Вставка данных в PDF полис
    insert_policy_data(
        fio="PUPKIN KIRILL VASILIVICH",
        address="G SMOLENSK, UL PUSHKINA, D 7",
        date_start="15.03.2024",
        date_end="14.03.2025",
        reg_number="A123BC77",
        vehicle_type="B",
        brand_model="Toyota LAND CRUISER 150",
        output_path='./out/field_9_filled.pdf',
        font_size=8
    )
