const TokenType = {
    EOF: 0,
    LINE_BREAK: 1,
    PARAGRAPH_BREAK: 2,
    ASTERISK: 3,
    BACKQUOTE: 4,           // "`"
    TILDE: 5,
    UNDERLINE: 6,
    HYPHEN: 7,
    DOUBLE_HYPHEN: 8,       // "--"
    TRIPLE_HYPHEN: 9,       // "---"
    EQUALS_SEQ: 10,
    LEFT_BRACK: 11,         // "["
    DOUBLE_LEFT_BRACK: 12,  // "[["
    RIGHT_BRACK: 13,        // "]"
    DOUBLE_RIGHT_BRACK: 14, // "]]"
    TEXT_SPAN: 15,          // well...
}

function charIsSafe(char) {
  return char !== null && !/^[\n*~\-=\[\]]$/.test(char);
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

            case '`': return this.makeToken(TokenType.BACKQUOTE);

            case '\n':
                if (this.peek() === '\n') {
                    this.advance();
                    return this.makeToken(TokenType.PARAGRAPH_BREAK);
                } return this.makeToken(TokenType.LINE_BREAK);

            case '*': return this.makeToken(TokenType.ASTERISK);
            
            case '~': return this.makeToken(TokenType.TILDE);

            case '-':
                if (this.peek() === '-') {
                    this.advance();
                    if (this.peek() === '-') {
                        this.advance();
                        return this.makeToken(TokenType.TRIPLE_HYPHEN);
                    } return this.makeToken(TokenType.DOUBLE_HYPHEN);
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
                } return this.makeToken(TokenType.TEXT_SPAN);
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
                if (this.next.type === TokenType.TEXT_SPAN) {
                    res += this.emph(level);
                } else if (this.next.type === TokenType.ASTERISK) {
                    this.consume();
                } return res;

            case TokenType.TEXT_SPAN:
                res = this.span(true);
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

    span(withEmph=true) {
        switch (this.consume().type) {
            case TokenType.HYPHEN: return '-';
            case TokenType.DOUBLE_HYPHEN: return '—';
            case TokenType.TRIPLE_HYPHEN: return '——';
            case TokenType.EQUALS_SEQ:
                return this.previous.text;
            case TokenType.TEXT_SPAN:
                return this.previous.text;
            case TokenType.ASTERISK:
                return withEmph ? this.emph(1) : this.span();
            default:
                return '';
        }
    }

    line(withEmph=true) {
        let result = '';

        for (;;) {
            result += this.span(withEmph);
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
        console.log(this.next);
        switch (this.next.type) {
            case TokenType.EQUALS_SEQ:
                this.consume();
                return this.header();
            case TokenType.TRIPLE_HYPHEN:
                this.consume();
                return this.blockquote();
            default:
                return this.paragraph();
        }
    }

    parse() {
        let result = '';
        while (this.next.type !== TokenType.EOF) {
            result += this.block();
        }

        return result;
    }
}