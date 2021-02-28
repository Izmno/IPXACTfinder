export function newline(input: string, indent?: number): string {
    return indentString(input + '\n', indent);
}

export function indentString(input: string, spaces?: number): string {
    var s = input;
    for (var i = 0; i < (spaces || 0); i++) {
        s += ' ';
    }
    return s;
}

export function isMultiline(input: string): boolean {
    return input.indexOf('\n') >= 0; 
}

export function indentMultiline(input: string, indent: number, indentFirst?: boolean, newlineFirst?: boolean, newlineLast?: boolean): string {
    var lines = input.split('\n');

    var initialIndex = indentFirst? 0: 1;

    for (var i = initialIndex; i < lines.length; i++) {
        lines[i] = indentString(lines[i], indent)
    }

    var prefix = newlineFirst? '\n' : '';
    var suffix = newlineLast? '\n' : '';
    return prefix + lines.join('\n') + suffix;
}

export function prepareXMLText(input: string, indent: number): string {
    if (isMultiline(input)) {
        return indentMultiline(input, indent, true, true, true);
    } else {
        return input;
    }
}