import { Parser } from './parse.js'

const display = document.querySelector("#display");
const textarea = document.querySelector("#mytxt");

function updateTextarea(event) {
    const template = document.createElement("template");
    const markupParse = new Parser(textarea.value);
    
    const str = markupParse.doc();
    console.log(str);
    template.innerHTML = str;
    display.replaceChildren(template.content);
}

window.addEventListener('load', updateTextarea);
textarea.addEventListener('input', updateTextarea);