const fs = require('fs');

let css = fs.readFileSync('public/css/style.css', 'utf8');

// Find where [data-bs-theme="dark"] block ends
const darkBlockEndIndex = css.indexOf('}', css.indexOf('[data-bs-theme="dark"]')) + 1;

const variablesPart = css.substring(0, darkBlockEndIndex);
const stylesPart = css.substring(darkBlockEndIndex);

const newCss = `${variablesPart}

/* ONLY APPLY NEW REDESIGN TO DESKTOP */
@media (min-width: 992px) {
${stylesPart}
}
`;

fs.writeFileSync('public/css/style.css', newCss);
console.log('Wrapped style.css in desktop media query.');

// Now add the legacy CSS link to layout.ejs
let layout = fs.readFileSync('views/layout.ejs', 'utf8');
const linkTag = `<link rel="stylesheet" href="/css/style.css">`;
const newLinkTags = `<link rel="stylesheet" href="/css/style.css">\n  <link rel="stylesheet" href="/css/legacy_mobile.css" media="(max-width: 991px)">`;

if (layout.includes(linkTag)) {
    layout = layout.replace(linkTag, newLinkTags);
    fs.writeFileSync('views/layout.ejs', layout);
    console.log('Added legacy_mobile.css to layout.ejs');
} else {
    console.log('Could not find link tag in layout.ejs');
}
