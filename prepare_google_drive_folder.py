import os
import sys
libs_path = os.path.join(os.path.dirname(__file__), 'libs')
if os.path.exists(libs_path) and libs_path not in sys.path:
    sys.path.insert(0, libs_path)

import json
import shutil
import zipfile

def get_target_google_drive_dirs():
    dirs = [os.path.abspath(os.path.join(os.path.dirname(__file__), 'Google_Drive_P99L'))]
    
    # 1. Check macOS CloudStorage path
    cs_base = os.path.expanduser('~/Library/CloudStorage')
    if os.path.exists(cs_base):
        try:
            for item in os.listdir(cs_base):
                if item.startswith('GoogleDrive-setharith@gmail.com') and not '(' in item:
                    gpath = os.path.join(cs_base, item, 'My Drive', 'Google_Drive_P99L')
                    if gpath not in dirs:
                        dirs.append(gpath)
        except Exception:
            pass

    # 2. Check Windows Google Drive paths
    for drive_letter in ['G:', 'H:', 'I:', 'D:', 'E:']:
        win_gpath = os.path.join(f"{drive_letter}\\", 'My Drive', 'Google_Drive_P99L')
        if os.path.exists(win_gpath) and win_gpath not in dirs:
            dirs.append(win_gpath)
            
    user_prof = os.environ.get('USERPROFILE', '')
    if user_prof:
        for possible in ['Google Drive\\My Drive\\Google_Drive_P99L', 'GoogleDrive-setharith@gmail.com\\My Drive\\Google_Drive_P99L']:
            p = os.path.join(user_prof, possible)
            if os.path.exists(p) and p not in dirs:
                dirs.append(p)

    return dirs

def sync_to_all_destinations():
    target_dirs = get_target_google_drive_dirs()
    project_dir = os.path.dirname(os.path.abspath(__file__))
    brain_dir = os.path.expanduser('~/.gemini/antigravity/brain')

    # Create Brain Backup Zip
    brain_zip_path = os.path.join(project_dir, 'antigravity_brain_backup.zip')
    if os.path.exists(brain_dir):
        try:
            with zipfile.ZipFile(brain_zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, _, files in os.walk(brain_dir):
                    for file in files:
                        full_p = os.path.join(root, file)
                        rel_p = os.path.relpath(full_p, brain_dir)
                        zf.write(full_p, arcname=rel_p)
        except Exception as e:
            print(f"Note: Brain backup zip created with warning: {e}")

    for base_dir in target_dirs:
        try:
            os.makedirs(os.path.join(base_dir, '00_Project_And_Antigravity_Backup'), exist_ok=True)
            os.makedirs(os.path.join(base_dir, '01_Master_Databases'), exist_ok=True)
            os.makedirs(os.path.join(base_dir, '02_Daily_Reports', 'September_2026'), exist_ok=True)
            os.makedirs(os.path.join(base_dir, '02_Daily_Reports', 'August_2026'), exist_ok=True)
            os.makedirs(os.path.join(base_dir, '03_Live_Database'), exist_ok=True)
            os.makedirs(os.path.join(base_dir, '04_Web_Portal'), exist_ok=True)

            # 0. Project & Antigravity Backup
            backup_dest = os.path.join(base_dir, '00_Project_And_Antigravity_Backup')
            for f in ['export_p99l_report.py', 'export_monthly_matrix.py', 'prepare_google_drive_folder.py', 'AGENTS.md', '.env', 'antigravity_brain_backup.zip']:
                src = os.path.join(project_dir, f)
                if os.path.exists(src):
                    shutil.copy2(src, os.path.join(backup_dest, f))

            agents_src = os.path.join(project_dir, '.agents')
            if os.path.exists(agents_src):
                agents_dest = os.path.join(backup_dest, '.agents')
                if os.path.exists(agents_dest):
                    shutil.rmtree(agents_dest)
                shutil.copytree(agents_src, agents_dest)

            # 1. Copy Master Databases
            for f in ['p99l_master_database_september_2026.xlsx', 'monthly_net_summary_september_2026.xlsx', 'p99l_master_database_august_2026.xlsx', 'monthly_net_summary_august_2026.xlsx']:
                src = os.path.join(project_dir, f)
                if os.path.exists(src):
                    shutil.copy2(src, os.path.join(base_dir, '01_Master_Databases', f))

            # 2. Copy August daily archive
            archive_dir = os.path.join(project_dir, 'archive')
            if os.path.exists(archive_dir):
                for f in os.listdir(archive_dir):
                    if f.startswith('total_summary_report_') and f.endswith('.xlsx'):
                        shutil.copy2(os.path.join(archive_dir, f), os.path.join(base_dir, '02_Daily_Reports', 'August_2026', f))

            # 3. Copy Live Database & Local Excels
            json_path = os.path.join(project_dir, 'total_summary_report.json')
            if os.path.exists(json_path):
                shutil.copy2(json_path, os.path.join(base_dir, '03_Live_Database', 'total_summary_report.json'))
                shutil.copy2(json_path, os.path.join(base_dir, '04_Web_Portal', 'total_summary_report.json'))

            # Copy all daily Excels
            for f in os.listdir(project_dir):
                if f.startswith('total_summary_report_') and f.endswith('.xlsx'):
                    parts = f.replace('total_summary_report_', '').replace('.xlsx', '').split('_')
                    if len(parts) == 3:
                        target_month = "September_2026" if parts[1] == '09' else "August_2026"
                        shutil.copy2(os.path.join(project_dir, f), os.path.join(base_dir, '02_Daily_Reports', target_month, f))

            # 4. Copy Web Dashboard Portal files
            for f in ['index.html', 'styles.css', 'app.js']:
                src = os.path.join(project_dir, f)
                if os.path.exists(src):
                    shutil.copy2(src, os.path.join(base_dir, '04_Web_Portal', f))

            print(f"🎉 Successfully synced to: {base_dir}")
        except Exception as e:
            print(f"⚠️ Sync error for {base_dir}: {e}")

if __name__ == '__main__':
    sync_to_all_destinations()
