import os
import re

def remove_clerk_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Remove imports
    content = re.sub(r'import\s+{[^}]*}\s+from\s+[\'"]@clerk/(nextjs|nextjs/server)[\'"];?\n', '', content)
    
    # Replace usages in server components
    content = re.sub(r'const\s*{\s*getToken\s*}\s*=\s*await\s*auth\(\);?\n\s*const\s*token\s*=\s*await\s*getToken\(\);?', 'const token = "mock-token";', content)
    content = re.sub(r'const\s*{\s*getToken\s*}\s*=\s*auth\(\);?\n\s*const\s*token\s*=\s*await\s*getToken\(\);?', 'const token = "mock-token";', content)
    content = re.sub(r'const\s*{\s*userId\s*}\s*=\s*await\s*auth\(\);?', '', content)
    content = re.sub(r'const\s*{\s*userId\s*}\s*=\s*auth\(\);?', '', content)
    
    # currentUser
    content = re.sub(r'const\s+user\s*=\s*await\s*currentUser\(\);?', 'const user = null;', content)
    
    # useAuth
    content = re.sub(r'const\s*{\s*isSignedIn\s*}\s*=\s*useAuth\(\);?', 'const isSignedIn = true;', content)
    content = re.sub(r'const\s*{\s*getToken\s*}\s*=\s*useAuth\(\);?', 'const getToken = async () => "mock-token";', content)
    
    # UI components
    content = content.replace('<SignInButton mode="modal">', '')
    content = content.replace('</SignInButton>', '')
    content = content.replace('<UserButton appearance={{ elements: { avatarBox: isScrolled ? "w-6 h-6" : "w-8 h-8" } }} />', '<div className="w-8 h-8 rounded-full bg-[#1a1a1c] flex items-center justify-center text-white font-bold text-xs border border-[#b2f5d1]">U</div>')
    content = content.replace('<UserButton />', '<div className="w-8 h-8 rounded-full bg-[#1a1a1c] flex items-center justify-center text-white font-bold text-xs border border-[#b2f5d1]">U</div>')

    # Remove clerk tags in app layout layout.tsx if any are left
    content = content.replace('<ClerkProvider>', '')
    content = content.replace('</ClerkProvider>', '')

    if original_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('c:\\SmartSplit\\client'):
    if 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            remove_clerk_from_file(os.path.join(root, file))
