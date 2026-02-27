export var def_text = `
= this is a header
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
+ add multiple blockquote levels -- **done!!**
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
+ add function spans: \`[func|par1|par2]\`
+ add function segments \`\`
+ add tables.
`.trim();