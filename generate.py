import os
import datetime

def read_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

def create_project_documentation():
    base_dir = "."
    
    doc_template = """# CFTDTI Chat Assistant Project Documentation
Generated on: {date}

## Project Overview
- Project Type: Next.js ChatGPT-like interface for CFTDTI
- Model: google/gemini-flash-1.5-8b via OpenRouter.ai
- Source URL: https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html

## Project Structure and File Contents
"""

    documentation = doc_template.format(date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    ignore_dirs = {'.git', 'node_modules', '.next', 'out', 'build'}
    ignore_files = {'.env', '.env.local', '.DS_Store'}
    
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            if file in ignore_files:
                continue
                
            _, ext = os.path.splitext(file)
            
            if ext not in ['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md']:
                continue
                
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, base_dir)
            
            documentation += f"\n### File: {relative_path}\n"
            documentation += "```" + ext[1:] + "\n"
            documentation += read_file_content(file_path)
            documentation += "\n```\n"

    documentation += """
## Setup Instructions
1. Clone the repository
2. Install dependencies: `npm install`
3. Create .env.local with required environment variables
4. Run the development server: `npm run dev`

## To Resume Development
When starting a new chat, say:
"I'm continuing development of my CFTDTI Assistant project. Here's my full project documentation: [paste relevant sections]. I'd like to [describe next feature]."
"""

    output_file = "project_documentation.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(documentation)
    
    print(f"Documentation generated successfully: {output_file}")

if __name__ == "__main__":
    create_project_documentation()

