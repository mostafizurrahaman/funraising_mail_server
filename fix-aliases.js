const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getRelativePath(fromPath, toPath) {
    let rel = path.relative(path.dirname(fromPath), toPath);
    if (!rel.startsWith('.')) {
        rel = './' + rel;
    }
    return rel;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Match import/export from "@/..." or '@/...';
            const regex = /from\s+["']@\/(.*?)["']/g;
            content = content.replace(regex, (match, importPath) => {
                const targetAbsolutePath = path.join(srcDir, importPath);
                let relative = getRelativePath(fullPath, targetAbsolutePath);
                // Convert backslashes to forward slashes
                relative = relative.replace(/\\/g, '/');
                modified = true;
                return `from "${relative}"`;
            });

            // Match import("@/...")
            const regex2 = /import\(\s*["']@\/(.*?)["']\s*\)/g;
            content = content.replace(regex2, (match, importPath) => {
                const targetAbsolutePath = path.join(srcDir, importPath);
                let relative = getRelativePath(fullPath, targetAbsolutePath);
                relative = relative.replace(/\\/g, '/');
                modified = true;
                return `import("${relative}")`;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(srcDir);
