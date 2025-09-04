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

def transliterate_cyrillic_to_latin(text):
    """
    Транслитерирует кириллический текст в латиницу согласно правилам для загранпаспорта
    
    Args:
        text (str): Исходный текст на кириллице
        
    Returns:
        str: Текст транслитерированный в латиницу
    """
    if not text:
        return text
    
    # Словарь транслитерации согласно правилам для загранпаспорта
    transliteration_map = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'KH', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH',
        'Ы': 'Y', 'Ъ': 'IE', 'Э': 'E', 'Ю': 'IU', 'Я': 'IA',
        # Строчные буквы
        'а': 'A', 'б': 'B', 'в': 'V', 'г': 'G', 'д': 'D', 'е': 'E', 'ё': 'E',
        'ж': 'ZH', 'з': 'Z', 'и': 'I', 'й': 'Y', 'к': 'K', 'л': 'L', 'м': 'M',
        'н': 'N', 'о': 'O', 'п': 'P', 'р': 'R', 'с': 'S', 'т': 'T', 'у': 'U',
        'ф': 'F', 'х': 'KH', 'ц': 'TS', 'ч': 'CH', 'ш': 'SH', 'щ': 'SHCH',
        'ы': 'Y', 'ъ': 'IE', 'э': 'E', 'ю': 'IU', 'я': 'IA'
    }
    
    # Гласные буквы для проверки позиции мягкого знака
    vowels = {'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я', 
              'а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я'}
    
    result = ""
    i = 0
    while i < len(text):
        char = text[i]
        
        # Специальная обработка мягкого знака (Ь, ь)
        if char in ['Ь', 'ь']:
            # Проверяем следующий символ
            if i + 1 < len(text):
                next_char = text[i + 1]
                
                # Мягкий знак перед гласными
                if next_char in vowels:
                    # Мягкий знак перед гласной заменяется на Y
                    result += 'Y'
                    # Пропускаем следующую гласную, так как она уже учтена в Y
                    if next_char in ['я', 'Я']:
                        result += 'A'
                    elif next_char in ['ю', 'Ю']:
                        result += 'U'
                    elif next_char in ['е', 'Е']:
                        result += 'E'
                    elif next_char in ['ё', 'Ё']:
                        result += 'E'
                    else:
                        # Для других гласных используем обычную транслитерацию
                        if next_char in transliteration_map:
                            result += transliteration_map[next_char]
                        else:
                            result += next_char
                    # Пропускаем следующий символ, так как он уже обработан
                    i += 1
                else:
                    # Если мягкий знак между согласными, он пропадает
                    # (ничего не добавляем в result)
                    pass
            else:
                # Если мягкий знак в конце слова, он пропадает
                # (ничего не добавляем в result)
                pass
        elif char in transliteration_map:
            result += transliteration_map[char]
        else:
            # Если символ не кириллический, оставляем как есть
            result += char
        
        i += 1
    
    return result


def transliterate_license_plate(text):
    """
    Транслитерирует регистрационный знак с кириллицы на латиницу
    Используются только разрешенные для номерных знаков буквы
    
    Args:
        text (str): Регистрационный знак на кириллице
        
    Returns:
        str: Регистрационный знак транслитерированный в латиницу
    """
    if not text:
        return text
    
    # Словарь транслитерации для регистрационных знаков
    # Только буквы, разрешенные в российских номерах
    license_plate_map = {
        'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 
        'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X',
        # Строчные буквы
        'а': 'A', 'в': 'B', 'е': 'E', 'к': 'K', 'м': 'M', 'н': 'H',
        'о': 'O', 'р': 'P', 'с': 'C', 'т': 'T', 'у': 'Y', 'х': 'X'
    }
    
    result = ""
    for char in text:
        if char in license_plate_map:
            result += license_plate_map[char]
        elif char.isdigit():
            # Цифры остаются без изменений
            result += char
        else:
            # Остальные символы (пробелы, дефисы и т.д.) остаются как есть
            result += char
    
    return result


def convert_to_uppercase(text):
    """
    Преобразует текст в заглавные буквы
    Поддерживает как латинские, так и кириллические символы
    
    Args:
        text (str): Исходный текст
        
    Returns:
        str: Текст в заглавных буквах
    """
    if not text:
        return text
    
    return text.upper()


def format_reg_number(reg_number):
    """
    Форматирует регистрационный номер: добавляет 0 в начале региона если он состоит из одной цифры
    
    Args:
        reg_number (str): Регистрационный номер (например: "A123BC7" или "A123BC77")
        
    Returns:
        str: Отформатированный номер (например: "A123BC07" или "A123BC77")
    """
    if not reg_number or len(reg_number) < 7:
        return reg_number
    
    # Разделяем на основную часть (6 символов) и регион (остальные символы)
    main_part = reg_number[:6]
    region_part = reg_number[6:]
    
    # Если регион состоит из одной цифры от 1 до 9, добавляем 0 в начале
    if len(region_part) == 1 and region_part.isdigit() and int(region_part) >= 1:
        region_part = "0" + region_part
    
    return main_part + region_part


def insert_policy_data(fio, address, date_start, date_end, reg_number, vehicle_type, brand_model, output_path):
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
    
    # Транслитерируем ФИО и адрес с кириллицы на латиницу, затем преобразуем в заглавные буквы
    fio_transliterated = transliterate_cyrillic_to_latin(fio)
    address_transliterated = transliterate_cyrillic_to_latin(address)
    
    fio_upper = convert_to_uppercase(fio_transliterated)
    address_upper = convert_to_uppercase(address_transliterated)
    
    # Транслитерируем регистрационный номер (используем специальные правила для номеров)
    reg_number_transliterated = transliterate_license_plate(reg_number)
    
    # Форматируем регистрационный номер (добавляем 0 в регион если нужно)
    formatted_reg_number = format_reg_number(reg_number_transliterated)
    
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
        can.setFont(font_name, 8)  # Фиксированный размер шрифта
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
                current_x += can.stringWidth(' ', font_name, 8)
            
            # Рисуем буквы в слове с уменьшенным интервалом
            for char_idx, char in enumerate(word):
                char_width = can.stringWidth(char, font_name, 8)
                
                # Рисуем символ
                can.drawString(current_x, y_position, char)
                
                current_x += char_width
                if char_idx < len(word) - 1:  # Не добавляем интервал после последней буквы в слове
                    current_x += letter_spacing
    
    # Функция для вставки отдельного компонента даты
    def insert_date_component(component, x_position, y_position):
        can.setFont(font_name, 8)  # Фиксированный размер шрифта
        can.setFillColorRGB(0, 0, 0)
        can.drawString(x_position, y_position, component)
    
    # Функция для центрирования текста в заданном диапазоне
    def insert_centered_text(text_to_center, start_x, end_x, y_position):
        can.setFont(font_name, 8)  # Фиксированный размер шрифта
        can.setFillColorRGB(0, 0, 0)
        
        # Рассчитываем ширину текста
        text_width = can.stringWidth(text_to_center, font_name, 8)
        
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
    
    # Вставляем ФИО (в заглавных буквах)
    insert_text_at_position(fio_upper, start_x, start_y_fio)
    
    # Вставляем адрес (в заглавных буквах)
    insert_text_at_position(address_upper, start_x, start_y_address)
    
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
    insert_text_at_position(formatted_reg_number, reg_number_x, reg_number_y)
    
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
    print(f"  ФИО: '{fio}' -> '{fio_transliterated}' -> '{fio_upper}'")
    print(f"  Адрес: '{address}' -> '{address_transliterated}' -> '{address_upper}'")
    print(f"  Период: {date_start} - {date_end}")
    print(f"  Регистрационный знак: '{reg_number}' -> '{reg_number_transliterated}' -> '{formatted_reg_number}'")
    print(f"  Тип ТС: {vehicle_type}")
    print(f"  Марка и модель: {brand_model}")
    print(f"Файл сохранен: {output_path}")

if __name__ == "__main__":
    # Тестирование функции транслитерации
    print("=== Тест функции transliterate_cyrillic_to_latin ===")
    test_cases = [
        "Иванов Иван Иванович",
        "г. Москва, ул. Пушкина, д. 10, кв. 5",
        "Смирнов Петр Сергеевич",
        "Санкт-Петербург, Невский проспект, д. 25",
        "Дарья",  # Проверка мягкого знака перед гласной -> DARYA
        "Наталья",  # Проверка мягкого знака перед гласной -> NATALYA
        "Игорь",  # Проверка мягкого знака в конце слова -> IGOR (мягкий знак пропадает)
        "Ольга",  # Проверка мягкого знака между согласными -> OLGA (мягкий знак пропадает)
        "Татьяна",  # Проверка мягкого знака перед гласной -> TATYANA
        "Василий",  # й -> Y, получается VASILIY
        "медведь",  # мягкий знак в конце -> MEDVED
        "тетрадь",  # мягкий знак в конце -> TETRAD
        "test latin text",
        "Test Mixed Case 123",
        ""
    ]
    
    for test_text in test_cases:
        result = transliterate_cyrillic_to_latin(test_text)
        print(f"'{test_text}' -> '{result}'")
    
    print("=== Тест завершен ===")
    print()
    
    # Тестирование функции преобразования в заглавные буквы
    print("=== Тест функции convert_to_uppercase ===")
    test_cases = [
        "pupkin kirill vasilivich",
        "g smolensk, ul pushkina, d 7", 
        "test latin text",
        "Test Mixed Case 123",
        ""
    ]
    
    for test_text in test_cases:
        result = convert_to_uppercase(test_text)
        print(f"'{test_text}' -> '{result}'")
    
    print("=== Тест завершен ===")
    print()
    
    # Добавляем тесты для транслитерации регистрационных знаков
    print("\n=== Тест функции transliterate_license_plate ===")
    license_plate_test_cases = [
        "А123ВС77",    # А->A, В->B, С->C
        "М456КО78",    # М->M, К->K, О->O
        "Р789УХ99",    # Р->P, У->Y, Х->X
        "Е001НТ177",   # Е->E, Н->H, Т->T
        "A123BC77",    # Уже на латинице
    ]
    
    for test_plate in license_plate_test_cases:
        result = transliterate_license_plate(test_plate)
        print(f"'{test_plate}' -> '{result}'")
    
    print("=== Тест завершен ===")
    print()
    
    # Вставка данных в PDF полис (теперь с транслитерацией и преобразованием в заглавные)
    insert_policy_data(
        fio="Иванов Игорь Васильевич",  # Игорь -> IGOR (мягкий знак пропадает)
        address="г. Москва, ул. Пушкина, д. 10, кв. 5",  # будет транслитерировано и преобразовано в заглавные
        date_start="15.03.2024",
        date_end="14.03.2025",
        reg_number="А123ВС77",  # будет транслитерировано: А->A, В->B, С->C
        vehicle_type="A",
        brand_model="Toyota LAND CRUISER 150",
        output_path='./out/field_9_filled.pdf'
    )
