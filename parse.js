const TokenType = {
    EOF: 0,
    LINE_BREAK: 1,
    PARAGRAPH_BREAK: 2,
    ASTERISK: 3,
    BACKQUOTE: 4,           // "`"
    TILDE: 5,
    PLUS: 6,
    HYPHEN: 7,
    EQUALS_SEQ: 8,
    LEFT_BRACK: 9 ,         // "["
    RIGHT_BRACK: 10,        // "]"
    WORD_SPAN: 11,          // well...
    SPACE: 12,
    TRIPLE_BQ: 13,
}

function charIsSafe(char) {
  return char !== null && !/^[ \n*~`\[\]]$/.test(char);
}

function isTextType(type) {
    return type === TokenType.WORD_SPAN || type === TokenType.SPACE;
}

function isPunctuation(char) {
    return /^[!?\.,;:]$/.test(char);
}

function isValidURL(str) {
    return /^(?:https?:\/\/|www\.)[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+(?:\/.*)?$/.test(str);
}

class Token {
    constructor(type, line, column, text) {
        this.text = text;
        this.type = type;
        this.line = line;
        this.column = column;
    }
}

class Scanner {
    constructor(text) {
        this.text = text;
        this.line = 1;
        this.column = 0;
        this.start = 0;
        this.current = 0;
    }

    peek() {
        if (this.current < this.text.length) {
            return this.text[this.current];
        } return null;
    }

    peekNext() {
        if (this.current + 1 < this.text.length) {
            return this.text[this.current + 1];
        } return null;
    }

    advance() {
        if (this.current >= this.text.length) {
            return null;
        }

        if (this.text[this.current] == '\n') {
            this.line++;
            this.column = 0;
        }

        return this.text[this.current++];
    }

    makeToken(type) {
        return new Token(
            type,
            this.line,
            this.column,
            this.text.substring(
                this.start,
                this.current
            )
        )
    }

    scan()
    {    
        this.start = this.current;

        let char = this.advance();

        switch (char) {
            case null: return this.makeToken(TokenType.EOF);

            case '\n':
                if (this.peek() === '\n') {
                    this.advance();
                    return this.makeToken(TokenType.PARAGRAPH_BREAK);
                } return this.makeToken(TokenType.LINE_BREAK);

            case '+': return this.makeToken(TokenType.PLUS);
            case '~': return this.makeToken(TokenType.TILDE);
            case '*': return this.makeToken(TokenType.ASTERISK);
            case '[': return this.makeToken(TokenType.LEFT_BRACK);
            case ']': return this.makeToken(TokenType.RIGHT_BRACK);
            
            case '`': 
                if (this.peek() === '`' && this.peekNext() === '`') {
                    this.advance();
                    this.advance();
                    return this.makeToken(TokenType.TRIPLE_BQ);
                } else return this.makeToken(TokenType.BACKQUOTE);

            case ' ':
                while (this.peek() === ' ') {
                    this.advance();
                } return this.makeToken(TokenType.SPACE);

            case '-':
                while (this.peek() === '-') {
                    this.advance();
                } return this.makeToken(TokenType.HYPHEN);

            case '=':
                for (let i = 0; i < 4; i++) {
                    if (this.peek() !== '=') {
                        return this.makeToken(TokenType.EQUALS_SEQ);
                    } this.advance();
                }
                break;

            default:
                while (charIsSafe(this.peek())) {
                    if (this.peek() === '\\') {
                        this.advance();
                    }
                    this.advance();
                } return this.makeToken(TokenType.WORD_SPAN);
        }
    }
}

export class Parser {
    constructor(text) {
        this.text = text;
        this.scanner = new Scanner(text);
        this.previous = null;
        this.next = this.scanner.scan();
        this.pendingTokens = [];
    }

    check(type) {
        if (this.pendingTokens.length > 0) {
            return this.pendingTokens[0].type;
        } else return this.next.type === type;
    }

    consume() {
        this.previous = this.next;

        if (this.pendingTokens.length > 0) {
            this.next = this.pendingTokens.shift();
        } else this.next = this.scanner.scan();

        return this.previous;
    }

    styleText(text) {
        return text.replace(/\-(\-)+/, (m) => '—'.repeat(m.length - 1));
    }

    changeIfHref() {
        let pref, suff, inner;
        let text = this.previous.text;

        if (isPunctuation(text[text.length - 1])) {
            pref = text.substr(0, text.length - 1);
            suff = text[text.length - 1];
        } else {
            pref = text;
            suff = '';
        }

        if (!isValidURL(pref)) {
            return this.styleText(text);
        }

        if (this.check(TokenType.LEFT_BRACK)) {
            this.consume();
            let rest = this.text2({takesURLs: false});
            if (this.check(TokenType.RIGHT_BRACK)) {
                this.consume();
                inner = rest;
            }
        }

        if (inner === undefined) inner = pref;
        if (!/^https?:\/\//.test(pref)) pref = "https://" + pref;
        return `<a href=\"${pref}\">${this.styleText(inner)}</a>${suff}`;
    }

    text0({takesURLs=true}) {
        let res = '';

        for (;;) {
            switch (this.next.type) {
                case TokenType.WORD_SPAN:
                    this.consume();
                    if (takesURLs) {
                        res += this.changeIfHref();
                    } else {
                        res += this.styleText(this.previous.text);
                    }
                    break;

                case TokenType.TILDE:
                case TokenType.SPACE:
                    this.consume();
                    res += this.previous.text;
                    break;

                case TokenType.HYPHEN:
                    this.consume();
                    res += this.styleText(this.previous.text);
                    break;

                case TokenType.EQUALS_SEQ:
                    this.consume();
                    res += this.previous.text;
                    break;

                default:
                    return res;
            }
        }
    }

    code() {
        // there's a problem here.
        // we want `code` to be able to include any symbol as long as
        // it's not a line break or paragraph break

        // this means that we don't actually want text0 here. we want
        // a separate level that accepts all characters as long as
        // they don't break a line or a paragraph.

        // however, if our ending backquote delimiter doesn't show, we
        // want to be able to parse the rest as normal, like we usually
        // do. so, instead, we need all possible syntactic elements to
        // have switches, so that we can call text4 and it'll accept
        // all of them but render them as plain text.
        
        // but these other levels do not terminate when they encounter
        // a backquote delimiter, since they regard it as a lower level.
        // one solution is to use a flag. another solution is to store
        // the tokens somewhere and, if a failure occurs, allow the
        // algorithm to use the tokens again, as if they were never
        // omitted. the latter is cleaner.

        let tokens = [];
        let lastPrevious = this.previous;

        while (!this.check(TokenType.EOF) &&
               !this.check(TokenType.BACKQUOTE) &&
               !this.check(TokenType.TRIPLE_BQ) &&
               !this.check(TokenType.LINE_BREAK) &&
               !this.check(TokenType.PARAGRAPH_BREAK)) {
            this.consume();
            tokens.push(this.previous);
        }

        if (this.check(TokenType.BACKQUOTE) || 
            this.check(TokenType.TRIPLE_BQ)) {
            let string = tokens.map(tok => tok.text).join('');
            this.consume();
            return `<code>${string}</code>`;
        }
        
        // here, the `pendingTokens` list is set up to perfectly
        // simulate the sequence of outputs of `scanner.scan()` after
        // what the previous was. so, whatever `next` is after the loop
        // above must be after everything in the list (since it's the
        // token that's the next be consumed, after them). It's already
        // been scanned, so you have to put it to the back of the
        // pendingList. also, you have to set the head of the list as
        // `this.next`, as it was when `lastPrevious` was previous.

        this.previous = lastPrevious;
        if (tokens.length > 0) {
            let tmp = this.next;
            this.next = tokens.shift();
            tokens.push(tmp);
            tokens.forEach(tok => this.pendingTokens.push(tok));
        }

        return '`';
    }

    text1({takesURLs=true}) {
        let res = '';

        for (;;) {
            switch (this.next.type) {
                case TokenType.BACKQUOTE:
                case TokenType.TRIPLE_BQ:
                    this.consume();
                    res += this.code();
                    break;

                case TokenType.SPACE:
                case TokenType.WORD_SPAN:
                case TokenType.HYPHEN:
                case TokenType.TILDE:
                case TokenType.EQUALS_SEQ:
                    res += this.text0({takesURLs: takesURLs});
                    break;    

                default:
                    return res;
            }
        }
    }

    emph({takesURLs=true, level=1}) {
        let res = ''

        switch (this.next.type) {
            case TokenType.BACKQUOTE:    
            case TokenType.TRIPLE_BQ:
            case TokenType.TILDE:
            case TokenType.SPACE:
            case TokenType.WORD_SPAN:
            case TokenType.HYPHEN:
            case TokenType.EQUALS_SEQ:
                res += this.text1({takesURLs: takesURLs});
                if (this.check(TokenType.ASTERISK)) {
                    this.consume();
                    switch (level % 4) {
                        case 1: return `<i>${res}</i>`;
                        case 2: return `<b>${res}</b>`;
                        case 3: return `<b><i>${res}</i></b>`;
                        case 0: return res;
                    }
                } else return `*${res}`

            case TokenType.ASTERISK:
                this.consume();
                res += this.emph({
                    level: level + 1,
                    takesURLs: takesURLs
                });
                switch (this.next.type) {
                    case TokenType.BACKQUOTE:
                    case TokenType.TRIPLE_BQ:
                    case TokenType.SPACE:
                    case TokenType.WORD_SPAN:
                        res += this.emph({
                            level: level, 
                            takesURLs: takesURLs
                        });
                        break;
                    case TokenType.ASTERISK:
                        this.consume();
                        break;
                }
                return res;
        }

        return '*';
    }

    text2({takesEmph=true, takesURLs=true}) {
        let res = '';

        for (;;) {
            switch (this.next.type) {
                case TokenType.BACKQUOTE:
                case TokenType.TRIPLE_BQ:
                case TokenType.SPACE:
                case TokenType.TILDE:
                case TokenType.WORD_SPAN:
                case TokenType.HYPHEN:
                case TokenType.EQUALS_SEQ:
                    res += this.text1({takesURLs: takesURLs});
                    break;

                case TokenType.ASTERISK:
                    if (takesEmph) {
                        this.consume();
                        res += this.emph({takesURLs: takesURLs});
                    } else res += this.text1({takesURLs: takesURLs});
                    break;

                default:
                    return res;
            }
        }
    }

    bracketed({takesEmph=true, takesURLs=true, context=''}) {
        let res = this.text2({
            takesURLs: takesURLs,
            takesEmph: takesEmph
        });

        if (this.next.type === TokenType.RIGHT_BRACK) {
            this.consume();
            switch (context) {
                case 'blockquote':
                    if (this.check(TokenType.EOF) ||
                        this.check(TokenType.PARAGRAPH_BREAK)) {
                        return `<p class="quote-cit">${res}</p>`;
                    }
                    break;
            }

            return `<span class="func">${res}</span>`;
        }

        return `[${res}`;
    }

    text3({takesEmph=true, takesURLs=true}) {
        let res = '';

        for (;;) {
            switch (this.next.type) {
                case TokenType.BACKQUOTE:
                case TokenType.TRIPLE_BQ:
                case TokenType.SPACE:
                case TokenType.TILDE:
                case TokenType.WORD_SPAN:
                case TokenType.ASTERISK:
                case TokenType.HYPHEN:
                case TokenType.EQUALS_SEQ:
                    res += this.text2({
                        takesURLs: takesURLs,
                        takesEmph: takesEmph
                    });
                    break;

                case TokenType.LEFT_BRACK:
                    this.consume();
                    res += this.bracketed({
                        takesEmph: takesEmph,
                        takesURLs: takesURLs
                    });
                    break;
                
                case TokenType.RIGHT_BRACK:
                    res += ']';
                    break;

                default:
                    return res;
            }
        }
    }

    line({takesEmph=true, takesURLs=true}) {
        let res = '';

        while (!this.check(TokenType.EOF) &&
               !this.check(TokenType.PARAGRAPH_BREAK) &&
               !this.check(TokenType.LINE_BREAK)) {
            res += this.text3({
                takesEmph: takesEmph,
                takesURLs: takesURLs
            });
        }

        return `<div>${res}</div>`;
    }

    paragraph() {
        let res = '';

        for (;;) {
            res += this.line({});
            switch (this.next.type) {
                case TokenType.LINE_BREAK:
                    this.consume();
                    break;

                case TokenType.EOF:
                    return res;

                case TokenType.PARAGRAPH_BREAK:
                    this.consume();
                    return `${res}<br>`;
            }
        }
    }

    blockquote() {
        let res = '';

        for (;;) {
            res += this.text2({});
            switch (this.next.type) {
                case TokenType.EOF:
                    return `<blockquote>${res}</blockquote>`;

                case TokenType.LINE_BREAK:
                    this.consume();
                    res += '<br>';
                    break;

                case TokenType.PARAGRAPH_BREAK:
                    this.consume();
                    return `<blockquote>${res}</blockquote>`;

                case TokenType.LEFT_BRACK: {
                    this.consume();
                    let rest = this.bracketed({context: 'blockquote'});
                    if ((this.check(TokenType.EOF) ||
                        this.check(TokenType.PARAGRAPH_BREAK)) &&
                        this.previous.type === TokenType.RIGHT_BRACK) {
                        this.consume();
                        return `<blockquote>\
                                    ${res}\
                                    ${rest}\
                                </blockquote>`;
                    }
                    res += rest;
                    break;
                }
            }
        }
    }

    header(len) {
        let result = this.line(false);
        if (this.check(TokenType.LINE_BREAK)) {
            this.consume();
        }

        return `<h${len}>${result}</h${len}>`;
    }

    codeblock() {
        // the logic dictating how this works is identical to that of
        // `code`, except that there are far less delimiters to check,
        // and it can only be canceled by '```'.

        // moreover, since we want to be able to treat our delimiter as
        // a sequence of backquotes if this fails, we do not consume the
        // triple-backquote token on our way to this function. so at
        // function start, `this.previous` is the token before it, and
        // it should be restored to that value. the triple-backquote is
        // restored with everything else on fail. however, to avoid an
        // infinite recursion, `codeblock` actually returns by calling
        // `paragraph()`.

        let tokens = [];
        let lastPrevious = this.previous;

        // as explained, `this.previous` at this point is the token
        // preceding the triple-backquote, and we need to store the
        // backquote first and consume it so that the search for the
        // closing triple-backquote isn't trivial.

        this.consume();
        tokens.push(this.previous);

        // having pushed the starting delimiter, our logic should work
        // fine from hereon out. loop to find the closing delimiter or
        // EOF. if the closing delimiter is found, then the raw text of
        // the tokens are placed in a <code> tag within a <pre> tag, no
        // harm done. otherwise, everything is pushed to the pending
        // array to be re-processed, though as a paragraph.

        while (!this.check(TokenType.EOF) &&
               !this.check(TokenType.TRIPLE_BQ)) {
            this.consume();
            tokens.push(this.previous);
        }

        // the only reason that tokens.shift() is required is because
        // we don't want to have the starting delimiter, which was
        // placed in `tokens`, to appear.

        if (this.check(TokenType.TRIPLE_BQ)) {
            tokens.shift();
            let string = tokens.map(tok => tok.text).join('');
            this.consume();
            return `<pre><code>${string}</code></pre>`;
        }

        this.previous = lastPrevious;
        if (tokens.length > 0) {
            let tmp = this.next;
            this.next = tokens.shift();
            tokens.push(tmp);
            tokens.forEach(tok => this.pendingTokens.push(tok));
        }

        return this.paragraph();
    }

    block() {
        switch (this.next.type) {
            case TokenType.EQUALS_SEQ: {
                let len = this.next.text.length;
                this.consume();
                return this.header(len);
            }

            case TokenType.TRIPLE_BQ:
                return this.codeblock();

            case TokenType.HYPHEN:
                if (this.next.text.length === 3) {
                    this.consume();
                    return this.blockquote();
                } else return this.paragraph();
                
            default:
                return this.paragraph();
        }
    }

    doc() {
        let result = '';
        while (this.next.type !== TokenType.EOF) {
            result += this.block();
        }

        return result;
    }
}