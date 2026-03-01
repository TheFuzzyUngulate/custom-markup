export const TokenType = {
    EOF: 0,
    SPACE: 1,
    WORD_SPAN: 2,
    LINE_BREAK: 3,
    PARAGRAPH_BREAK: 4,
    EMPH_SYMB: 5,
    INCODE_SYMB: 6,
    CODEBLOCK_SYMB: 7,
    ASIDE_SYMB: 8,
    NL_ESCAPE: 9,
    TILDE: 10,
    UL_SYMB: 11,
    OL_SYMB: 12,
    HYPHEN: 13,
    HEADER_SYMB: 14,
    LEFT_BRACK: 15,
    RIGHT_BRACK: 16,
    REFERENCE: 17,
    SELECT: 18
}

function charIsAlnum(char) {
    return char !== null && /^[A-Za-z0-9]$/.test(char);
}

function charIsSafe(char) {
  return char !== null && !/^[ \n*~`\\\[\]]$/.test(char);
}

function charIsSpace(char) {
    return char !== null && /^\s$/.test(char);
}

export class Token {
    constructor(type, line, column, text) {
        this.text = text;
        this.type = type;
        this.line = line;
        this.column = column;
    }
}

export class Scanner {
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

    checkWordSpan() {
        while (charIsSafe(this.peek())) {
            this.advance();
        } return this.makeToken(TokenType.WORD_SPAN);
    }

    checkSelect() {
        if (this.peek() === '<') {
            if (!charIsAlnum(this.peekNext())) {
                return this.checkWordSpan();
            }

            this.advance()
            this.advance();

            while (charIsAlnum(this.peek())) {
                this.advance();
            }

            if (this.peek() === '>') {
                this.advance();
                return this.makeToken(TokenType.SELECT);
            }
        }

        return this.checkWordSpan();
    }

    checkReference() {
        if (this.peek() === '$') {
            if (!charIsAlnum(this.peekNext())) {
                return this.checkWordSpan();
            }

            this.advance();
            this.advance();

            while (charIsAlnum(this.peek())) {
                this.advance();
            } return this.makeToken(TokenType.REFERENCE);
        }

        return this.checkWordSpan();
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

            case '~': return this.makeToken(TokenType.TILDE);
            case '*': return this.makeToken(TokenType.EMPH_SYMB);
            case '[': return this.makeToken(TokenType.LEFT_BRACK);
            case ']': return this.makeToken(TokenType.RIGHT_BRACK);
            case '$': return this.checkSelect();
            case '>': return this.checkReference();
            
            case '`': 
                if (this.peek() === '`' && this.peekNext() === '`') {
                    this.advance();
                    this.advance();
                    return this.makeToken(TokenType.CODEBLOCK_SYMB);
                } else return this.makeToken(TokenType.INCODE_SYMB);
            
            case '.': 
                if (this.peek() === '.' && this.peekNext() === '.') {
                    this.advance();
                    this.advance();
                    return this.makeToken(TokenType.NL_ESCAPE);
                } else return this.makeToken(TokenType.WORD_SPAN);

            case ' ':
                while (this.peek() === ' ') {
                    this.advance();
                } return this.makeToken(TokenType.SPACE);

            case '+':
                while (this.peek() === '+') this.advance();
                if (this.peek() === ' ') {
                    this.advance();
                    return this.makeToken(TokenType.UL_SYMB);
                } else return this.makeToken(TokenType.WORD_SPAN);

            case ':':
                if (this.peek() === ':' && this.peekNext() === ' ') {
                    this.advance();
                    return this.makeToken(TokenType.ASIDE_SYMB);
                } return this.makeToken(TokenType.WORD_SPAN);

            case '#': 
                while (this.peek() === '#') {
                    this.advance();
                }
                if (this.peek() === ' ') {
                    this.advance();
                    return this.makeToken(TokenType.OL_SYMB);
                } else return this.makeToken(TokenType.WORD_SPAN);

            case '-':
                while (this.peek() === '-') {
                    this.advance();
                } return this.makeToken(TokenType.HYPHEN);

            case '=':
                for (let i = 0; i < 4; i++) {
                    if (this.peek() === ' ') {
                        return this.makeToken(TokenType.HEADER_SYMB);
                    } else if (this.peek() !== '=') {
                        return this.makeToken(TokenType.WORD_SPAN);
                    } this.advance();
                } return this.makeToken(TokenType.WORD_SPAN);

            // this is how escape characters are made.
            // anything can be cancelled as long as it isn't a space.

            case '\\':
                if (!charIsSpace(this.peek())) {
                    this.advance();
                } return this.makeToken(TokenType.WORD_SPAN); 

            default: return this.checkWordSpan();
        }
    }
}