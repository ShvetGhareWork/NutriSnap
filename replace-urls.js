const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'client');
const searchString = 'http://localhost:5000';
const replacementString = "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}";

function processDirectory(dirPath) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        entries.forEach(entry => {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
                processDirectory(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
                replaceInFile(fullPath);
            }
        });
    });
}

function replaceInFile(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        if (data.includes(searchString)) {
            // Complex replacement: For lines that use "http://localhost:5000/..."
            // we first try to replace exact quoted strings: "http://localhost:5000..." -> `${process.env...}...`
            let result = data;
            
            // Handle regular quotes
            result = result.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}$1`');
            // Handle single quotes
            result = result.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}$1`');
            // Handle existing backticks (template literals)
            result = result.replace(/`http:\/\/localhost:5000([^`]*)`/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}$1`');
            
            // Sometimes it's just http://localhost:5000 not enclosed in quotes, e.g inside an already defined template literal
            // like `${"http://localhost:5000"}/api` which is rare. The above 3 regex should cover almost all fetch/io calls.

            // Handle the case where it's already inside a template literal (e.g. `http://localhost:5000/api/${id}`)
            result = result.replace(/http:\/\/localhost:5000/g, "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}");
            
            // Deduplicate if we replaced twice (e.g if it was inside a backtick string already and both regex matched)
            // The first 3 regex replace to: `${process.env...}...`
            // If the 4th regex hits something not matched by the first 3, it just replaces the host.
            // Let's just use a simpler safe approach:
            
            let safeResult = data.replace(/['"`]http:\/\/localhost:5000([^'"`]*)['"`]/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:5000\'}$1`');
            
            // For nested template literals like `http://localhost:5000/api/${id}` which uses backticks inside backticks? Not possible.
            // But what about `http://localhost:5000/api/${user.id}`
            // The regex /[`]http:\/\/localhost:5000([^`]*)[`]/g will match this block.
            // Let's do it manually if regex gets hairy. 
            
            fs.writeFile(filePath, safeResult, 'utf8', (err) => {
                if (err) return console.error(err);
                console.log('Updated:', filePath);
            });
        }
    });
}

processDirectory(directoryPath);
