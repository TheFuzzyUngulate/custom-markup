import { Parser } from './parse.js'

const def_inpt = 
`= this is a header
== this is a smaller header

this is a simple line.
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

\`\`\`
// this is a codeblock.
// i will mostly use these for displaying pseudocode or actual code.
// but these can be used to represent any body of text that is meant to be read character-by-character, as displayed, based on general writing convention for the language being used.
// for instance, here's a random block of c-code.

#include <stdio.h>
#include <stdlib.h>

int main(int argc, char[][] argv) {
    return EXIT_SUCCESS;
}
\`\`\`

Although normally two brackets would become a function block, when escaped they appear as characters.
Here, you can see both of them: \\[\\]. They do not disappear.
This also works with asterisks. *In this sentence, the asterisks are not escaped.* \\*Here, they are.\\*

here is a short paragraph.

:: this is an aside.
it is used to convey information that is only *tangentially* related to the block it is attached to.
alternatively, it can be used for notes.

Here is a longer paragraph. The aside that appears immediately after this paragraph should show more than one line of text even in its preview form.
...
The preview form only gets cut off if the aside text is longer than the block.

:: this aside is attached to a longer block.
notice that the text that displays in the preview is more than in the shorter paragraph.
the text that displays in the preview depends on the default length of the block.
...
moreover, the expansion button still appears.

== Things to do

+ add automatic link parsing -- **done!!**
+ add list aliases "[]" -- **done!!**
+ add blockquote author field -- **done!!**
+ add multiple blockquote levels
+ add inline code spans -- **done!!**
+ add code blocks -- **done!!**
+ add character escapes -- **done!!**
+ add lists with multiple levels. -- **done!!**
++ delimiters can be \`+\` for unordered, \`#\` for ordered.
+ add a line break escape character for within lists and the like. \`"..."\` -- **done!!**
+ add asides (or rather, "notes"): -- **done!!**
++ asides should be besides the paragraph that precedes them, on the left or on the right.
+++ in other words, they should only appear after a paragraph element.
+++ structurally, they should share a segment.
++ if they happen to be longer than the length of that paragraph, they should have an
expandable "read more.." button next to them on the last line or whatever. maybe a down arrow?
++ the aside in the markup should be a paragraph type, distinguished with the \`::\` delimiter.
++ multiple asides in a row will be the same as having a single large aside attached to the previous, though it allows for paragraphs within the asides.
+ add in-document links (and markers for references, for those links)
++ implement two types of links:
+++ first, a paragraph-level link which should appear first in the paragraph.
+++ second, a character-level link that can appear anywhere and is visible in the final result as a link symbol. call this a bookmark.
++ both types can be referenced anywhere with a character that acts as a link to whatever it is.
++ when a paragraph is linked to, it shines.
+ add tables.
`

// I am not adding any mechanisms of concealment, pop-ups, and the like.
// Tentatively, I maintain that such features are more distracting than
// not in a reading, as they demand constant tactile and manual
// manipulation, block other parts of the screen at the same time, and
// do not allow easy use of the eyes. And, immanent to its construction,
// these problems only balloon in scale as the text gets larger, and
// must be limited in size on a practical level.
//
// A flaw in my conception is that I have made it transhistorical.
// Moreover, it is not within a general overarching logic. But that is
// unavoidable. I do not have such a conception of the algorithm yet,
// and thus, neither do I have it concerning coding.
// 
// Inversely, it might be a good idea to give links previews to reduce
// this very same process. The preview should act as though it is a
// part of the linear structure while open. The use of color can act
// as a mode of delineation, and the split paragraph (when applicable)
// should be trailed by "..." on both sides.

const textarea = document.querySelector(".tab-body textarea");
const prev_dsp = document.querySelector(".tab-body .preview-display");
const upld_btn = document.querySelector("input.upload-btn");

function uploadText(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
        let str = evt.target.result;
        if (evt !== '') {
            textarea.textContent = str;
            updateTextarea(event);
        }
    };
    reader.readAsText(file);
}

function updateTextarea(event) {
    const template = document.createElement("template");
    const markupParse = new Parser(textarea.value);
    
    const str = markupParse.doc();
    template.innerHTML = str;
    prev_dsp.replaceChildren(template.content);
}

function truncateAsides() {
    document.querySelectorAll('.aside-segment').forEach(sg => {
        const main = sg.parentNode.querySelector('.main-content');
        const aside = sg.querySelector('.aside-content');
        if (!aside) return;

        const btn = sg.querySelector('.aside-btn');
        console.log(btn.clientHeight, btn.scrollHeight);
        const mainHeight = main.scrollHeight;
        const asideHeight = aside.scrollHeight;

        aside.style.maxHeight = asideHeight + 'px';
        aside.classList.remove('truncated');

        if (mainHeight < asideHeight) {
            const btnStyle = window.getComputedStyle(btn);
            const btnHeight = btnStyle.getPropertyValue('line-height');
            console.log(btnHeight);
            aside.style.maxHeight = `calc(${mainHeight}px - ${btnHeight})`;
            aside.classList.add('truncated');
            btn.classList.add('aside-btn-visible');
        }
    })
}

function loadDefaultText(ev) {
    textarea.textContent = def_inpt;
    updateTextarea(ev);
}

// because we aren't able to assign callbacks to the buttons
// when they are initialized, we have to do this shit instead.
// this is where react would turn in handy.

function buttonToggleAsideView(event) {
    const btn = event.target.closest('.aside-btn');
    if (!btn) return;

    const asideSeg = btn.closest('.aside-segment');
    const aside = asideSeg.querySelector('.aside-content');

    if (aside.classList.contains('expanded')) {
        const main = asideSeg.parentNode.querySelector('.main-content');
        const mainHeight = main.scrollHeight;
        const btnStyle = window.getComputedStyle(btn);
        const btnHeight = btnStyle.getPropertyValue('line-height');
        console.log(btnHeight);
        aside.style.maxHeight = `calc(${mainHeight}px - ${btnHeight})`;
        aside.classList.remove('expanded');
        btn.innerText = 'more...';
    } else {
        const asideHeight = aside.scrollHeight;
        aside.style.maxHeight = asideHeight + 'px';
        aside.classList.add('expanded');
        btn.innerText = '...less';
    }
}

window.addEventListener('load', loadDefaultText);
window.addEventListener('load', truncateAsides);
window.addEventListener('resize', truncateAsides);

textarea.addEventListener('input', updateTextarea);
textarea.addEventListener('input', truncateAsides);
upld_btn.addEventListener('change', uploadText);

document.addEventListener('click', buttonToggleAsideView);