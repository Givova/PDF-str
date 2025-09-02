from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
from datetime import datetime
from field_9_inserter import validate_date, parse_date, insert_policy_data, convert_to_uppercase

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для фронтенда

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    """
    API endpoint для генерации PDF с данными из формы
    """
    try:
        # Получаем данные из запроса
        data = request.get_json()
        
        # Валидируем обязательные поля
        required_fields = ['fio', 'address', 'date_start', 'date_end', 'reg_number', 'vehicle_type', 'brand_model']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({'error': f'Поле {field} обязательно для заполнения'}), 400
        
        # Валидируем даты
        try:
            validate_date(data['date_start'])
            validate_date(data['date_end'])
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Создаем временный файл для PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            temp_path = tmp_file.name
        
        # Генерируем PDF
        insert_policy_data(
            fio=data['fio'],
            address=data['address'],
            date_start=data['date_start'],
            date_end=data['date_end'],
            reg_number=data['reg_number'],
            vehicle_type=data['vehicle_type'],
            brand_model=data['brand_model'],
            output_path=temp_path
        )
        
        # Возвращаем файл
        return send_file(
            temp_path,
            as_attachment=True,
            download_name=f'policy_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf',
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': f'Ошибка при генерации PDF: {str(e)}'}), 500
    
    finally:
        # Удаляем временный файл после отправки
        try:
            if 'temp_path' in locals():
                os.unlink(temp_path)
        except:
            pass

@app.route('/api/health', methods=['GET'])
def health_check():
    """Проверка работоспособности API"""
    return jsonify({'status': 'OK', 'message': 'PDF Generator API работает'})

@app.route('/api/validate-date', methods=['POST'])
def validate_date_endpoint():
    """Валидация даты"""
    try:
        data = request.get_json()
        date_string = data.get('date')
        
        if not date_string:
            return jsonify({'valid': False, 'error': 'Дата не указана'}), 400
            
        if validate_date(date_string):
            return jsonify({'valid': True})
        else:
            return jsonify({'valid': False, 'error': 'Неверный формат даты'})
            
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 400

@app.route('/api/convert-uppercase', methods=['POST'])
def convert_uppercase_endpoint():
    """Преобразование текста в заглавные буквы"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Данные не переданы'}), 400
        
        result = {}
        
        # Преобразуем ФИО если передано
        if 'fio' in data:
            result['fio'] = convert_to_uppercase(data['fio'])
        
        # Преобразуем адрес если передан
        if 'address' in data:
            result['address'] = convert_to_uppercase(data['address'])
        
        # Преобразуем любой другой текст если передан
        if 'text' in data:
            result['text'] = convert_to_uppercase(data['text'])
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Ошибка при преобразовании: {str(e)}'}), 500

@app.route('/api/vehicle-brands', methods=['GET'])
def get_vehicle_brands():
    """Получение списка марок автомобилей"""
    try:
        import json
        
        # Читаем JSON файл с моделями
        with open('./data/models.json', 'r', encoding='utf-8') as f:
            models_data = json.load(f)
        
        # Извлекаем марки
        brands = []
        for brand in models_data.get('data', []):
            brands.append({
                'id': brand['id'],
                'name': brand['name'],
                'cyrillic_name': brand.get('cyrillic_name', brand['name'])
            })
        
        return jsonify({'brands': brands})
        
    except Exception as e:
        return jsonify({'error': f'Ошибка при загрузке марок: {str(e)}'}), 500

@app.route('/api/vehicle-models/<brand_id>', methods=['GET'])
def get_vehicle_models(brand_id):
    """Получение списка моделей для определенной марки"""
    try:
        import json
        
        # Читаем JSON файл с моделями
        with open('./data/models.json', 'r', encoding='utf-8') as f:
            models_data = json.load(f)
        
        # Ищем марку
        models = []
        for brand in models_data.get('data', []):
            if brand['id'] == brand_id.upper():
                for model in brand.get('models', []):
                    models.append({
                        'id': model['id'],
                        'name': model['name'],
                        'cyrillic_name': model.get('cyrillic_name', model['name']),
                        'full_name': f"{brand['name']} {model['name']}"
                    })
                break
        
        return jsonify({'models': models})
        
    except Exception as e:
        return jsonify({'error': f'Ошибка при загрузке моделей: {str(e)}'}), 500

@app.route('/api/search-vehicles', methods=['GET'])
def search_vehicles():
    """Поиск марок и моделей по запросу"""
    try:
        import json
        query = request.args.get('q', '').strip().lower()
        
        if not query or len(query) < 2:
            return jsonify({'results': []})
        
        # Читаем JSON файл с моделями
        with open('./data/models.json', 'r', encoding='utf-8') as f:
            models_data = json.load(f)
        
        results = []
        
        # Поиск по маркам и моделям
        for brand in models_data.get('data', []):
            brand_name = brand['name'].lower()
            brand_cyrillic = brand.get('cyrillic_name', '').lower()
            
            # Поиск по названию марки
            if query in brand_name or query in brand_cyrillic:
                results.append({
                    'type': 'brand',
                    'value': brand['name'],
                    'label': f"{brand['name']} ({brand.get('cyrillic_name', brand['name'])})"
                })
            
            # Поиск по моделям
            for model in brand.get('models', []):
                model_name = model['name'].lower()
                model_cyrillic = model.get('cyrillic_name', '').lower()
                full_name = f"{brand['name']} {model['name']}".lower()
                
                if query in model_name or query in model_cyrillic or query in full_name:
                    results.append({
                        'type': 'model',
                        'value': f"{brand['name']} {model['name']}",
                        'label': f"{brand['name']} {model['name']} ({model.get('cyrillic_name', model['name'])})"
                    })
        
        # Ограничиваем результаты
        results = results[:20]
        
        return jsonify({'results': results})
        
    except Exception as e:
        return jsonify({'error': f'Ошибка при поиске: {str(e)}'}), 500

if __name__ == '__main__':
    # Проверяем наличие необходимых файлов
    if not os.path.exists('./data/Shablon.pdf'):
        print("ОШИБКА: Файл ./data/Shablon.pdf не найден")
        exit(1)
    
    print("🚀 Запуск PDF Generator API...")
    print("📄 Шаблон PDF: ./data/Shablon.pdf")
    print("🌐 API доступен по адресу: http://localhost:5000")
    print("📝 Endpoints:")
    print("   POST /api/generate-pdf - Генерация PDF")
    print("   GET  /api/health - Проверка работоспособности")
    print("   POST /api/validate-date - Валидация даты")
    print("   POST /api/convert-uppercase - Преобразование в заглавные буквы")
    print("   GET  /api/vehicle-brands - Список марок автомобилей")
    print("   GET  /api/vehicle-models/<brand_id> - Модели для марки")
    print("   GET  /api/search-vehicles?q=<query> - Поиск марок и моделей")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
