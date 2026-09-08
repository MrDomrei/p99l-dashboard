import os
import sys
libs_path = os.path.join(os.path.dirname(__file__), 'libs')
if os.path.exists(libs_path) and libs_path not in sys.path:
    sys.path.insert(0, libs_path)

import json
import shutil
import openpyxl

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'Google_Drive_P99L'))
os.makedirs(os.path.join(base_dir, '01_Master_Databases'), exist_ok=True)
os.makedirs(os.path.join(base_dir, '02_Daily_Reports', 'September_2026'), exist_ok=True)
os.makedirs(os.path.join(base_dir, '02_Daily_Reports', 'August_2026'), exist_ok=True)
os.makedirs(os.path.join(base_dir, '03_Live_Database'), exist_ok=True)
os.makedirs(os.path.join(base_dir, '04_Web_Portal'), exist_ok=True)

# 1. Copy Master Databases
for f in ['p99l_master_database_september_2026.xlsx', 'monthly_net_summary_september_2026.xlsx', 'p99l_master_database_august_2026.xlsx', 'monthly_net_summary_august_2026.xlsx']:
    src = os.path.join(os.path.dirname(__file__), f)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(base_dir, '01_Master_Databases', f))

# 2. Copy August daily archive
archive_dir = os.path.join(os.path.dirname(__file__), 'archive')
if os.path.exists(archive_dir):
    for f in os.listdir(archive_dir):
        if f.startswith('total_summary_report_') and f.endswith('.xlsx'):
            shutil.copy2(os.path.join(archive_dir, f), os.path.join(base_dir, '02_Daily_Reports', 'August_2026', f))

# 3. Copy Live Database & Local Excels
json_path = os.path.join(os.path.dirname(__file__), 'total_summary_report.json')
if os.path.exists(json_path):
    shutil.copy2(json_path, os.path.join(base_dir, '03_Live_Database', 'total_summary_report.json'))
    shutil.copy2(json_path, os.path.join(base_dir, '04_Web_Portal', 'total_summary_report.json'))

# Copy any existing daily Excels from root or archive
for f in os.listdir(os.path.dirname(__file__)):
    if f.startswith('total_summary_report_') and f.endswith('.xlsx'):
        parts = f.replace('total_summary_report_', '').replace('.xlsx', '').split('_')
        if len(parts) == 3:
            target_month = "September_2026" if parts[1] == '09' else "August_2026"
            shutil.copy2(os.path.join(os.path.dirname(__file__), f), os.path.join(base_dir, '02_Daily_Reports', target_month, f))

# 4. Copy Web Dashboard Portal files
for f in ['index.html', 'styles.css', 'app.js']:
    src = os.path.join(os.path.dirname(__file__), f)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(base_dir, '04_Web_Portal', f))

print("🎉 Google Drive folder structure successfully created and all files populated at:")
print(base_dir)
