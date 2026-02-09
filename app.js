import { Parser } from './parse.js'

const display = document.querySelector("#display");
const textarea = document.querySelector("#mytxt");

textarea.addEventListener('input', (ev) => {
    const template = document.createElement("template");
    const markupParse = new Parser(textarea.value);
    
    const str = markupParse.parse();
    console.log(str);
    template.innerHTML = str;
    display.replaceChildren(template.content);
});