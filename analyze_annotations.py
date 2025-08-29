import json
import math

def get_page(coordinate):
    return math.floor(coordinate)

def get_position(coordinate):
    return coordinate - get_page(coordinate)

# Загружаем аннотации
with open('./data/0b3106da-a713-47b7-90c6-e665bdae74f3.json') as f:
    annotations = json.load(f)

print("Аннотации на первой странице:")
print("=" * 50)

for i, annotation in enumerate(annotations):
    # Проверяем, есть ли вершины на первой странице
    page_1_vertices = [v for v in annotation["vertices"] if get_page(v["x"]) == 1]
    
    if page_1_vertices:
        print(f"\nАннотация {i+1}:")
        print(f"  Тип: {annotation['label']}")
        print(f"  Координаты на странице 1:")
        
        for v in page_1_vertices:
            x_pos = get_position(v["x"])
            y_pos = get_position(v["y"])
            print(f"    x: {v['x']} -> {x_pos:.4f}, y: {v['y']} -> {y_pos:.4f}")
        
        # Вычисляем границы области
        xs = [get_position(v["x"]) for v in page_1_vertices]
        ys = [get_position(v["y"]) for v in page_1_vertices]
        
        min_x = min(xs)
        max_x = max(xs)
        min_y = min(ys)
        max_y = max(ys)
        
        print(f"  Границы области: x({min_x:.4f}-{max_x:.4f}), y({min_y:.4f}-{max_y:.4f})")
        print(f"  Центр: x({(min_x+max_x)/2:.4f}), y({(min_y+max_y)/2:.4f})")

print("\n" + "=" * 50)
print("Рекомендации:")
print("- Поле 9 (NAME AND ADDRESS) обычно находится в нижней части страницы")
print("- Ищите аннотации с большими областями (PARAGRAPH или TITLE)")
print("- Координата y обычно меньше 0.5 для нижней части страницы")

