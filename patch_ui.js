const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.ejs')) results.push(file);
        }
    });
    return results;
}

const ejsFiles = walk('views');

ejsFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove washed out opacity classes for better contrast
    content = content.replace(/opacity-25/g, '');
    content = content.replace(/opacity-50/g, '');
    content = content.replace(/class="([^"]*)opacity-75([^"]*)"/g, 'class="$1text-muted$2"');
    
    // Convert generic background light to surface for consistency
    content = content.replace(/bg-light/g, 'bg-surface');
    
    // Remove rounded-pill to enforce 12px radius everywhere
    content = content.replace(/rounded-pill/g, 'rounded');
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
