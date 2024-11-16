import os
from datetime import datetime

def generate_project_structure(start_path='.', output_file='project_structure.txt', ignore_patterns=None):
    if ignore_patterns is None:
        ignore_patterns = {
            '.git', 'node_modules', '.next', 'out', '.vercel',
            '__pycache__', '.env', '.env.local', '*.pyc', '*.pyo',
            '.DS_Store', 'Thumbs.db'
        }

    def should_ignore(path):
        return any(pattern in path for pattern in ignore_patterns)

    with open(output_file, 'w', encoding='utf-8') as f:
        # Write header
        f.write(f"Project Structure Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")

        # Write directory structure
        f.write("Directory Structure:\n")
        f.write("-" * 50 + "\n")
        for root, dirs, files in os.walk(start_path):
            if should_ignore(root):
                continue
            
            level = root.replace(start_path, '').count(os.sep)
            indent = '│   ' * level
            f.write(f"{indent}├── {os.path.basename(root)}/\n")
            
            # Sort and filter files
            valid_files = [file for file in sorted(files) 
                         if not any(pattern in file for pattern in ignore_patterns)]
            
            for file in valid_files:
                indent = '│   ' * (level + 1)
                f.write(f"{indent}├── {file}\n")

        # Write file contents
        f.write("\n\nFile Contents:\n")
        f.write("=" * 80 + "\n")

        for root, dirs, files in os.walk(start_path):
            if should_ignore(root):
                continue
                
            valid_files = [file for file in sorted(files) 
                         if not any(pattern in file for pattern in ignore_patterns)]
            
            for file in valid_files:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as source_file:
                        content = source_file.read()
                        f.write(f"\n\nFile: {file_path}\n")
                        f.write("-" * 80 + "\n")
                        f.write(content)
                        f.write("\n")
                except Exception as e:
                    f.write(f"\n\nError reading {file_path}: {str(e)}\n")

def main():
    # Define patterns to ignore
    ignore_patterns = {
        '.git', 'node_modules', '.next', 'out', '.vercel',
        '__pycache__', '.env', '.env.local', '*.pyc', '*.pyo',
        '.DS_Store', 'Thumbs.db', 'coverage', 'build',
        'dist', '.cache', '.idea', '.vscode'
    }

    # Generate structure with timestamp in filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f'project_structure_{timestamp}.txt'
    
    try:
        generate_project_structure('.', output_file, ignore_patterns)
        print(f"Project structure has been saved to {output_file}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()

