import { Parser } from './parse.js'

const def_inpt = `
= this is a header
== this is a smaller header

this is a simple line. \\[\\]
this is a follow-up to the simple line.

=== this is an even smaller header

**this is bolded**.
*this is italicized.*
***this is bolded and italicized.***
**this is bolded, but *****this is bolded and italicized.***
**this is bolded, but* this is italicized.*
***this is bitalicized,* this is bolded,* and this is italicized.*
****this is normal,* this is bitalicized,* this is bolded, and* this is italicized.*

this is a new paragraph.
this is a code segment: \`x + y = z\`.

--- this is a quote. don't quote me. actually, *do* quote me.
--- this is immediately after a quote, so the delimiter is treated as just another line.
however, it is converted to a nice-looking double em-dash by convention.
double-dashes are single em-dashes (--). triple dashes are double em-dashes (---). and so on.

--- this is another blockquote, though.

--- In the social production of their life, men enter into definite relations that are indispensable and independent of their will, relations of production which correspond to a definite stage of development of their material productive forces. [Karl Marx, https://www.marxists.org/archive/marx/works/1859/critique-pol-economy/preface-abs.htm[Preface of *A Contribution to the Critique of Political Economy*]]

--- that last blockquote was "quoted" by using a terminal \`[...]\` block.

this comes immediately after.
www.google.com is a link and appears as a hyperlink.
so do http://www.google.com and http://styles.net.
however, styles.net does not appear as a hyperlink.

hyperlinks can appear with placeholder text.
for instance, www.google.com[this] actually links to www.google.com.
and https://en.m.wikipedia.org/wiki/C_Sharp_(programming_language)[this text] is a hyperlink to a *Wikipedia* article.

\`\`\`this is a codeblock.
everything here looks cool.
\`\`\`

== Things to do

1) add automatic link parsing -- **done!!**
2) add list aliases "[]" -- **done!!**
3) add blockquote author field -- **done!!**
4) add inline code spans -- **done!!**
5) add code blocks -- **done!!**
6) add character escapes -- **done!!**
7) add lists with multiple levels
8) add a line break escape character for within lists and the like. \`"..."\`
8) add definitions
9) add tables
10) add hidden spans (with an option to have a placeholder instead of a blackout effect as the "hiding")
11) add dropdown panels with aliases that trigger the dropdown once clicked.`

const textarea = document.querySelector(".tab-body textarea");
const prev_dsp = document.querySelector(".tab-body .preview-display");

function updateTextarea(event) {
    const template = document.createElement("template");
    const markupParse = new Parser(textarea.value);
    
    const str = markupParse.doc();
    template.innerHTML = str;
    prev_dsp.replaceChildren(template.content);
}

window.addEventListener('load', (ev) => {
    textarea.textContent = def_inpt;
    updateTextarea(ev);
});

textarea.addEventListener('input', updateTextarea);