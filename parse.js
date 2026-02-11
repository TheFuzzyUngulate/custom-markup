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
    DOUBLE_LEFT_BRACK: 10,  // "[["
    RIGHT_BRACK: 11,        // "]"
    DOUBLE_RIGHT_BRACK: 12, // "]]"
    WORD_SPAN: 13,          // well...
    SPACE: 14,
}

function charIsSafe(char) {
  return char !== null && !/^[ \n*~\-=\[\]]$/.test(char);
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

            case '[':
                if (this.peek() === '[') {
                    this.advance();
                    return this.makeToken(TokenType.DOUBLE_LEFT_BRACK);
                } return this.makeToken(TokenType.LEFT_BRACK);

            case ']':
                if (this.peek() === ']') {
                    this.advance();
                    return this.makeToken(TokenType.DOUBLE_RIGHT_BRACK);
                } return this.makeToken(TokenType.RIGHT_BRACK);

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

    consume() {
        this.previous = this.next;
        this.next = this.scanner.scan();
        return this.previous;
    }

    emph(level) {
        let res = '';

        switch (this.next.type) {
            case TokenType.ASTERISK:
                this.consume();
                res = this.emph(level + 1);
                if (isTextType(this.next.type)) {
                    res += this.emph(level);
                } else if (this.next.type === TokenType.ASTERISK) {
                    this.consume();
                } return res;

            case TokenType.SPACE:
            case TokenType.WORD_SPAN:
                res = this.span({withEmph: true});
                if (this.next.type === TokenType.ASTERISK) {
                    this.consume();
                    switch (level % 4) {
                        case 1: return `<i>${res}</i>`;
                        case 2: return `<b>${res}</b>`;
                        case 3: return `<b><i>${res}</i></b>`;
                        case 0: return res;
                    }
                } else return `*${res}`
        }

        return '*'
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

        if (this.next.type === TokenType.LEFT_BRACK) {
            this.consume();
            let rest = this.span({withLinks: false});
            if (this.next.type === TokenType.RIGHT_BRACK) {
                this.consume();
                inner = rest;
            }
        }

        if (inner === undefined) inner = pref;
        if (!/^https?:\/\//.test(pref)) pref = "https://" + pref;
        return `<a href=\"${pref}\">${inner}</a>${suff}`;
    }

    word(withLinks) {
        if (withLinks) {
            if (this.previous.type === TokenType.WORD_SPAN) {
                return this.changeIfHref();
            }
        }

        return this.previous.text;
    }

    span({withEmph=true, withLinks=true}) {
        switch (this.consume().type) {
            case TokenType.HYPHEN:
                if (this.previous.text.length === 1) {
                    return '-';
                } else return '—'.repeat(this.previous.text.length -1);

            case TokenType.EQUALS_SEQ:
                return this.previous.text;

            case TokenType.SPACE:
            case TokenType.WORD_SPAN: {
                let res = this.word(withLinks);
                while (isTextType(this.next.type)) {
                    this.consume();
                    res += this.word(withLinks);
                }
                return res;
            }

            case TokenType.ASTERISK:
                return withEmph ? this.emph(1) : this.span();
            
            default:
                return '';
        }
    }

    line(withEmph=true) {
        let result = '';

        for (;;) {
            result += this.span({withEmph: withEmph});
            if (this.next.type === TokenType.EOF ||
                this.next.type === TokenType.PARAGRAPH_BREAK ||
                this.next.type === TokenType.LINE_BREAK) {
                return `<div>${result}</div>`;
            }
        }
    }

    paragraph() {
        let result = '';

        for (;;) {
            result += this.line(true);
            if (this.next.type === TokenType.LINE_BREAK) {
                this.consume();
            } else if (this.next.type === TokenType.EOF) {
                return result;
            } else if (this.next.type === TokenType.PARAGRAPH_BREAK) {
                this.consume();
                return `${result}<br>`;
            }
        }
    }

    blockquote() {
        return `<blockquote>${this.paragraph()}</blockquote>`;
    }

    header() {
        let delim = `h${this.previous.text.length}`;

        let result = this.line(false);
        if (this.next.type === TokenType.LINE_BREAK) {
            this.consume();
        }

        return `<${delim}>${result}</${delim}>`;
    }

    block() {
        switch (this.next.type) {
            case TokenType.EQUALS_SEQ:
                this.consume();
                return this.header();
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