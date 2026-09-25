const fs = require('fs');
const path = require('path');

function removeClerkFromFile(filepath) {
    const originalContent = fs.readFileSync(filepath, 'utf-8');
    let content = originalContent;

    // Remove imports
    content = content.replace(/import\s+{[^}]*}\s+from\s+['"]@clerk\/(nextjs|nextjs\/server)['"];?\n/g, '');
    
    // Replace usages in server components
    content = content.replace(/const\s*{\s*getToken\s*}\s*=\s*await\s*auth\(\);?\n\s*const\s*token\s*=\s*await\s*getToken\(\);?/g, 'const token = "mock-token";');
    content = content.replace(/const\s*{\s*getToken\s*}\s*=\s*auth\(\);?\n\s*const\s*token\s*=\s*await\s*getToken\(\);?/g, 'const token = "mock-token";');
    content = content.replace(/const\s*{\s*userId\s*}\s*=\s*await\s*auth\(\);?/g, '');
    content = content.replace(/const\s*{\s*userId\s*}\s*=\s*auth\(\);?/g, '');
    
    // currentUser
    content = content.replace(/const\s+user\s*=\s*await\s*currentUser\(\);?/g, 'const user = null;');
    
    // useAuth
    content = content.replace(/const\s*{\s*isSignedIn\s*}\s*=\s*useAuth\(\);?/g, 'const isSignedIn = true;');
    content = content.replace(/const\s*{\s*getToken\s*}\s*=\s*useAuth\(\);?/g, 'const getToken = async () => "mock-token";');
    
    // UI components
    content = content.replace(/<SignInButton mode="modal">/g, '');
    content = content.replace(/<\/SignInButton>/g, '');
    content = content.replace(/<UserButton appearance={{ elements: { avatarBox: isScrolled \? "w-6 h-6" : "w-8 h-8" } }} \/>/g, '<div className="w-8 h-8 rounded-full bg-[#1a1a1c] flex items-center justify-center text-white font-bold text-xs border border-[#b2f5d1]">U</div>');
    content = content.replace(/<UserButton \/>/g, '<div className="w-8 h-8 rounded-full bg-[#1a1a1c] flex items-center justify-center text-white font-bold text-xs border border-[#b2f5d1]">U</div>');

    // Remove clerk tags in app layout layout.tsx if any are left
    content = content.replace(/<ClerkProvider>/g, '');
    content = content.replace(/<\/ClerkProvider>/g, '');

    if (originalContent !== content) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Updated ${filepath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'node_modules' || file === '.next') continue;
            walkDir(fullPath);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                removeClerkFromFile(fullPath);
            }
        }
    }
}

walkDir(path.join(__dirname, 'client'));
