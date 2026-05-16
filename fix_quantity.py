path = r'c:\Users\hp\Desktop\Veepee\veepee-app\lib\screens\home\marketplace_home_screen.dart'
with open(path, 'rb') as f:
    content = f.read()

# Fix 1: Fix indentation of quantity: 1 (30 spaces -> 33 spaces to match image:)
old1 = b"                                 image: product['image']?.toString(),\r\n                               quantity: 1,\r\n                               );"
new1 = b"                                 image: product['image']?.toString(),\r\n                                 quantity: 1,\r\n                               );"

# Fix 2: Remove unnecessary braces in string interpolation
old2 = b"'(${reviewCount})'"
new2 = b"'($reviewCount)'"

changes = 0
if old1 in content:
    content = content.replace(old1, new1, 1)
    print("Fixed quantity indentation")
    changes += 1
else:
    print("quantity indentation already correct or not found")

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Fixed unnecessary braces in reviewCount")
    changes += 1
else:
    print("reviewCount braces already correct or not found")

if changes > 0:
    with open(path, 'wb') as f:
        f.write(content)
    print(f"Saved {changes} changes")
