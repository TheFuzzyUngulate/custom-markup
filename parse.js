const TokenType = {
    EOF: 0,
    LINE_BREAK: 1,
    PARAGRAPH_BREAK: 2,
    ASTERISK: 3,
    BACKQUOTE: 4,           // "`"
    TILDE: 5,
    UNDERLINE: 6,
    HYPHEN: 7,
    EQUALS_SEQ: 8,
    LEFT_BRACK: 9 ,         // "["
    RIGHT_BRACK: 10,        // "]"
    WORD_SPAN: 11,          // well...
    SPACE: 12,
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

// function isValidURL(url) {
//     if (url.startsWith('www.')) {
//         return URL.canParse('http://' + url);
//     } else return URL.canParse(url);
// }

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

            case '*': return this.makeToken(TokenType.ASTERISK);
            case '~': return this.makeToken(TokenType.TILDE);
            case '`': return this.makeToken(TokenType.BACKQUOTE);
            case '[': return this.makeToken(TokenType.LEFT_BRACK);
            case ']': return this.makeToken(TokenType.RIGHT_BRACK);

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
    }

    check(type) {
        return this.next.type === type;
    }

    consume() {
        this.previous = this.next;
        this.next = this.scanner.scan();
        return this.previous;
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
            return text;
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
        return `<a href=\"${pref}\">${inner}</a>${suff}`;
    }

    text0({takesURLs=true}) {
        let res = '';

        for (;;) {
            console.log("text0", this.next);
            switch (this.next.type) {
                case TokenType.WORD_SPAN:
                    this.consume();
                    if (takesURLs) {
                        res += this.changeIfHref();
                    } else {
                        res += this.previous.text;
                    }
                    break;

                case TokenType.TILDE:
                case TokenType.SPACE:
                    this.consume();
                    res += this.previous.text;
                    break;

                case TokenType.HYPHEN:
                    this.consume();
                    if (this.previous.text.length > 1) {
                        res += '—'.repeat(this.previous.text.length -1);
                    } else res += '-';
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
        
        // therefore, we need `takesCode` and `takesBracketed`.
        // later, though.

        let res = this.text0({takesURLs: false});
        console.log(res, this.next, this.previous);
        if (this.next.type === TokenType.BACKQUOTE) {
            this.consume();
            return `<code>${res}</code>`;
        } else {
            return `\`${res}`;
        }
    }

    text1({takesURLs=true}) {
        let res = '';

        for (;;) {
            console.log("text1", this.next);
            switch (this.next.type) {
                case TokenType.BACKQUOTE:
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
            console.log("text2", this.next);
            switch (this.next.type) {
                case TokenType.BACKQUOTE:
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

    block() {
        switch (this.next.type) {
            case TokenType.EQUALS_SEQ: {
                let len = this.next.text.length;
                this.consume();
                return this.header(len);
            }

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