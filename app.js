import { def_text } from './default_text.js'
import { parseAndFill } from './postparse.js'

const textarea = document.querySelector(".tab-body textarea");
const prev_dsp = document.querySelector(".tab-body .preview-display");
const upld_dsp = document.querySelector(".upload-holder");

function uploadText(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
        let str = evt.target.result;
        if (evt !== '') {
            textarea.value = str;
            updateTextarea(event);
            refreshUploadInput(); // apparently, you can't remove files
                                  // so i gotta remake the entire thing
        }
    };
    reader.readAsText(file);
}

function refreshUploadInput() {
    const prev_inps = upld_dsp.querySelectorAll("input");
    if (prev_inps.length > 0) {
        while (upld_dsp.firstChild) {
            upld_dsp.removeChild(upld_dsp.lastChild);
        }
    }

    const new_inp = document.createElement("input");
    new_inp.type = 'file';
    new_inp.accept = 'txt';
    new_inp.addEventListener('change', uploadText);
    upld_dsp.appendChild(new_inp);
}

function updateTextarea(ev) {
    parseAndFill(textarea.value, prev_dsp);    
}

function loadDefaultText(ev) {
    textarea.value = def_text;
    updateTextarea(ev);
    refreshUploadInput();
}

window.onload = (e) => {
    loadDefaultText(e);
    textarea.addEventListener('input', updateTextarea);
}